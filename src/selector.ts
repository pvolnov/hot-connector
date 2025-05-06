import { NearWallet, EventNearWalletInjected, WalletManifest, Network } from "./types/wallet";
import { EventMap } from "./types/wallet-events";
import { LocalStorage, DataStorage } from "./storage";
import { EventEmitter } from "./events";
import { InjectedWallet } from "./wallets/InjectedWallet";
import { SandboxWallet } from "./wallets/SandboxedWallet";

interface WalletSelectorOptions {
  storage?: DataStorage;
  events?: EventEmitter<EventMap>;
  manifest?: string | { wallets: WalletManifest[]; version: string };
  network?: Network;
  contractId?: string;
  methodNames?: string[];
  allowance?: string;
}

export class WalletSelector {
  readonly events: EventEmitter<EventMap>;
  private storage: DataStorage;

  wallets: NearWallet[] = [];
  manifest: { wallets: WalletManifest[]; version: string } = { wallets: [], version: "1.0.0" };

  network: Network = "mainnet";
  signInOptions: { contractId: string; methodNames: string[] } = { contractId: "", methodNames: [] };

  executeIframe: <T>(iframe: HTMLIFrameElement, render: boolean, execute: () => Promise<T>) => Promise<T> = async (
    iframe,
    render,
    execute
  ) => {
    return execute();
  };

  readonly whenManifestLoaded: Promise<void>;

  constructor(options?: WalletSelectorOptions) {
    this.storage = options?.storage ?? new LocalStorage();
    this.events = options?.events ?? new EventEmitter<EventMap>();

    this.network = options?.network ?? "mainnet";
    this.signInOptions.contractId = options?.contractId ?? "";
    this.signInOptions.methodNames = options?.methodNames ?? [];

    window.addEventListener<any>("near-wallet-injected", this._handleNearWalletInjected);
    window.dispatchEvent(new Event("near-selector-ready"));

    this.whenManifestLoaded = new Promise(async (resolve) => {
      if (options?.manifest == null || typeof options.manifest === "string") {
        this.manifest = await this._loadManifest(options?.manifest).catch(() => ({ wallets: [], version: "1.0.0" }));
      } else {
        this.manifest = options?.manifest ?? { wallets: [], version: "1.0.0" };
      }

      this.manifest.wallets.forEach((wallet) => this.registerWallet(wallet));
      this.events.emit("selector:walletsChanged", {});
      await new Promise((resolve) => setTimeout(resolve, 100));
      resolve();
    });
  }

  private _handleNearWalletInjected = (event: EventNearWalletInjected) => {
    this.wallets = this.wallets.filter((wallet) => wallet.manifest.id !== event.detail.manifest.id);
    this.wallets.unshift(new InjectedWallet(this, event.detail as any));
    this.events.emit("selector:walletsChanged", {});
  };

  private async _loadManifest(manifestUrl?: string) {
    let manifestEndpoint = manifestUrl
      ? manifestUrl
      : "https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/manifest.json";

    const manifest = (await (await fetch(manifestEndpoint)).json()) as { wallets: WalletManifest[]; version: string };
    return manifest;
  }

  async registerWallet(manifest: WalletManifest) {
    if (manifest.type !== "sandbox") throw new Error("Only sandbox wallets are supported");
    if (this.wallets.find((wallet) => wallet.manifest.id === manifest.id)) return;
    this.wallets.push(new SandboxWallet(this, manifest));
  }

  async connect(id: string) {
    const wallet = await this.wallet(id);

    await this.storage.set("selected-wallet", id);
    const accounts = await wallet?.signIn(this.signInOptions);

    if (!accounts?.length) throw new Error("Failed to sign in");
    this.events.emit("wallet:signIn", { wallet, accounts, success: true });
    return wallet;
  }

  async disconnect(wallet?: NearWallet) {
    if (!wallet) wallet = await this.wallet();
    await wallet.signOut({ network: this.network });

    await this.storage.remove("selected-wallet");
    this.events.emit("wallet:signOut", { success: true });
  }

  async wallet(id?: string | null): Promise<NearWallet> {
    await this.whenManifestLoaded.catch(() => {});

    if (!id) {
      const id = await this.storage.get("selected-wallet");
      const wallet = this.wallets.find((wallet) => wallet.manifest.id === id);
      if (!wallet) throw new Error("No wallet selected");

      const accounts = await wallet.getAccounts();
      if (accounts?.length) return wallet;

      await this.disconnect(wallet);
      throw new Error("No accounts found");
    }

    const wallet = this.wallets.find((wallet) => wallet.manifest.id === id);
    if (!wallet) throw new Error("Wallet not found");
    return wallet;
  }

  on<K extends keyof EventMap>(event: K, callback: (payload: EventMap[K]) => void): void {
    this.events.on(event, callback);
  }

  once<K extends keyof EventMap>(event: K, callback: (payload: EventMap[K]) => void): void {
    this.events.once(event, callback);
  }

  off<K extends keyof EventMap>(event: K, callback: (payload: EventMap[K]) => void): void {
    this.events.off(event, callback);
  }

  removeAllListeners<K extends keyof EventMap>(event?: K): void {
    this.events.removeAllListeners(event);
  }
}
