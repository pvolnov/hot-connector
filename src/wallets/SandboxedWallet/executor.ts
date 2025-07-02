import { WalletManifest, WalletPermissions } from "../../types/wallet";
import { EventMap } from "../../types/wallet-events";
import { WalletSelector } from "../../selector";
import { AutoQueue } from "../../helpers/queue";
import { parseUrl } from "../../helpers/url";
import { uuid4 } from "../../helpers/uuid";

import IframeExecutor from "./iframe";
import getIframeCode from "./code";

class SandboxExecutor {
  private queue = new AutoQueue();
  private activePanels: Record<string, Window> = {};
  readonly origin = uuid4();
  readonly storageSpace: string;

  constructor(readonly selector: WalletSelector, readonly manifest: WalletManifest) {
    this.storageSpace = manifest.id;
  }

  checkPermissions(action: keyof WalletPermissions, params?: { url?: string }) {
    if (action === "open") {
      const openUrl = parseUrl(params?.url || "");
      const config = this.manifest.permissions[action];

      if (!openUrl || typeof config !== "object" || !config.allows) return false;
      const isAllowed = config.allows.some((path) => {
        const url = parseUrl(path);
        if (!url) return false;

        if (openUrl.protocol !== url.protocol) return false;
        if (!!url.hostname && openUrl.hostname !== url.hostname) return false;
        if (!!url.pathname && url.pathname !== "/" && openUrl.pathname !== url.pathname) return false;
        return true;
      });

      return isAllowed;
    }

    if (action === "parentFrame") {
      const origin = window.location.ancestorOrigins?.[0] ?? "";
      const parentFrame = this.manifest.permissions[action] as WalletPermissions["parentFrame"];
      if (!parentFrame) return false;
      return parentFrame.includes(origin);
    }

    return this.manifest.permissions[action];
  }

  get parentOrigin() {
    return window.location.ancestorOrigins?.[0];
  }

  get isParentFrame() {
    return this.manifest.permissions.parentFrame?.includes(this.parentOrigin);
  }

  _onMessage = async (iframe: IframeExecutor, event: MessageEvent) => {
    // Interact with parent frame, executor just a proxy between iframe and parent frame
    if (event.origin === this.parentOrigin && this.checkPermissions("parentFrame")) {
      iframe.postMessage(event.data);
      return;
    }

    if (event.data.origin !== this.origin) return;
    if (event.data.method === "ui.showIframe") {
      iframe.show();
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "ui.hideIframe") {
      iframe.hide();
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "storage.set" && this.checkPermissions("storage")) {
      localStorage.setItem(`${this.storageSpace}:${event.data.params.key}`, event.data.params.value);
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "storage.get" && this.checkPermissions("storage")) {
      const value = localStorage.getItem(`${this.storageSpace}:${event.data.params.key}`);
      iframe.postMessage({ ...event.data, status: "success", result: value });
      return;
    }

    if (event.data.method === "storage.keys" && this.checkPermissions("storage")) {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.storageSpace}:`));
      iframe.postMessage({ ...event.data, status: "success", result: keys });
      return;
    }

    if (event.data.method === "storage.remove" && this.checkPermissions("storage")) {
      localStorage.removeItem(`${this.storageSpace}:${event.data.params.key}`);
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "panel.focus") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.focus();
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "panel.postMessage") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.postMessage(event.data.params.data, "*");
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "panel.close") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.close();

      delete this.activePanels[event.data.params.windowId];
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "parentFrame.postMessage" && this.checkPermissions("parentFrame")) {
      window.parent.postMessage(event.data.params.data, "*");
      iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "open" && this.checkPermissions("open", event.data.params)) {
      // Open in Telegram Mini App
      const tgapp = typeof window !== "undefined" ? (window as any)?.Telegram?.WebApp : null;
      if (tgapp && event.data.params.url.startsWith("https://t.me")) {
        tgapp.openTelegramLink(event.data.params.url);
        return;
      }

      const panel = window.open(event.data.params.url, "_blank", event.data.params.features);
      const panelId = panel ? uuid4() : null;

      const handler = (ev: MessageEvent) => {
        const url = parseUrl(event.data.params.url);
        if (url && url.origin === ev.origin) {
          iframe.postMessage(ev.data);
        }
      };

      iframe.postMessage({ ...event.data, status: "success", result: panelId });
      window.addEventListener("message", handler);

      if (panel && panelId) {
        this.activePanels[panelId] = panel;
        const interval = setInterval(() => {
          if (!panel?.closed) return;

          window.removeEventListener("message", handler);
          const args = { method: "proxy-window:closed", windowId: panelId, origin: this.origin };
          delete this.activePanels[panelId];
          clearInterval(interval);

          try {
            iframe.postMessage(args);
          } catch {}
        }, 500);
      }

      return;
    }
  };

  async code() {
    const code = await getIframeCode(this);
    return code
      .replaceAll("window.localStorage", "window.sandboxedLocalStorage")
      .replaceAll("window.top", "window.selector")
      .replaceAll("window.open", "window.selector.open");
  }

  async call<T>(method: keyof EventMap, params: any): Promise<T> {
    return this.queue.enqueue(async () => {
      const iframe = new IframeExecutor(this, await this.code(), this._onMessage);
      await iframe.readyPromise;
      const id = uuid4();

      return new Promise<T>((resolve, reject) => {
        try {
          const handler = (event: MessageEvent) => {
            if (event.data.id !== id || event.data.origin !== this.origin) return;

            iframe.dispose();
            window.removeEventListener("message", handler);
            console.log("postMessage", { result: event.data, request: { method, params } });

            if (event.data.status === "failed") reject(event.data.result);
            else resolve(event.data.result);
          };

          window.addEventListener("message", handler);
          iframe.postMessage({ method, params, id, origin: this.origin });
          iframe.on("close", () => reject(new Error("Wallet closed")));
        } catch (e) {
          console.error(e);
          reject(e);
        }
      });
    });
  }

  async getAllStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.storageSpace}:`));
    const storage: Record<string, any> = {};

    for (const key of keys) {
      storage[key.replace(`${this.storageSpace}:`, "")] = localStorage.getItem(key);
    }

    return storage;
  }

  async clearStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.storageSpace}:`));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}

export default SandboxExecutor;
