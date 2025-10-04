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

export class Wibe3Client {
  private hotConnector: HotConnector;
  wallet: NearWallet | EvmWallet | SolanaWallet | StellarWallet | TonWallet | null = null;
  events: EventEmitter<{ connect: { wallet: ChainAbstracted }; disconnect: {} }>;

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

    this.events = new EventEmitter<{ connect: { wallet: ChainAbstracted }; disconnect: {} }>();

    this.hotConnector = new HotConnector({
      onConnect: (wallet) => {
        this.wallet = wallet;
        this.events.emit("connect", { wallet: wallet as ChainAbstracted });
      },

      onDisconnect: () => {
        this.wallet = null;
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

export const useWibe3 = (wibe3: Wibe3Client) => {
  const [wallet, setWallet] = useState<ChainAbstracted | null>(wibe3.wallet);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const onConnect = (t: { wallet: ChainAbstracted }) => setWallet(t.wallet);
    const onDisconnect = () => setWallet(null);
    wibe3.events.on("connect", onConnect);
    wibe3.events.on("disconnect", onDisconnect);
    return () => {
      wibe3.events.off("connect", onConnect);
      wibe3.events.off("disconnect", onDisconnect);
    };
  }, [wibe3]);

  useEffect(() => {
    setAddress(null);
    wallet?.getAddress().then(setAddress);
  }, [wallet]);

  const connect = useCallback(async () => {
    await wibe3.connect();
    setWallet(wallet);
  }, []);

  const auth = useCallback(async () => {
    const auth = await wibe3.auth();
    return auth;
  }, []);

  const disconnect = useCallback(async () => {
    await wibe3.disconnect();
    setWallet(null);
  }, []);

  const getBalance = useCallback(async (token: OmniToken) => {
    return wibe3.getBalance(token);
  }, []);

  return { address, connect, auth, disconnect, getBalance };
};
