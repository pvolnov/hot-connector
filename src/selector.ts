import { NearWallet, EventNearWalletInjected, WalletManifest } from "./types/wallet";
import { LocalStorage, DataStorage } from "./storage";
import { SandboxWallet } from "./wallet";
import { manifest } from "./manifest";
import { EventEmitter } from "./events";

export class WalletSelector {
  private storage: DataStorage;
  private events: EventEmitter;

  manifest: { wallets: WalletManifest[] };
  wallets: NearWallet[] = [];

  constructor(options?: { storage?: DataStorage; events?: EventEmitter; manifest?: { wallets: WalletManifest[] } }) {
    this.storage = options?.storage ?? new LocalStorage();
    this.events = options?.events ?? new EventEmitter();
    this.manifest = options?.manifest ?? manifest;

    this.manifest.wallets.forEach((wallet) => this.registerWallet(wallet));
    window.addEventListener<any>("near-wallet-injected", (event: EventNearWalletInjected) => {
      console.log("near-wallet-injected", event);
      this.wallets.push(event.detail.wallet);
    });
  }

  async registerWallet(wallet: WalletManifest) {
    if (wallet.type !== "sandbox") throw new Error("Only sandbox wallets are supported");
    this.wallets.push(new SandboxWallet(wallet));
  }

  async connect(id: string) {
    const wallet = await this.wallet(id);
    await this.storage.set("selected-wallet", id);

    const accounts = await wallet?.signIn({ contractId: "" });
    if (!accounts?.length) throw new Error("Failed to sign in");
    this.events.emit("signedIn", { wallet, accounts });
    return wallet;
  }

  async disconnect(wallet?: NearWallet) {
    if (!wallet) wallet = await this.wallet();
    await wallet.signOut();

    await this.storage.remove("selected-wallet");
    this.events.emit("signedOut");
  }

  async wallet(id?: string | null) {
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

  on(event: string, callback: (...args: any[]) => void) {
    this.events.on(event, callback);
  }

  once(event: string, callback: (...args: any[]) => void) {
    this.events.once(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.events.off(event, callback);
  }

  removeAllListeners(event?: string) {
    this.events.removeAllListeners(event);
  }
}
