import { EventEmitter } from "../../events";
import SandboxExecutor from "./executor";
import getIframeCode from "./code";

class IframeExecutor {
  private events = new EventEmitter<{ dispose: {} }>();
  private popup = document.createElement("div");
  private popupContent = document.createElement("div");
  private iframe = document.createElement("iframe");
  private _initializeTask: Promise<void> | null = null;

  constructor(readonly executor: SandboxExecutor) {
    this.popup.addEventListener("click", () => {
      this.events.emit("dispose", {});
      this.dispose();
    });
  }

  on(event: "dispose", callback: () => void) {
    this.events.on(event, callback);
  }

  show() {
    this.popup.style.display = "flex";
  }

  hide() {
    this.popup.style.display = "none";
  }

  async initialize() {
    if (!this._initializeTask) this._initializeTask = this._initialize();
    await this._initializeTask;
  }

  async code() {
    const code = await getIframeCode(this.executor);
    return code
      .replaceAll("window.localStorage", "window.sandboxedLocalStorage")
      .replaceAll("window.top", "window.selector")
      .replaceAll("window.open", "window.selector.open");
  }

  async _initialize() {
    this.iframe.setAttribute("sandbox", "allow-scripts");
    const iframeAllowedPersimissions = [];
    if (this.executor.checkPermissions("usb")) {
      iframeAllowedPersimissions.push("usb *;");
    }

    if (this.executor.checkPermissions("hid")) {
      iframeAllowedPersimissions.push("hid *;");
    }

    this.iframe.allow = iframeAllowedPersimissions.join(" ");
    this.iframe.srcdoc = await this.code();

    Object.assign(this.iframe.style, {
      display: "block",
      overflow: "hidden",
      width: "100%",
      height: "100%",
      border: "none",
    });

    Object.assign(this.popupContent.style, {
      backgroundColor: "var(--background-color)",
      borderRadius: "16px",
      overflow: "hidden",
      width: "400px",
      height: "600px",
    });

    Object.assign(this.popup.style, {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "10000000000",
      display: "none",
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
    });

    this.popupContent.appendChild(this.iframe);
    this.popup.appendChild(this.popupContent);
    document.body.appendChild(this.popup);
  }

  postMessage(data: any) {
    if (!this.iframe.contentWindow) throw new Error("Iframe not loaded");
    this.iframe.contentWindow.postMessage(data, "*");
  }

  dispose() {
    this.popup.remove();
  }
}

export default IframeExecutor;
