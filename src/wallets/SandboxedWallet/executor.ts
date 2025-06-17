import { EventMap } from "../../types/wallet-events";
import { WalletManifest, WalletPermissions } from "../../types/wallet";
import { WalletSelector } from "../../selector";
import { parseUrl } from "../../utils/url";
import { uuid4 } from "../../utils/uuid";
import getIframeCode from "./iframe";

class SandboxExecutor {
  iframe?: HTMLIFrameElement;
  private _initializeTask: Promise<HTMLIFrameElement> | null = null;
  private activePanels: Record<string, Window> = {};

  readonly origin = uuid4();
  readonly id: string;

  private readyPromiseResolve!: (value: void) => void;
  private readyPromise = new Promise<void>((resolve, reject) => {
    this.readyPromiseResolve = resolve;
  });

  constructor(readonly selector: WalletSelector, readonly manifest: WalletManifest) {
    this.id = manifest.id;
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
        if (!!url.pathname && openUrl.pathname !== url.pathname) return false;
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
    window.removeEventListener("message", this._onMessage);
  }

  async initialize() {
    if (!this._initializeTask) this._initializeTask = this._initialize();
    const iframe = await this._initializeTask;
    return iframe;
  }

  async _initialize() {
    this.iframe = document.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts");
    this.iframe.style.display = "none";
    document.body.appendChild(this.iframe);

    const iframeAllowedPersimissions = [];
    if (this.checkPermissions("usb")) {
      iframeAllowedPersimissions.push("usb *;");
    }

    if (this.checkPermissions("hid")) {
      iframeAllowedPersimissions.push("hid *;");
    }

    this.iframe.allow = iframeAllowedPersimissions.join(" ");
    this.iframe.srcdoc = await this.code();

    window.addEventListener("message", this._onMessage);
    await this.readyPromise;
    return this.iframe;
  }

  get parentOrigin() {
    return window.location.ancestorOrigins?.[0];
  }

  get isParentFrame() {
    return this.manifest.permissions.parentFrame?.includes(this.parentOrigin);
  }

  _onMessage = (event: MessageEvent) => {
    console.log("onMessage", event, event.data.origin, this.origin);

    // Interact with parent frame, executor just a proxy between iframe and parent frame
    if (event.origin === this.parentOrigin && this.checkPermissions("parentFrame")) {
      this.iframe?.contentWindow?.postMessage(event.data, "*");
      return;
    }

    if (event.data.origin !== this.origin) return;
    if (event.data.method === "wallet-ready") {
      this.readyPromiseResolve();
    }

    if (event.data.method === "setStorage" && this.checkPermissions("storage")) {
      localStorage.setItem(`${this.id}:${event.data.params.key}`, event.data.params.value);
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
      return;
    }

    if (event.data.method === "getStorage" && this.checkPermissions("storage")) {
      const value = localStorage.getItem(`${this.id}:${event.data.params.key}`);
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: value }, "*");
      return;
    }

    if (event.data.method === "getStorageKeys" && this.checkPermissions("storage")) {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: keys }, "*");
      return;
    }

    if (event.data.method === "removeStorage" && this.checkPermissions("storage")) {
      localStorage.removeItem(`${this.id}:${event.data.params.key}`);
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
      return;
    }

    if (event.data.method === "windowFocus") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.focus();
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
      return;
    }

    if (event.data.method === "windowPostMessage") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.postMessage(event.data.params.data, "*");
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
      return;
    }

    if (event.data.method === "windowClose") {
      const panel = this.activePanels[event.data.params.windowId];
      if (panel) panel.close();

      delete this.activePanels[event.data.params.windowId];
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
      return;
    }

    if (event.data.method === "parentPostMessage" && this.checkPermissions("parentFrame")) {
      window.parent.postMessage(event.data.params.data, "*");
      this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
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
            this.iframe?.contentWindow?.postMessage(ev.data, "*");
          }
        };

        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: panelId }, "*");
        window.addEventListener("message", handler);

        if (panel && panelId) {
          this.activePanels[panelId] = panel;
          const interval = setInterval(() => {
            if (!panel?.closed) return;
            window.removeEventListener("message", handler);
            const args = { method: "proxy-window:closed", windowId: panelId, origin: this.origin };
            this.iframe?.contentWindow?.postMessage(args, "*");
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

  async code() {
    const code = await getIframeCode(this);
    return code
      .replaceAll("window.localStorage", "window.sandboxedLocalStorage")
      .replaceAll("window.top", "window.selector")
      .replaceAll("window.open", "window.selector.open");
  }

  async call<T>(method: keyof EventMap, params: any): Promise<T> {
    const iframe = await this.initialize();
    const id = uuid4();

    const methods = [
      "wallet:signIn",
      "wallet:signOut",
      "wallet:signMessage",
      "wallet:signAndSendTransaction",
      "wallet:signAndSendTransactions",
    ];

    return this.selector.executeIframe(iframe, methods.includes(method), () => {
      return new Promise<T>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          if (event.data.id !== id || event.data.origin !== this.origin) return;

          window.removeEventListener("message", handler);
          if (event.data.status === "failed") reject(event.data.result);
          else resolve(event.data.result);
        };

        window.addEventListener("message", handler);
        iframe.contentWindow?.postMessage({ method, params, id, origin: this.origin }, "*");
      });
    });
  }

  async getAllStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
    const storage: Record<string, any> = {};

    for (const key of keys) {
      storage[key.replace(`${this.id}:`, "")] = localStorage.getItem(key);
    }

    return storage;
  }

  async clearStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}

export default SandboxExecutor;
