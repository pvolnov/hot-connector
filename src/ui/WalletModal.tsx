import { useEffect, useState } from "preact/hooks";
import { WalletSelector } from "../selector";
import { SandboxWallet } from "../wallets/sandbox";

type Props = {
  opened: boolean;
  selector: WalletSelector;
  onClose: () => void;
  onOpen: () => void;
  withoutSidebar?: boolean;
};

export function WalletModal({ opened, selector, onClose, onOpen, withoutSidebar }: Props) {
  useEffect(() => {
    const addMiddleware = async () => {
      const wallet = await selector.wallet();

      if (wallet instanceof SandboxWallet) {
        wallet.use((ctx, next) => {
          switch (ctx.method) {
            case "wallet:signMessage":
              onOpen();
              return next();

            case "wallet:signAndSendTransaction":
              onOpen();
              return next();

            case "wallet:signAndSendTransactions":
              onOpen();
              return next();
          }

          return next();
        });
      }
    };

    selector.on("wallet:signIn", async (data) => {
      const id = data.accounts[0].accountId;
      await addMiddleware();
      onClose();
    });

    addMiddleware().catch(console.error);
  }, [selector]);

  const handleWalletSelect = async (id: string) => {
    try {
      await selector.connect(id);
      onClose();
    } catch (error) {
      console.error("Connection error", error);
    }
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
                {selector.wallets.map((wallet) => (
                  <button class="wallet-selector__option" onClick={() => handleWalletSelect(wallet.manifest.id)}>
                    <img src={wallet.manifest.icon} />
                    <div>
                      <h2>{wallet.manifest.name}</h2>
                      <p>{new URL(wallet.manifest.website).hostname}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div class="wallet-selector__modal-content">
          <h2>What is a Wallet?</h2>
          <p>Secure & Manage Your Digital Assets</p>
          <p>Log In to Any NEAR App</p>
        </div>
      </div>
    </div>
  );
}
