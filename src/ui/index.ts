import { h, render } from "preact";
import { WalletSelector } from "../selector";
import { WalletModal } from "./WalletModal";

export class WalletSelectorUI {
  private container: HTMLElement;
  private opened = false;

  constructor(readonly selector: WalletSelector) {
    this.container = document.createElement("div");
    document.body.appendChild(this.container);

    this.render();
  }

  open() {
    this.opened = true;
    this.render();
  }

  close() {
    this.opened = false;
    this.render();
  }

  private render() {
    render(
      h(WalletModal, {
        opened: this.opened,
        selector: this.selector,
        onClose: () => this.close(),
        onOpen: () => this.open(),
      }),
      this.container
    );
  }
}
