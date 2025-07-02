import { EventEmitter } from "../../helpers/events";
import SandboxExecutor from "./executor";

class IframeExecutor {
  private events = new EventEmitter<{ close: {} }>();
  private popup = document.createElement("div");
  private popupContent = document.createElement("div");
  private iframe = document.createElement("iframe");
  private handler: (event: MessageEvent<any>) => void;

  private readyPromiseResolve!: (value: void) => void;
  readonly readyPromise = new Promise<void>((resolve) => {
    this.readyPromiseResolve = resolve;
  });

  constructor(
    readonly executor: SandboxExecutor,
    code: string,
    onMessage: (iframe: IframeExecutor, event: MessageEvent) => void
  ) {
    this.iframe.setAttribute("sandbox", "allow-scripts");

    const iframeAllowedPersimissions = [];
    if (this.executor.checkPermissions("usb")) {
      iframeAllowedPersimissions.push("usb *;");
    }

    if (this.executor.checkPermissions("hid")) {
      iframeAllowedPersimissions.push("hid *;");
    }

    this.iframe.allow = iframeAllowedPersimissions.join(" ");
    this.iframe.srcdoc = code;

    this.popupContent.classList.add("iframe-widget__popup");
    this.popup.classList.add("iframe-widget__container");

    this.popupContent.appendChild(this.iframe);
    this.popup.appendChild(this.popupContent);
    document.body.appendChild(this.popup);

    this.popup.addEventListener("click", () => {
      window.removeEventListener("message", this.handler);
      this.events.emit("close", {});
      this.popup.remove();
    });

    this.handler = (event: MessageEvent<any>) => {
      onMessage(this, event);
      if (event.data.origin !== this.executor.origin) return;
      if (event.data.method === "wallet-ready") this.readyPromiseResolve();
    };

    window.addEventListener("message", this.handler);
  }

  on(event: "close", callback: () => void) {
    this.events.on(event, callback);
  }

  show() {
    this.popup.style.display = "flex";
  }

  hide() {
    this.popup.style.display = "none";
  }

  postMessage(data: any) {
    if (!this.iframe.contentWindow) throw new Error("Iframe not loaded");
    this.iframe.contentWindow.postMessage(data, "*");
  }

  dispose() {
    window.removeEventListener("message", this.handler);
    this.popup.remove();
  }
}

export default IframeExecutor;
