import {
  NearConnector,
  HotConnector,
  WalletType,
  NearWallet,
  EvmWallet,
  SolanaWallet,
  StellarWallet,
  TonWallet,
} from "@hot-labs/near-connect";
import { AuthCommitment, OmniToken, OmniTokenMetadata, TokenBalance } from "./types";

interface WibeClientOptions {
  projectId: string;
  name: string;
  description: string;
  url: string;
  icons: string[];
}

const initialConfig: WibeClientOptions = {
  projectId: "4eb7f418478b6a57b97d8d587e69801d",
  name: "Wibe3",
  description: "Wibe3",
  url: "https://wibe.io",
  icons: ["https://wibe.io/favicon.ico"],
};

class Wibe3Client {
  private wallet: NearWallet | EvmWallet | SolanaWallet | StellarWallet | TonWallet | null = null;

  constructor(private hotConnector: HotConnector) {
    this.hotConnector = hotConnector;
    this.hotConnector.options.onConnect = async (wallet) => {
      this.wallet = wallet;
    };

    this.hotConnector.options.onDisconnect = () => {
      this.wallet = null;
    };
  }

  static async initialize(options: WibeClientOptions = initialConfig) {
    const { createAppKit } = await import("@reown/appkit");
    const { StellarWalletsKit, allowAllModules, WalletNetwork } = await import("@creit.tech/stellar-wallets-kit");
    const { base, bsc, mainnet, solana } = await import("@reown/appkit/networks");
    const { EthersAdapter } = await import("@reown/appkit-adapter-ethers");
    const { SolanaAdapter } = await import("@reown/appkit-adapter-solana");
    const { TonConnectUI } = await import("@tonconnect/ui");

    const hasTonConnect = !!document.getElementById("ton-connect");
    if (!hasTonConnect) {
      const div = document.createElement("div");
      document.body.appendChild(div);
      div.id = "ton-connect";
      div.style.display = "none";
    }

    const hotConnector = new HotConnector({
      onConnect: () => {},
      onDisconnect: () => {},

      chains: [WalletType.NEAR, WalletType.EVM, WalletType.SOLANA, WalletType.TON, WalletType.STELLAR],
      stellarKit: new StellarWalletsKit({ network: WalletNetwork.PUBLIC, modules: allowAllModules() }),

      nearConnector: new NearConnector({ network: "mainnet" }),
      tonConnect: new TonConnectUI({ buttonRootId: "ton-connect" }),
      appKit: createAppKit({
        adapters: [new EthersAdapter(), new SolanaAdapter()],
        networks: [mainnet, solana, base, bsc],
        metadata: options,
        projectId: options.projectId,
        features: {
          onramp: false,
          email: false,
          emailShowWallets: false,
          socials: false,
          analytics: false,
          smartSessions: false,
          legalCheckbox: false,
        },
      }),
    });

    return new Wibe3Client(hotConnector);
  }

  async getBalance(token: OmniToken): Promise<TokenBalance> {
    if (!this.wallet) throw new Error("No wallet connected");
    const tradingAddress = await this.wallet.getIntentsAddress();
    const balances = await this.hotConnector.intents.getIntentsBalances([token], tradingAddress);
    const metadata = OmniTokenMetadata[token];
    return {
      int: balances[token] || 0n,
      id: metadata.contractId,
      float: Number(balances[token] || 0) / Math.pow(10, metadata.decimals),
      decimals: metadata.decimals,
      symbol: metadata.symbol,
    };
  }

  async isSignedIn() {
    return !!this.wallet;
  }

  async connect() {
    return this.hotConnector.connect();
  }

  async disconnect() {
    if (!this.wallet) throw new Error("No wallet connected");
    return this.hotConnector.disconnect(this.wallet?.type as WalletType);
  }

  async auth(): Promise<AuthCommitment> {
    if (!this.wallet) throw new Error("No wallet connected");
    const signed = await this.hotConnector.auth<AuthCommitment>(this.wallet?.type as WalletType, "wibe_auth", []);
    return {
      tradingAddress: await this.wallet!.getIntentsAddress(),
      ...signed,
    };
  }

  async withdraw() {}
}

export default Wibe3Client;
