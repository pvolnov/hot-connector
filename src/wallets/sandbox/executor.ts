import { EventMap } from "../../types/wallet-events";
import { EventEmitter } from "../../events";
import { uuid4 } from "../../utils/uuid";
import getIframeCode from "./getIframeCode";
import { Middleware, MiddlewareContext } from "./types";
import { WalletManifest } from "../../types/wallet";

class SandboxExecutor {
  private iframe?: HTMLIFrameElement;
  private _initializeTask: Promise<HTMLIFrameElement> | null = null;
  private middlewares: Middleware[] = [];
  readonly origin = uuid4();
  readonly id: string;

  constructor(
    readonly walletManifest: WalletManifest,
    readonly endpoint: string,
    readonly events: EventEmitter<EventMap>
  ) {
    this.id = walletManifest.id;
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  private checkPermissions(
    action: "storage" | "open" | "usb" | "hid",
    params?: {
      url?: string;
    }
  ) {
    if (action === "open") {
      const config = this.walletManifest.permissions[action];
      const openUrl = params?.url;

      if (!openUrl || typeof config !== "object" || !config.allows) {
        return false;
      }

      const allowsHostnames = config.allows.map((allow) => new URL(allow).hostname);

      if (!allowsHostnames.includes(openUrl)) {
        return false;
      }

      return true;
    }

    return this.walletManifest.permissions[action];
  }

  async _initialize() {
    this.iframe = document.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts");

    const iframeAllowedPersimissions = [];

    if (this.checkPermissions("usb")) {
      iframeAllowedPersimissions.push("usb *;");
    }

    if (this.checkPermissions("hid")) {
      iframeAllowedPersimissions.push("hid *;");
    }

    this.iframe.allow = iframeAllowedPersimissions.join(" ");

    this.iframe.srcdoc = await this.code();

    const content = document.querySelector(".wallet-selector__modal-content");

    if (content) {
      content.innerHTML = ``;
      content.appendChild(this.iframe);
    } else {
      throw new Error("No iframe content found");
    }

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

      if (event.data.method === "open" && this.checkPermissions("open", { url: event.data.params.url })) {
        if (event.data.params.newTab) {
          window.open(event.data.params.url, "_blank");
        } else {
          window.location.href = event.data.params.url;
        }

        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
        return;
      }

      if (event.data.method === "event") {
        this.events.emit(event.data.params.type, event.data.params.data);
      }

      if (event.data.method === "wallet-ready") {
        readyPromiseResolve();
      }
    });

    await readyPromise;
    return this.iframe;
  }

  async code() {
    const code = await getIframeCode(this.endpoint, this.origin);
    return code;
  }

  async call<T>(method: keyof EventMap, params: any): Promise<T> {
    if (!this._initializeTask || method === "wallet:signIn") this._initializeTask = this._initialize();
    const iframe = await this._initializeTask;

    const id = uuid4();

    const ctx: MiddlewareContext = {
      method,
      params,
      origin: this.origin,
    };

    const runMiddlewares = async (i = 0): Promise<any> => {
      const middleware = this.middlewares[i];
      if (!middleware) {
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
      }

      return middleware(ctx, () => runMiddlewares(i + 1));
    };

    return runMiddlewares();
  }

  async clearStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}

export default SandboxExecutor;
