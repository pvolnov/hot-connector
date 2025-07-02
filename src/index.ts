export { WalletSelector } from "./selector";
export { type DataStorage, LocalStorage } from "./storage";
export { WalletSelectorUI } from "./ui-selector";
export { EventEmitter } from "./helpers/events";

export { SandboxWallet } from "./wallets/SandboxedWallet";
export { InjectedWallet } from "./wallets/InjectedWallet";

export type {
  NearWallet,
  WalletManifest,
  EventNearWalletInjected,
  SignInParams,
  SignMessageParams,
  SignedMessage,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
} from "./types/wallet";

export * as tx from "./types/transactions";
