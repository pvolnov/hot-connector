import { useEffect, useState } from "preact/hooks";

import { InjectedWallet } from "../wallets/InjectedWallet";
import { WalletSelector } from "../selector";
import { NearWallet } from "../types/wallet";
import { parseUrl } from "../utils";

import WalletPage from "./WalletPage";
import SelectorIntro from "./SelectorIntro";
import SelectorDebugMode from "./SelectorDebugMode";

type Props = {
  selector: WalletSelector;
  modal: { open: () => void; close: () => void };
};

export function WalletModal({ selector, modal }: Props) {
  const [isDebugEditor, setIsDebugEditor] = useState(false);
  const [isMobileVersion, setIsMobileVersion] = useState(window.innerWidth < 768);
  const [wallet, setWallet] = useState<NearWallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const handleWalletSelect = async (wallet: NearWallet) => {
    setOpened(false);
    setError(null);

    await selector.connect(wallet.manifest.id).catch((error) => {
      setError(error?.toString() ?? "Unknown error");
      setOpened(true);
    });
  };

  const selectWallet = (newWallet: NearWallet) => {
    setWallet(newWallet);
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    setOpened(false);
  };

  useEffect(() => {
    const handler = () => setIsMobileVersion(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    modal.open = () => setOpened(true);
    modal.close = () => setOpened(false);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const sidebar = (
    <div class="wallet-selector__modal-sidebar" onClick={(e) => e.stopPropagation()}>
      <div class="wallet-selector__header">
        <p>Select a wallet</p>
      </div>
      <div class="wallet-selector__options">
        {selector.availableWallets.map((w) => {
          return (
            <button
              class={`wallet-selector__option ${wallet === w ? "--selected" : ""}`}
              onClick={() => selectWallet(w)}
            >
              <img src={w.manifest.icon} />
              <div>
                <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
                  <h2>{w.manifest.name}</h2>
                  {w instanceof InjectedWallet && <p class="installed-badge">Installed</p>}
                </div>
                <p>{parseUrl(w.manifest.website)?.hostname}</p>
                {w.manifest.debug && <p style={{ color: "#888" }}>Debug wallet</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (isMobileVersion) {
    if (wallet) {
      return (
        <div class="wallet-selector__container" style={{ visibility: opened ? "visible" : "hidden" }}>
          <div class="wallet-selector__modal">
            <button class="wallet-selector__close" onClick={handleClose}>
              ✕
            </button>
            <button
              class="wallet-selector__close"
              style={{ position: "absolute", top: "12px", left: "12px" }}
              onClick={() => setWallet(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
              </svg>
            </button>
            <WalletPage wallet={wallet} error={error} handleWalletSelect={handleWalletSelect} />
          </div>
        </div>
      );
    }

    return (
      <div class="wallet-selector__container" style={{ visibility: opened ? "visible" : "hidden" }}>
        <div class="wallet-selector__modal">
          <button class="wallet-selector__close" onClick={handleClose}>
            ✕
          </button>
          {sidebar}
        </div>
      </div>
    );
  }

  return (
    <div
      class="wallet-selector__container"
      style={{ visibility: opened ? "visible" : "hidden" }}
      onClick={(e) => [e.stopPropagation(), handleClose()]}
    >
      <div class="wallet-selector__modal">
        {sidebar}

        <div
          class="wallet-selector__modal-content selector__view"
          style={{ position: "relative" }}
          onClick={(e) => e.stopPropagation()}
        >
          {(wallet != null || isDebugEditor) && (
            <button
              class="wallet-selector__close"
              style={{ position: "absolute", top: "12px", left: "12px" }}
              onClick={() => [setWallet(null), setIsDebugEditor(false)]}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
              </svg>
            </button>
          )}

          <button class="wallet-selector__close" onClick={handleClose}>
            ✕
          </button>

          {isDebugEditor && <SelectorDebugMode selector={selector} />}

          {!isDebugEditor && !!wallet && (
            <WalletPage wallet={wallet} error={error} handleWalletSelect={handleWalletSelect} />
          )}

          {!isDebugEditor && !wallet && (
            <SelectorIntro selector={selector} openDebugEditor={() => setIsDebugEditor(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
