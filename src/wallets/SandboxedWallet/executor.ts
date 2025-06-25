import { EventMap } from "../../types/wallet-events";
import { WalletManifest, WalletPermissions } from "../../types/wallet";
import { WalletSelector } from "../../selector";
import { parseUrl, uuid4 } from "../../utils";
import IframeExecutor from "./iframe";

class SandboxExecutor {
  private activePanels: Record<string, Window> = {};
  private iframe = new IframeExecutor(this);

  readonly origin = uuid4();
  readonly storageSpace: string;

  private readyPromiseResolve!: (value: void) => void;
  private readyPromise = new Promise<void>((resolve, reject) => {
    this.readyPromiseResolve = resolve;
  });

  constructor(readonly selector: WalletSelector, readonly manifest: WalletManifest) {
    this.storageSpace = `${manifest.id}:${manifest.version}:${manifest.executor}`;
    window.addEventListener("message", this._onMessage);
    this.iframe.on("dispose", () => this.dispose());
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

  async dispose() {
    this.iframe.dispose();
    window.removeEventListener("message", this._onMessage);
  }

  get parentOrigin() {
    return window.location.ancestorOrigins?.[0];
  }

  get isParentFrame() {
    return this.manifest.permissions.parentFrame?.includes(this.parentOrigin);
  }

  _onMessage = async (event: MessageEvent) => {
    // Interact with parent frame, executor just a proxy between iframe and parent frame
    if (event.origin === this.parentOrigin && this.checkPermissions("parentFrame")) {
      this.iframe.postMessage(event.data);
      return;
    }

    if (event.data.origin !== this.origin) return;
    if (event.data.method === "wallet-ready") {
      this.readyPromiseResolve();
    }

    if (event.data.method === "ui.showIframe") {
      this.iframe.show();
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "ui.hideIframe") {
      this.iframe.hide();
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "storage.set" && this.checkPermissions("storage")) {
      localStorage.setItem(`${this.storageSpace}:${event.data.params.key}`, event.data.params.value);
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "storage.get" && this.checkPermissions("storage")) {
      const value = localStorage.getItem(`${this.storageSpace}:${event.data.params.key}`);
      this.iframe.postMessage({ ...event.data, status: "success", result: value });
      return;
    }

    if (event.data.method === "storage.keys" && this.checkPermissions("storage")) {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.storageSpace}:`));
      this.iframe.postMessage({ ...event.data, status: "success", result: keys });
      return;
    }

    if (event.data.method === "storage.remove" && this.checkPermissions("storage")) {
      localStorage.removeItem(`${this.storageSpace}:${event.data.params.key}`);
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "panel.focus") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.focus();
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "panel.postMessage") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.postMessage(event.data.params.data, "*");
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "panel.close") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.close();

      delete this.activePanels[event.data.params.windowId];
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "parentFrame.postMessage" && this.checkPermissions("parentFrame")) {
      window.parent.postMessage(event.data.params.data, "*");
      this.iframe.postMessage({ ...event.data, status: "success", result: null });
      return;
    }

    if (event.data.method === "open" && this.checkPermissions("open", event.data.params)) {
      // Open in Telegram Mini App
      const tgapp = typeof window !== "undefined" ? (window as any)?.Telegram?.WebApp : null;
      if (tgapp && event.data.params.url.startsWith("https://t.me")) {
        tgapp.openTelegramLink(event.data.params.url);
        return;
      }

      if (event.data.params.newTab) {
        const panel = window.open(event.data.params.url, event.data.params.newTab, event.data.params.params);
        const panelId = panel ? uuid4() : null;

        const handler = (ev: MessageEvent) => {
          const url = parseUrl(event.data.params.url);
          if (url && url.origin === ev.origin) {
            this.iframe.postMessage(ev.data);
          }
        };

        this.iframe.postMessage({ ...event.data, status: "success", result: panelId });
        window.addEventListener("message", handler);

        if (panel && panelId) {
          this.activePanels[panelId] = panel;
          const interval = setInterval(() => {
            if (!panel?.closed) return;
            window.removeEventListener("message", handler);
            const args = { method: "proxy-window:closed", windowId: panelId, origin: this.origin };
            this.iframe.postMessage(args);
            delete this.activePanels[panelId];
            clearInterval(interval);
          }, 500);
        }

        return;
      }

      window.location.href = event.data.params.url;
      return;
    }
  };

  async call<T>(method: keyof EventMap, params: any): Promise<T> {
    await this.iframe.initialize();
    await this.readyPromise;
    const id = uuid4();

    return new Promise<T>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.id !== id || event.data.origin !== this.origin) return;

        window.removeEventListener("message", handler);
        if (event.data.status === "failed") reject(event.data.result);
        else resolve(event.data.result);
      };

      window.addEventListener("message", handler);
      this.iframe.postMessage({ method, params, id, origin: this.origin });
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
