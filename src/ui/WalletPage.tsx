import { NearWallet } from "../types/wallet";

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

        <button onClick={() => handleWalletSelect(wallet)}>Connect</button>
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

export default WalletPage;
