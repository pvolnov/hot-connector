import { NearWallet, EventNearWalletInjected, WalletManifest } from "./types/wallet";
import { LocalStorage, DataStorage } from "./storage";
import { SandboxWallet } from "./wallets/sandbox";
import { manifest } from "./manifest";
import { EventEmitter } from "./events";
import { EventMap } from "./types/wallet-events";

export class WalletSelector {
  private storage: DataStorage;
  private events: EventEmitter<EventMap>;

  manifest: { wallets: WalletManifest[] };
  wallets: NearWallet[] = [];

  constructor(options?: {
    storage?: DataStorage;
    events?: EventEmitter<EventMap>;
    manifest?: { wallets: WalletManifest[] };
  }) {
    this.storage = options?.storage ?? new LocalStorage();
    this.events = options?.events ?? new EventEmitter<EventMap>();
    this.manifest = options?.manifest ?? manifest;

    this.manifest.wallets.forEach((wallet) => this.registerWallet(wallet));
    window.addEventListener<any>("near-wallet-injected", (event: EventNearWalletInjected) => {
      console.log("near-wallet-injected", event);
      this.wallets.push(event.detail.wallet);
    });
  }

  async registerWallet(wallet: WalletManifest) {
    if (wallet.type !== "sandbox") throw new Error("Only sandbox wallets are supported");
    this.wallets.push(new SandboxWallet(wallet, this.events));
  }

  async connect(id: string) {
    const wallet = await this.wallet(id);
    await this.storage.set("selected-wallet", id);

    const accounts = await wallet?.signIn({ contractId: "" });
    if (!accounts?.length) throw new Error("Failed to sign in");
    this.events.emit("wallet:signIn", { wallet, accounts, success: true });
    return wallet;
  }

  async disconnect(wallet?: NearWallet) {
    if (!wallet) wallet = await this.wallet();
    await wallet.signOut();

    await this.storage.remove("selected-wallet");
    this.events.emit("wallet:signOut", { success: true });
  }

  async wallet(id?: string | null): Promise<NearWallet> {
    if (!id) {
      const id = await this.storage.get("selected-wallet");
      const wallet = this.wallets.find((wallet) => wallet.manifest.id === id);
      if (!wallet) throw new Error("No wallet selected");

      const accounts = await wallet.getAccounts().catch(() => null);
      if (!accounts?.length) {
        await this.disconnect(wallet);
        throw new Error("No accounts found");
      }

      return wallet;
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
