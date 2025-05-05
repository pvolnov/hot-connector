export { WalletSelector } from "./selector";
export { type DataStorage, LocalStorage } from "./storage";
export { EventEmitter } from "./events";
export { WalletSelectorUI } from "./ui";

export { SandboxWallet } from "./wallets/SandboxedWallet";
export { InjectedWallet } from "./wallets/InjectedWallet";

export type {
  NearWallet,
  WalletManifest,
  EventNearWalletInjected,
  SignInParams,
  VerifyOwnerParams,
  SignMessageParams,
  SignedMessage,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
} from "./types/wallet";

export * as tx from "./types/transactions";
