import { useEffect, useState } from "preact/hooks";
import { SandboxWallet } from "../wallets/sandbox";
import { WalletSelector } from "../selector";
import { parseUrl } from "../utils/url";
import { NearWallet } from "../types/wallet";

import "./styles.css";

type Props = {
  opened: boolean;
  selector: WalletSelector;
  withoutSidebar?: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function WalletModal({ opened, selector, onClose, onOpen, withoutSidebar }: Props) {
  const [wallet, setWallet] = useState<NearWallet | null>(null);

  useEffect(() => {
    return () => {
      if (wallet instanceof SandboxWallet) {
        wallet.executor.iframe?.remove();
        const iframe = document.querySelector(".wallet-selector__modal-content.selector__iframe") as HTMLDivElement;
        const view = document.querySelector(".wallet-selector__modal-content.selector__view") as HTMLDivElement;
        iframe.style.display = "none";
        view.style.display = "block";
      }
    };
  }, [wallet]);

  const handleWalletSelect = async (wallet: NearWallet) => {
    if (wallet instanceof SandboxWallet) {
      const iframeView = document.querySelector(".wallet-selector__modal-content.selector__iframe") as HTMLDivElement;
      const view = document.querySelector(".wallet-selector__modal-content.selector__view") as HTMLDivElement;

      wallet.executor.initialize();
      iframeView.appendChild(wallet.executor.iframe!);
      iframeView.style.display = "block";
      view.style.display = "none";
    }

    await selector.connect(wallet.manifest.id);
    onClose();
  };

  return (
    <div
      class="wallet-selector__container"
      style={{ visibility: opened ? "visible" : "hidden" }}
      onClick={(e) => {
        const el = e.target as HTMLElement;
        if (el.classList.contains("wallet-selector__container") || el.classList.contains("wallet-selector__close")) {
          onClose();
        }
      }}
    >
      <div class="wallet-selector__modal">
        <button class="wallet-selector__close">✕</button>

        {!withoutSidebar && (
          <div class="selector__sidebar">
            <div class="wallet-selector__modal-sidebar">
              <div class="wallet-selector__header">
                <p>Select a wallet</p>
              </div>
              <div class="wallet-selector__options">
                {selector.wallets.map((w) => {
                  return (
                    <button
                      class={`wallet-selector__option ${wallet === w ? "--selected" : ""}`}
                      onClick={() => setWallet(w)}
                    >
                      <img src={w.manifest.icon} />
                      <div>
                        <h2>{w.manifest.name}</h2>
                        <p>{parseUrl(w.manifest.website)?.hostname}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div class="wallet-selector__modal-content selector__iframe" style={{ display: "none" }}></div>

        <div class="wallet-selector__modal-content selector__view">
          {wallet ? (
            <div class="wallet-intro">
              <img src={wallet.manifest.icon} />
              <h2>{wallet.manifest.name}</h2>
              <p>{wallet.manifest.description}</p>
              <button onClick={() => handleWalletSelect(wallet).catch(console.error)}>Connect</button>
            </div>
          ) : (
            <div style={{ padding: "16px" }}>
              <h2>What is a Wallet?</h2>
              <p>Secure & Manage Your Digital Assets</p>
              <p>Log In to Any NEAR App</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
