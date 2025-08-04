import type { AppKit } from "@reown/appkit";
import type { Provider as SolanaProvider } from "@reown/appkit-utils/solana";
import type { Provider as EvmProvider } from "@reown/appkit-utils/ethers";
import type { TonConnectUI } from "@tonconnect/ui";

import { ConnectedWallets, WalletType } from "./types/multichain";
import { AuthPopup } from "./popups/AuthIntentPopup";
import { MultichainPopup } from "./popups/MultichainPopup";
import { LogoutPopup } from "./popups/LogoutPopup";
import EvmAccount from "./wallets/EvmWallet";
import SolanaAccount from "./wallets/SolanaWallet";
import TonAccount from "./wallets/TonWallet";
import { NearConnector } from "./NearConnector";

export class HotConnector {
  wallets: ConnectedWallets = {
    [WalletType.NEAR]: null,
    [WalletType.EVM]: null,
    [WalletType.SOLANA]: null,
    [WalletType.TON]: null,
  };

  constructor(
    readonly options: {
      onConnect: <T extends WalletType>(wallet: ConnectedWallets[T], type: T) => void;
      onDisconnect: <T extends WalletType>(type: T) => void;
      nearUseOnlyPublicKeyAsSigner?: boolean;
      nearConnector?: NearConnector;
      chains: WalletType[];
      tonConnect?: TonConnectUI;
      appKit?: AppKit;
    }
  ) {
    this.options.tonConnect?.onStatusChange(async (wallet) => {
      if (!wallet) return this.removeWallet(WalletType.TON);
      this.setWallet(WalletType.TON, new TonAccount(this.options.tonConnect!));
    });

    this.options.tonConnect?.setConnectRequestParameters({ state: "ready", value: { tonProof: "hot-connector" } });
    this.options.tonConnect?.connector.restoreConnection();

    this.options.nearConnector?.on("wallet:signOut", () => this.removeWallet(WalletType.NEAR));
    this.options.nearConnector?.on("wallet:signIn", ({ wallet }) => this.setWallet(WalletType.NEAR, wallet));
    this.options.nearConnector?.getConnectedWallet().then(({ wallet }) => this.setWallet(WalletType.NEAR, wallet));

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

  async connectWallet(type?: WalletType) {
    if (type === WalletType.NEAR) return this.options.nearConnector?.connect();
    if (type === WalletType.EVM) return this.options.appKit?.open({ namespace: "eip155" });
    if (type === WalletType.SOLANA) return this.options.appKit?.open({ namespace: "solana" });
    if (type === WalletType.TON) return this.options.tonConnect?.openModal();
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
    intents: Record<string, any>[]
  ) {
    return new Promise<Record<string, any>>((resolve, reject) => {
      const popup = new AuthPopup({
        onApprove: async () => {
          const wallet = typeof type === "number" ? this.getWallet(type) : type;
          if (!wallet) throw new Error("Wallet not found");

          const signed = await wallet.signIntentsWithAuth(domain, intents, this.options.nearUseOnlyPublicKeyAsSigner);
          resolve(signed);
          popup.destroy();
        },

        onReject: () => {
          reject(new Error("User rejected"));
          popup.destroy();
        },
      });

      popup.create();
    });
  }

  async disconnect(type: WalletType) {
    return new Promise<void>((resolve, reject) => {
      const popup = new LogoutPopup({
        onApprove: async () => {
          if (type === WalletType.NEAR) await this.options.nearConnector?.disconnect().catch(() => null);
          if (type === WalletType.SOLANA) await this.options.appKit?.disconnect("solana").catch(() => null);
          if (type === WalletType.EVM) await this.options.appKit?.disconnect("eip155").catch(() => null);
          if (type === WalletType.TON) await this.options.tonConnect?.connector.disconnect().catch(() => null);
          this.removeWallet(type);
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

  signIntents = async (type: WalletType, intents: Record<string, any>[]) => {
    const wallet = this.getWallet(type);
    return wallet.signIntents(intents);
  };
}
