import { Popup } from "./Popup";

export class LogoutPopup extends Popup {
  constructor(readonly delegate: { onApprove: () => void; onReject: () => void }) {
    super(delegate);
  }

  create() {
    super.create({ show: true });
    this.root.querySelector("button")?.addEventListener("click", () => this.delegate.onApprove());
  }

  get dom() {
    return `
        <div class="modal-container">
          <div class="modal-content">
            <div class="modal-header">
              <p>Disconnect</p>
            </div>
  
            <div class="modal-body">
              <p style="text-align: center; color: #fff">Your local session will be cleared, see you there!</p>
              <button>Bye-bye</button>
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
