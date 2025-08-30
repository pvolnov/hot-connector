import type { AppKit } from "@reown/appkit";
import type { Provider as SolanaProvider } from "@reown/appkit-utils/solana";
import type { Provider as EvmProvider } from "@reown/appkit-utils/ethers";
import type { ISupportedWallet, StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import type { TonConnectUI } from "@tonconnect/ui";

import { ConnectedWallets, SignedAuth, WalletType } from "./wallets/ChainAbstracted";
import { AuthPopup } from "./popups/AuthIntentPopup";
import { MultichainPopup } from "./popups/MultichainPopup";
import { LogoutPopup } from "./popups/LogoutPopup";
import EvmAccount from "./wallets/EvmWallet";
import SolanaAccount from "./wallets/SolanaWallet";
import TonAccount from "./wallets/TonWallet";
import { NearConnector } from "./NearConnector";
import { DataStorage, LocalStorage } from "./storage";
import StellarAccount from "./wallets/StellarWallet";
import base64 from "./helpers/base64";

export class HotConnector {
  storage: DataStorage;
  wallets: ConnectedWallets = {
    [WalletType.NEAR]: null,
    [WalletType.EVM]: null,
    [WalletType.SOLANA]: null,
    [WalletType.TON]: null,
    [WalletType.STELLAR]: null,
  };

  constructor(
    readonly options: {
      chains: WalletType[];
      onConnect: <T extends WalletType>(wallet: ConnectedWallets[T], type: T) => void;
      onDisconnect: <T extends WalletType>(type: T) => void;
      nearConnector?: NearConnector;
      stellarKit?: StellarWalletsKit;
      tonConnect?: TonConnectUI;
      storage?: DataStorage;
      appKit?: AppKit;
    }
  ) {
    this.storage = options.storage || new LocalStorage();

    this.options.tonConnect?.onStatusChange(async (wallet) => {
      if (!wallet) return this.removeWallet(WalletType.TON);
      this.setWallet(WalletType.TON, new TonAccount(this.options.tonConnect!));
    });

    this.options.tonConnect?.setConnectRequestParameters({ state: "ready", value: { tonProof: "hot-connector" } });
    this.options.tonConnect?.connector.restoreConnection();

    this.options.nearConnector?.on("wallet:signOut", () => this.removeWallet(WalletType.NEAR));
    this.options.nearConnector?.on("wallet:signIn", ({ wallet }) => this.setWallet(WalletType.NEAR, wallet));
    this.options.nearConnector?.getConnectedWallet().then(({ wallet }) => this.setWallet(WalletType.NEAR, wallet));

    this.storage.get("hot-connector:stellar").then((data) => {
      try {
        if (!data || !this.options.stellarKit) throw "No wallet";
        const { id, address } = JSON.parse(data);
        this.options.stellarKit.setWallet(id);
        this.setWallet(WalletType.STELLAR, new StellarAccount(this.options.stellarKit!, address));
      } catch {
        this.removeWallet(WalletType.STELLAR);
      }
    });

    this.options.appKit?.subscribeProviders(async (state) => {
      const solanaProvider = state["solana"] as SolanaProvider;
      if (solanaProvider) this.setWallet(WalletType.SOLANA, new SolanaAccount(solanaProvider));
      else this.removeWallet(WalletType.SOLANA);

      const evmProvider = state["eip155"] as EvmProvider;
      if (evmProvider) this.setWallet(WalletType.EVM, new EvmAccount(evmProvider));
      else this.removeWallet(WalletType.EVM);
    });
  }

  setWallet<T extends WalletType>(type: T, wallet: ConnectedWallets[T]) {
    this.wallets[type] = wallet;
    this.options.onConnect(wallet, type);
  }

  removeWallet(type: WalletType) {
    if (this.wallets[type] == null) return;
    this.wallets[type] = null;
    this.options.onDisconnect(type);
  }

  getWallet(type: WalletType) {
    if (!this.wallets[type]) throw new Error(`${type} not connected`);
    return this.wallets[type];
  }

  resolveWallet(type: WalletType | ConnectedWallets[keyof ConnectedWallets]) {
    const wallet = typeof type === "number" || typeof type === "string" ? this.getWallet(type) : type;
    if (!wallet) throw new Error("Wallet not found");
    return wallet;
  }

  async connectWallet(type?: WalletType) {
    if (type === WalletType.NEAR) return this.options.nearConnector?.connect();
    if (type === WalletType.EVM) return this.options.appKit?.open({ namespace: "eip155" });
    if (type === WalletType.SOLANA) return this.options.appKit?.open({ namespace: "solana" });
    if (type === WalletType.TON) return this.options.tonConnect?.openModal();

    if (type === WalletType.STELLAR)
      return this.options.stellarKit?.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          if (!this.options.stellarKit) return;
          this.options.stellarKit?.setWallet(option.id);
          const { address } = await this.options.stellarKit?.getAddress();
          this.setWallet(WalletType.STELLAR, new StellarAccount(this.options.stellarKit!, address));
          this.storage.set("hot-connector:stellar", JSON.stringify({ id: option.id, address }));
        },
      });
  }

  async connect() {
    return new Promise<void>(async (resolve, reject) => {
      const popup = new MultichainPopup({
        chains: this.options.chains,
        wallets: {
          [WalletType.NEAR]: await this.wallets[WalletType.NEAR]?.getAddress().catch(() => undefined),
          [WalletType.EVM]: await this.wallets[WalletType.EVM]?.getAddress().catch(() => undefined),
          [WalletType.SOLANA]: await this.wallets[WalletType.SOLANA]?.getAddress().catch(() => undefined),
          [WalletType.TON]: await this.wallets[WalletType.TON]?.getAddress().catch(() => undefined),
          [WalletType.STELLAR]: await this.wallets[WalletType.STELLAR]?.getAddress().catch(() => undefined),
        },

        onConnect: (type) => {
          this.connectWallet(type);
          popup.destroy();
          resolve();
        },

        onDisconnect: (type) => {
          this.disconnect(type);
          popup.destroy();
          resolve();
        },

        onReject: () => {
          reject(new Error("User rejected"));
          popup.destroy();
        },
      });

      popup.create();
    });
  }

  async auth(
    type: WalletType | ConnectedWallets[keyof ConnectedWallets],
    domain: string,
    intents: Record<string, any>[],
    then?: (signed: SignedAuth) => Promise<void>
  ): Promise<SignedAuth> {
    const wallet = this.resolveWallet(type);
    return new Promise<SignedAuth>((resolve, reject) => {
      const popup = new AuthPopup({
        onApprove: async () => {
          try {
            const signed = await wallet.signIntentsWithAuth(domain, intents);
            await then?.(signed);
            resolve(signed);
            popup.destroy();
          } catch (e) {
            reject(e);
            popup.destroy();
          }
        },

        onReject: () => {
          reject(new Error("User rejected"));
          popup.destroy();
        },
      });

      popup.create();
    });
  }

  async disconnect(type: WalletType | ConnectedWallets[keyof ConnectedWallets]) {
    const wallet = this.resolveWallet(type);
    return new Promise<void>((resolve, reject) => {
      const popup = new LogoutPopup({
        onApprove: async () => {
          if (wallet.type === WalletType.NEAR) await this.options.nearConnector?.disconnect().catch(() => null);
          if (wallet.type === WalletType.SOLANA) await this.options.appKit?.disconnect("solana").catch(() => null);
          if (wallet.type === WalletType.EVM) await this.options.appKit?.disconnect("eip155").catch(() => null);
          if (wallet.type === WalletType.TON) await this.options.tonConnect?.connector.disconnect().catch(() => null);

          if (wallet.type === WalletType.STELLAR) {
            await this.options.stellarKit?.disconnect().catch(() => null);
            this.storage.remove("hot-connector:stellar");
          }

          this.removeWallet(wallet.type);
          popup.destroy();
          resolve();
        },

        onReject: () => {
          reject(new Error("User rejected"));
          popup.destroy();
        },
      });

      popup.create();
    });
  }

  async signIntents(type: WalletType | ConnectedWallets[keyof ConnectedWallets], intents: Record<string, any>[]) {
    const wallet = this.resolveWallet(type);
    return await wallet.signIntents(intents);
  }

  async executeIntents(
    type: WalletType | ConnectedWallets[keyof ConnectedWallets],
    intents: Record<string, any>[],
    hashes: string[] = []
  ) {
    const signed = await this.signIntents(type, intents);
    return await this.publishSignedIntents([signed], hashes);
  }

  async publishSignedIntents(signed: Record<string, any>[], hashes: string[] = []) {
    const res = await fetch("https://api0.herewallet.app/api/v1/evm/intent-solver", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({
        params: [{ signed_datas: signed, quote_hashes: hashes }],
        method: "publish_intents",
        id: "dontcare",
        jsonrpc: "2.0",
      }),
    });

    const { result } = await res.json();
    if (result.status === "FAILED") throw result.reason;
    const intentResult = result.intent_hashes[0];

    const getStatus = async () => {
      const statusRes = await fetch("https://api0.herewallet.app/api/v1/evm/intent-solver", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({
          id: "dontcare",
          jsonrpc: "2.0",
          method: "get_status",
          params: [{ intent_hash: intentResult }],
        }),
      });

      const { result } = await statusRes.json();
      return result;
    };

    const fetchResult = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = await getStatus().catch(() => null);
      if (result == null) return await fetchResult();
      if (result.status === "SETTLED") return result.data.hash;
      if (result.status === "FAILED") throw result.reason || "Failed to publish intents";
      return await fetchResult();
    };

    const hash = await fetchResult();
    return hash;
  }

  async simulateIntents(signed: Record<string, any>[]) {
    return await this.viewMethod("intents.near", "simulate_intents", { signed: signed });
  }

  async viewMethod(contractId: string, method: string, args: Record<string, any> = {}) {
    const rpc = "https://rpc.mainnet.near.org";
    const res = await fetch(rpc, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "call_function",
          finality: "final",
          account_id: contractId,
          method_name: method,
          args_base64: base64.encode(new TextEncoder().encode(JSON.stringify(args))),
        },
      }),
    });

    const { result } = await res.json();
    if (result.error) throw result.error;
    if (!result?.result) throw new Error("Failed to call view method");

    try {
      return JSON.parse(Buffer.from(result.result).toString());
    } catch {
      return result.result;
    }
  }
}
