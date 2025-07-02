import { h, render } from "preact";
import { WalletSelector } from "../selector";
import { WalletModal } from "./WalletModal";

export class WalletSelectorUI {
  private container: HTMLElement;

  constructor(readonly selector: WalletSelector) {
    this.container = document.createElement("div");
    document.body.appendChild(this.container);
    this.render();

    this.selector.on("selector:manifestUpdated", () => {
      this.render();
    });

    this.selector.on("selector:walletsChanged", () => {
      this.render();
    });
  }

  open() {}

  close() {}

  private render() {
    render(h(WalletModal, { selector: this.selector, modal: this }), this.container);
  }
}
