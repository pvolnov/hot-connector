import { useEffect, useState } from "preact/hooks";
import { WalletSelector } from "../selector";
import { NearWallet } from "../types/wallet";
import { parseUrl } from "../utils/url";
import { InjectedWallet } from "../wallets/InjectedWallet";

type Props = {
  selector: WalletSelector;
  modal: { open: () => void; close: () => void };
};

const platformLabel = {
  android: "Android",
  ios: "iOS",
  web: "Web App",
  tga: "Telegram Mini App",
  firefox: "Firefox Extension",
  chrome: "Chrome Extension",
};

const WalletPage = ({
  wallet,
  error,
  handleWalletSelect,
}: {
  wallet: NearWallet;
  error: string | null;
  handleWalletSelect: (wallet: NearWallet) => Promise<void>;
}) => {
  return (
    <div class="wallet-intro">
      <div>
        <img src={wallet.manifest.icon} />
        <h2>{wallet.manifest.name}</h2>
        <p>{wallet.manifest.description}</p>

        {error && <p class="wallet-selector__error">{error}</p>}

        <button onClick={() => handleWalletSelect(wallet).catch(console.error)}>Connect</button>
      </div>

      <div class="wallet-selector__platforms">
        {Object.entries(wallet.manifest.platform || {}).map(([platform, url]) => {
          return <a href={url}>{platformLabel[platform as keyof typeof platformLabel] || platform}</a>;
        })}

        <a href={wallet.manifest.website}>Website</a>
      </div>
    </div>
  );
};

const SelectorIntro = ({ selector, openDebugEditor }: { selector: WalletSelector; openDebugEditor: () => void }) => {
  return (
    <div style={{ padding: "32px" }} class="selector-intro">
      <h2>What is a Wallet?</h2>

      <div class="selector-intro__items">
        <div class="selector-intro__item">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M33.5 1.83325L30.1666 5.16658M17.4818 17.8514C19.1406 19.5103 20.1666 21.8019 20.1666 24.3333C20.1666 29.3959 16.0626 33.4999 11 33.4999C5.93735 33.4999 1.8333 29.3959 1.8333 24.3333C1.8333 19.2706 5.93735 15.1666 11 15.1666C13.5313 15.1666 15.8229 16.1926 17.4818 17.8514ZM17.4818 17.8514L24.3333 10.9999M24.3333 10.9999L29.3333 15.9999L35.1666 10.1666L30.1666 5.16658M24.3333 10.9999L30.1666 5.16658"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          <div>
            <p>Secure & Manage Your Digital Assets</p>
            <p>Safely store and transfer your crypto and NFTs.</p>
          </div>
        </div>

        <div class="selector-intro__item">
          <svg width="40" height="41" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28.3333" cy="23.8333" r="1.66667" fill="currentColor"></circle>
            <path
              d="M35 12.1667H7C5.89543 12.1667 5 11.2712 5 10.1667V7.5C5 6.39543 5.89543 5.5 7 5.5H31.6667"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path
              d="M35 12.1667V35.5H7C5.89543 35.5 5 34.6046 5 33.5V8.83334"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          <div>
            <p>Log In to Any NEAR App</p>
            <p>No need to create new accounts or credentials. Connect your wallet and you are good to go!</p>
          </div>
        </div>
      </div>

      <div class="selector-intro__dev" onClick={openDebugEditor}>
        <p>Manifest version: {selector.manifest.version}</p>
      </div>
    </div>
  );
};

export function WalletModal({ selector, modal }: Props) {
  const [isDebugEditor, setIsDebugEditor] = useState(false);
  const [debugManifest, setDebugManifest] = useState(
    JSON.stringify(
      {
        id: "yet-another-wallet",
        name: "Yet Another Wallet",
        icon: "https://yet-another-wallet.app/logo.svg",
        description: "Yet another wallet for NEAR Protocol",
        website: "https://yet-another-wallet.app/",
        version: "1.0.0",
        executor: "https://yet-another-wallet.app/script.js",
        type: "sandbox",

        platform: { web: "", chrome: "" },
        permissions: {
          storage: true,
          open: { allows: ["https://yet-another-wallet.app"] },
        },
      },
      null,
      2
    )
  );

  const [isMobileVersion, setIsMobileVersion] = useState(window.innerWidth < 768);
  const [wallet, setWallet] = useState<NearWallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const handleWalletSelect = async (wallet: NearWallet) => {
    setOpened(false);
    setError(null);
    await selector.connect(wallet.manifest.id).catch(() => setOpened(true));
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

    selector.executeIframe = async (iframe, render, execute) => {
      if (!render) return await execute();

      const wrapper = document.createElement("div");
      wrapper.classList.add("wallet-selector__container");
      iframe.parentElement!.insertBefore(wrapper, iframe);

      return new Promise(async (resolve, reject) => {
        try {
          setOpened(false);
          wrapper.onclick = () => {
            reject(new Error("User rejected"));
            setError("User rejected");
            iframe.style.display = "none";
            wrapper.remove();
          };

          iframe.classList.add("wallet-selector__modal");
          iframe.style.display = "block";
          const result = await execute();
          iframe.style.display = "none";
          wrapper.remove();
          resolve(result);
        } catch (error) {
          setOpened(true);
          setError(error?.toString() ?? "Unknown error");
          iframe.style.display = "none";
          wrapper.remove();
          reject(error);
        }
      });
    };

    return () => window.removeEventListener("resize", handler);
  }, []);

  const sidebar = (
    <div class="wallet-selector__modal-sidebar" onClick={(e) => e.stopPropagation()}>
      <div class="wallet-selector__header">
        <p>Select a wallet</p>
      </div>
      <div class="wallet-selector__options">
        {selector.wallets.map((w) => {
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

          {isDebugEditor && (
            <div style={{ padding: "32px" }} class="wallet-intro">
              <h2>Add debug wallet</h2>

              <textarea
                style={{
                  width: "100%",
                  height: "400px",
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  resize: "vertical",
                }}
                value={debugManifest}
                onChange={(e) => setDebugManifest(e.currentTarget.value)}
              />

              <button
                onClick={() => {
                  try {
                    const manifest = JSON.parse(debugManifest);
                    selector.registerDebugWallet(manifest);
                  } catch (error) {
                    console.error(error);
                    alert("Invalid manifest");
                  }
                }}
              >
                Add to manifest
              </button>
            </div>
          )}

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
