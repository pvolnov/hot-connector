import { parseUrl } from "../helpers/url";
import { WalletType } from "../types/multichain";
import { WalletManifest } from "../types/wallet";
import { Popup } from "./Popup";

export class NearWalletsPopup extends Popup {
  constructor(
    readonly delegate: {
      wallets: WalletManifest[];
      onSelect: (id: string) => void;
      onReject: () => void;
    }
  ) {
    super(delegate);
  }

  create() {
    super.create({ show: true });
    this.root.querySelectorAll(".connect-item").forEach((item) => {
      if (!(item instanceof HTMLDivElement)) return;
      item.addEventListener("click", () => {
        this.delegate.onSelect(item.dataset.type!);
      });
    });
  }

  address(type: WalletType) {
    if (!this.state[type]) return null;
    return `${this.state[type].slice(0, 6)}...${this.state[type].slice(-4)}`;
  }

  walletDom(wallet: WalletManifest) {
    return `
			<div class="connect-item" data-type="${wallet.id}">
				<img style="background: #333" src="${wallet.icon}" alt="${wallet.name}" />
				<div class="connect-item-info">
					<span>${wallet.name}</span>
					<span class="wallet-address">${parseUrl(wallet.website)?.hostname}</span>
				</div>
			</div>
    `;
  }

  get dom() {
    return `
			<div class="modal-container">
				<div class="modal-content">
					<div class="modal-header">
						<p>Select wallet</p>
					</div>

					<div class="modal-body">
						${this.delegate.wallets.map((wallet) => this.walletDom(wallet)).join("")}
					</div>

					<div class="footer">
						<img src="https://tgapp.herewallet.app/images/hot/hot-icon.png" alt="HOT Connector" />
						<p>HOT Connector</p>
						<p class="get-wallet-link">Don't have a wallet?</p>
					</div>
				</div>
			</div>`;
  }
}
