import { EventEmitter } from "../../events";
import SandboxExecutor from "./executor";

class IframeExecutor {
  private events = new EventEmitter<{ close: {} }>();
  private popup = document.createElement("div");
  private popupContent = document.createElement("div");
  private iframe = document.createElement("iframe");
  private handler: (event: MessageEvent<any>) => void;

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

    this.popupContent.appendChild(this.iframe);
    this.popup.appendChild(this.popupContent);
    document.body.appendChild(this.popup);

    this.popupContent.classList.add("iframe-widget__popup");
    this.popup.classList.add("iframe-widget__container");

    this.popup.addEventListener("click", () => {
      window.removeEventListener("message", this.handler);
      this.events.emit("close", {});
      this.popup.remove();
    });

    this.handler = (event: MessageEvent<any>) => onMessage(this, event);
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
    console.log("dispose", this.popup);
    this.popup.remove();
    window.removeEventListener("message", this.handler);
  }
}

export default IframeExecutor;
