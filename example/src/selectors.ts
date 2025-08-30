import { createAppKit } from "@reown/appkit";
import { StellarWalletsKit, allowAllModules, WalletNetwork } from "@creit.tech/stellar-wallets-kit";
import { base, bsc, mainnet, solana } from "@reown/appkit/networks";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { TonConnect, TonConnectUI } from "@tonconnect/ui";

import { NearConnector } from "../../src";
import manifest from "../public/repository/manifest.json";

export const tonConnector = new TonConnect({ walletsListSource: "/wallets.json" });
export const tonConnectUI = new TonConnectUI({ connector: tonConnector, buttonRootId: "ton-connect" });

const projectId = "4eb7f418478b6a57b97d8d587e69801d";
const metadata = {
  name: "HOT Connector demo",
  description: "HOT Connector demo",
  url: "https://hotconnector.demo.hotlabs.io",
  icons: ["https://hotconnector.demo.hotlabs.io/favicon-beige.ico"],
};

export const nearConnector = new NearConnector({
  manifest: manifest as any,
  network: "mainnet",
  logger: console,
  walletConnect: {
    projectId,
    metadata,
  },
});

export const appKitModal = createAppKit({
  adapters: [new EthersAdapter(), new SolanaAdapter()],
  networks: [mainnet, solana, base, bsc],
  metadata,
  projectId,
  features: {
    onramp: false,
    email: false,
    emailShowWallets: false,
    socials: false,
    analytics: false,
    smartSessions: false,
    legalCheckbox: false,
  },
});

export const stellarKit = new StellarWalletsKit({
  network: WalletNetwork.PUBLIC,
  modules: allowAllModules(),
});
