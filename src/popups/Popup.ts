import { css } from "./styles";

const ID = "hot-connector-popup";

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = css(`.${ID}`);
  document.head.append(style);
}

export class Popup {
  isClosed = false;
  root = document.createElement("div");
  state: Record<string, any> = {};

  constructor(readonly delegate: { onReject: () => void }) {}

  get dom() {
    return "";
  }

  update(state: Record<string, any>) {
    this.state = state;
    this.root.innerHTML = this.dom;
  }

  create({ show = true }: { show?: boolean }) {
    this.root.className = ID;
    this.root.innerHTML = this.dom;
    document.body.append(this.root);

    const modalContainer = this.root.querySelector(".modal-container")! as HTMLElement;
    const modalContent = this.root.querySelector(".modal-content")! as HTMLElement;
    const getWalletLink = this.root.querySelector(".get-wallet-link")! as HTMLElement;

    modalContent.style.transform = "translateY(50px)";
    modalContainer.style.opacity = "0";
    this.root.style.display = "none";

    modalContent.addEventListener("click", (e) => e.stopPropagation());
    getWalletLink.addEventListener("click", () => window.open("https://download.hot-labs.org?hotconnector", "_blank"));
    modalContainer.addEventListener("click", () => {
      this.delegate.onReject();
      this.destroy();
    });

    if (show) {
      setTimeout(() => this.show(), 10);
    }
  }

  show() {
    const modalContainer = this.root.querySelector(".modal-container")! as HTMLElement;
    const modalContent = this.root.querySelector(".modal-content")! as HTMLElement;

    modalContent.style.transform = "translateY(50px)";
    modalContainer.style.opacity = "0";
    this.root.style.display = "block";

    setTimeout(() => {
      modalContent.style.transform = "translateY(0)";
      modalContainer.style.opacity = "1";
    }, 100);
  }

  hide() {
    const modalContainer = this.root.querySelector(".modal-container")! as HTMLElement;
    const modalContent = this.root.querySelector(".modal-content")! as HTMLElement;
    modalContent.style.transform = "translateY(50px)";
    modalContainer.style.opacity = "0";

    setTimeout(() => {
      this.root.style.display = "none";
    }, 200);
  }

  destroy() {
    if (this.isClosed) return;
    this.isClosed = true;
    this.hide();
    setTimeout(() => {
      this.root.remove();
    }, 200);
  }
}
