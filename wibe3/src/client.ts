import { useState, useCallback, useEffect } from "react";
import {
  ChainAbstracted,
  NearConnector,
  HotConnector,
  WalletType,
  NearWallet,
  EvmWallet,
  SolanaWallet,
  StellarWallet,
  TonWallet,
  EventEmitter,
} from "@hot-labs/near-connect";
import { HotBridge, utils } from "@hot-labs/omni-sdk";
import { StellarWalletsKit, allowAllModules, WalletNetwork } from "@creit.tech/stellar-wallets-kit";
import { base, bsc, mainnet, solana } from "@reown/appkit/networks";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { TonConnect, TonConnectUI } from "@tonconnect/ui";
import { createAppKit } from "@reown/appkit";

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

const hotBridge = new HotBridge({});

export class Wibe3Client {
  private hotConnector: HotConnector;
  wallet: NearWallet | EvmWallet | SolanaWallet | StellarWallet | TonWallet | null = null;
  balances: TokenBalance[] = [];
  events = new EventEmitter<{
    connect: { wallet: ChainAbstracted };
    "balance:changed": { balances: TokenBalance[] };
    disconnect: {};
  }>();

  onConnect: (wallet: ChainAbstracted) => void = () => {};
  onDisconnect: () => void = () => {};

  constructor(config: WibeClientOptions = initialConfig) {
    const hasTonConnect = !!document.getElementById("ton-connect");
    if (!hasTonConnect) {
      const div = document.createElement("div");
      document.body.appendChild(div);
      div.id = "ton-connect";
      div.style.display = "none";
    }

    this.hotConnector = new HotConnector({
      onConnect: (wallet) => {
        this.wallet = wallet;
        this.balances = [];
        this.events.emit("connect", { wallet: wallet as ChainAbstracted });
        this.events.emit("balance:changed", { balances: [] });
        this.refreshBalances();
      },

      onDisconnect: () => {
        this.wallet = null;
        this.balances = [];
        this.events.emit("balance:changed", { balances: [] });
        this.events.emit("disconnect", {});
      },

      chains: [WalletType.NEAR, WalletType.EVM, WalletType.SOLANA, WalletType.TON, WalletType.STELLAR],
      stellarKit: new StellarWalletsKit({ network: WalletNetwork.PUBLIC, modules: allowAllModules() }),
      nearConnector: new NearConnector({ network: "mainnet" }),
      tonConnect: new TonConnectUI({ connector: new TonConnect(), buttonRootId: "ton-connect" }),
      appKit: createAppKit({
        adapters: [new EthersAdapter(), new SolanaAdapter()],
        networks: [mainnet, solana, base, bsc],
        projectId: config.projectId,
        metadata: config,
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
  }

  async refreshBalances() {
    this.balances = await this.getBalances(Object.values(OmniToken));
    this.events.emit("balance:changed", { balances: this.balances });
  }

  async getBalances(tokens: OmniToken[]): Promise<TokenBalance[]> {
    if (!this.wallet) throw new Error("No wallet connected");
    const tradingAddress = await this.wallet.getIntentsAddress();
    const balances = await this.hotConnector.intents.getIntentsBalances(tokens, tradingAddress);

    return tokens.map((token) => {
      const metadata = OmniTokenMetadata[token];
      const icon = `https://storage.herewallet.app/ft/1010:${metadata.contractId}.png`;

      return {
        icon,
        int: balances[token] || 0n,
        id: metadata.contractId,
        float: Number(balances[token] || 0) / Math.pow(10, metadata.decimals),
        decimals: metadata.decimals,
        symbol: metadata.symbol,
      };
    });
  }

  get isSignedIn() {
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

  async withdraw(args: { token: OmniToken; amount: number }) {
    if (!this.wallet) throw new Error("No wallet connected");
    if (this.wallet.type !== WalletType.NEAR) throw new Error("Only NEAR wallet can withdraw");

    const token = OmniTokenMetadata[args.token];
    await hotBridge.withdrawToken({
      chain: 1010,
      token: token.contractId,
      amount: BigInt(utils.parseAmount(args.amount, token.decimals)),
      intentAccount: await this.wallet.getIntentsAddress(),
      receiver: await this.wallet.getAddress(),
      signIntents: (t) => this.wallet!.signIntents(t),
    });
  }
}

export const useWibe3 = (wibe3: Wibe3Client) => {
  const [wallet, setWallet] = useState<ChainAbstracted | null>(wibe3.wallet);
  const [balances, setBalances] = useState<TokenBalance[]>(wibe3.balances);
  const [address, setAddress] = useState<string | null>(null);
  const [tradingAddress, setTradingAddress] = useState<string | null>(null);

  useEffect(() => {
    const onBalanceChanged = (t: { balances: TokenBalance[] }) => setBalances(t.balances);
    const onConnect = (t: { wallet: ChainAbstracted }) => setWallet(t.wallet);
    const onDisconnect = () => setWallet(null);
    wibe3.events.on("connect", onConnect);
    wibe3.events.on("disconnect", onDisconnect);
    wibe3.events.on("balance:changed", onBalanceChanged);
    return () => {
      wibe3.events.off("connect", onConnect);
      wibe3.events.off("disconnect", onDisconnect);
      wibe3.events.off("balance:changed", onBalanceChanged);
    };
  }, [wibe3]);

  useEffect(() => {
    setAddress(null);
    wallet?.getAddress().then(setAddress);
    wallet?.getIntentsAddress().then(setTradingAddress);
  }, [wallet]);

  const connect = useCallback(async () => {
    await wibe3.connect();
  }, []);

  const auth = useCallback(async () => {
    const auth = await wibe3.auth();
    return auth;
  }, []);

  const disconnect = useCallback(async () => {
    await wibe3.disconnect();
  }, []);

  const refresh = useCallback(async () => {
    await wibe3.refreshBalances();
  }, []);

  const withdraw = useCallback(async (token: OmniToken, amount: number) => {
    await wibe3.withdraw({ token, amount });
  }, []);

  return { address, connect, auth, disconnect, balances, tradingAddress, withdraw, refresh };
};
