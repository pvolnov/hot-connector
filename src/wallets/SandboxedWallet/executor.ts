import { EventMap } from "../../types/wallet-events";
import { WalletManifest } from "../../types/wallet";
import { WalletSelector } from "../../selector";
import { parseUrl } from "../../utils/url";
import { uuid4 } from "../../utils/uuid";
import getIframeCode from "./iframe";

class SandboxExecutor {
  iframe?: HTMLIFrameElement;
  private _initializeTask: Promise<HTMLIFrameElement> | null = null;

  readonly origin = uuid4();
  readonly id: string;

  constructor(readonly selector: WalletSelector, readonly manifest: WalletManifest) {
    this.id = manifest.id;
  }

  private checkPermissions(action: "storage" | "open" | "usb" | "hid", params?: { url?: string }) {
    if (action === "open") {
      const openUrl = parseUrl(params?.url || "");
      const config = this.manifest.permissions[action];

      if (!openUrl || typeof config !== "object" || !config.allows) return false;
      const allowsHostnames = config.allows.map((allow) => parseUrl(allow)?.hostname);
      return allowsHostnames.some((hostname) => openUrl?.hostname === hostname);
    }

    return this.manifest.permissions[action];
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

    let readyPromiseResolve: (value: void) => void;
    const readyPromise = new Promise<void>((resolve, reject) => {
      readyPromiseResolve = resolve;
    });

    window.addEventListener("message", async (event) => {
      if (event.data.origin !== this.origin) return;

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

      if (event.data.method === "open" && this.checkPermissions("open", event.data.params)) {
        console.log("open", event.data.params);
        if (event.data.params.newTab) {
          window.open(event.data.params.url, "_blank");
        } else {
          window.location.href = event.data.params.url;
        }

        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
        return;
      }

      if (event.data.method === "wallet-ready") {
        readyPromiseResolve();
      }
    });

    await readyPromise;
    return this.iframe;
  }

  async code() {
    const code = await getIframeCode(this.manifest.executor, this.origin);
    return code;
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

  async clearStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}

export default SandboxExecutor;
