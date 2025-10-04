import { createAppKit } from "@reown/appkit";
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
import { StellarWalletsKit, allowAllModules, WalletNetwork } from "@creit.tech/stellar-wallets-kit";
import { base, bsc, mainnet, solana } from "@reown/appkit/networks";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { TonConnectUI } from "@tonconnect/ui";
import { AuthCommitment, OmniToken, OmniTokenMetadata } from "./types";

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

  static initialize(options: WibeClientOptions = initialConfig) {
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

  async getBalance(
    token: OmniToken
  ): Promise<{ id: string; int: bigint; float: number; decimals: number; symbol: string }> {
    const balance = await this.hotConnector.intents.viewMethod("intents.near", "get_balance", { token: token });
    const metadata = OmniTokenMetadata[token];
    return {
      int: BigInt(balance),
      id: metadata.contractId,
      float: balance / Math.pow(10, metadata.decimals),
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
