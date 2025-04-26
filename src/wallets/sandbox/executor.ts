import { EventMap } from "../../types/wallet-events";
import { EventEmitter } from "../../events";
import { uuid4 } from "../../utils/uuid";
import getIframeCode from "./getIframeCode";
import { Middleware, MiddlewareContext } from "./types";

class SandboxExecutor {
  private iframe?: HTMLIFrameElement;
  private _initializeTask: Promise<HTMLIFrameElement> | null = null;
  private middlewares: Middleware[] = [];
  readonly origin = uuid4();

  constructor(readonly id: string, readonly endpoint: string, readonly events: EventEmitter<EventMap>) {
    this.id = id;
  }

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  async _initialize() {
    this.iframe = document.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts");

    this.iframe.allow = "usb *; hid *;"; // TODO: Add permissions for use usb and hid
    this.iframe.srcdoc = await this.code();

    const content = document.querySelector(".wallet-selector__modal-content");

    if (content) {
      content.innerHTML = ``;
      content.appendChild(this.iframe);
    }

    let readyPromiseResolve: (value: void) => void;
    const readyPromise = new Promise<void>((resolve, reject) => {
      readyPromiseResolve = resolve;
    });

    window.addEventListener("message", (event) => {
      if (event.data.origin !== this.origin) return;

      if (event.data.method === "setStorage") {
        // TODO: Add permissions for use storage
        localStorage.setItem(`${this.id}:${event.data.params.key}`, event.data.params.value);
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
        return;
      }

      if (event.data.method === "getStorage") {
        // TODO: Add permissions for use storage
        const value = localStorage.getItem(`${this.id}:${event.data.params.key}`);
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: value }, "*");
        return;
      }

      if (event.data.method === "getStorageKeys") {
        // TODO: Add permissions for use storage
        const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: keys }, "*");
        return;
      }

      if (event.data.method === "removeStorage") {
        // TODO: Add permissions for use storage
        localStorage.removeItem(`${this.id}:${event.data.params.key}`);
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
        return;
      }

      if (event.data.method === "open") {
        // TODO: Add permissions for opening new tabs
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
    if (!this._initializeTask) this._initializeTask = this._initialize();
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
