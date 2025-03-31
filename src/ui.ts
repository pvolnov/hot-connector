import { WalletSelector } from "./selector";

export class WalletSelectorUI {
  private container: HTMLElement;
  private state: Record<string, any> = {};

  constructor(readonly selector: WalletSelector) {
    this.container = document.createElement("div");
    this.container.innerHTML = `
    <div class="wallet-selector__container">
      <div class="wallet-selector__modal">
          <button class="wallet-selector__close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </button>

        <div class="wallet-selector__modal-sidebar">
          <div class="wallet-selector__header">
              <p>Select a wallet</p>
          </div>
          <div class="wallet-selector__options"></div>
        </div>

        <div class="wallet-selector__modal-content">
            <div class="wallet-selector__modal-introduction">
                <h2>What is a Wallet?</h2>

                <div class="wallet-selector__modal-content-header-description">
                    <p>Secure & Manage Your Digital Assets</p>
                    <p>Safely store and transfer your crypto and NFTs.</p>
                </div>

                <div class="wallet-selector__modal-content-header-description">
                    <p>Log In to Any NEAR App</p>
                    <p>No need to create new accounts or credentials. Connect your wallet and you are good to go!</p>
                </div>
            </div>  
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(this.container);
    this.container.style.display = "none";
    this.render();

    window.addEventListener("click", async (e) => {
      if (e.target instanceof HTMLElement) {
        if (e.target.classList.contains("wallet-selector__close")) return this.close();
        if (e.target.classList.contains("wallet-selector__container")) return this.close();

        const id = e.target.dataset.id;
        if (!id) return;

        try {
          this.state[id] = { status: "connecting" };
          this.render();

          await this.selector.connect(id);

          this.state[id] = { status: "connected" };
          this.render();
          this.close();
        } catch (error) {
          console.error("Error connecting to wallet", error);
          this.state[id] = { status: "error", error };
          this.render();
        }
      }
    });

    this.selector.on("signedIn", ({ wallet }) => {
      this.state[wallet.manifest.id] = { status: "connected" };
      this.render();
    });

    this.selector.on("signedOut", () => {
      this.state = {};
      this.render();
    });
  }

  open() {
    this.render();
    this.container.style.display = "block";
  }

  close() {
    this.container.style.display = "none";
  }

  render() {
    const options = this.selector.wallets.map((wallet) => {
      return `<button class="wallet-selector__option" data-id="${wallet.manifest.id}">
            <img src="${wallet.manifest.icon}" />
            <div>
                <h2>${wallet.manifest.name}</h2>  
                <p>${new URL(wallet.manifest.website).hostname}</p>
            </div>
        </button>`;
    });

    const el = this.container.querySelector(".wallet-selector__options");
    if (el) el.innerHTML = options.join("");
  }
}
