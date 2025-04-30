import { useEffect, useState } from "preact/hooks";
import { WalletSelector } from "../selector";
import { SandboxWallet } from "../wallets/sandbox";
import "./styles.css";

type Props = {
  opened: boolean;
  selector: WalletSelector;
  onClose: () => void;
  onOpen: () => void;
  withoutSidebar?: boolean;
};

export function WalletModal({ opened, selector, onClose, onOpen, withoutSidebar }: Props) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  useEffect(() => {
    selector.wallet().then((wallet) => {
      console.log("wallet", wallet);
      if (wallet) setSelectedWallet(wallet.manifest.id);
    });
  }, []);

  useEffect(() => {
    const selectedWallet = localStorage.getItem("selected-wallet");
    if (selectedWallet) {
      setSelectedWallet(selectedWallet);
    }
  }, []);

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
      setSelectedWallet(id);
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
      <div class="wallet-selector__modal" style={{ visibility: opened ? "visible" : "hidden" }}>
        <button class="wallet-selector__close">✕</button>

        {!withoutSidebar && (
          <div class="selector__sidebar">
            <div class="wallet-selector__modal-sidebar">
              <div class="wallet-selector__header">
                <p>Select a wallet</p>
              </div>
              <div class="wallet-selector__options">
                {selector.wallets.map((wallet) => {
                  let url = "Unknown website";

                  try {
                    url = new URL(wallet.manifest.website).hostname;
                  } catch (error) {
                    console.error("Invalid website", error);
                  }

                  return (
                    <button
                      class={`wallet-selector__option ${selectedWallet === wallet.manifest.id ? "--selected" : ""}`}
                      onClick={() => handleWalletSelect(wallet.manifest.id)}
                    >
                      <img src={wallet.manifest.icon} />
                      <div>
                        <h2>{wallet.manifest.name}</h2>
                        <p>{url}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div class="wallet-selector__modal-content">
          <div style={{ padding: "16px" }}>
            <h2>What is a Wallet?</h2>
            <p>Secure & Manage Your Digital Assets</p>
            <p>Log In to Any NEAR App</p>
          </div>
        </div>
      </div>
    </div>
  );
}
