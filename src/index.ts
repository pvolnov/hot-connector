export { type DataStorage, LocalStorage } from "./storage";
export { EventEmitter } from "./helpers/events";

export { ParentFrameWallet } from "./wallets/near-wallets/ParentFrameWallet";
export { SandboxWallet } from "./wallets/near-wallets/SandboxedWallet";
export { InjectedWallet } from "./wallets/near-wallets/InjectedWallet";

export { HotConnector } from "./HotConnector";
export { NearConnector } from "./NearConnector";

export { NearWallet } from "./wallets/near-wallets/NearWallet";
export { default as EvmWallet } from "./wallets/EvmWallet";
export { default as SolanaWallet } from "./wallets/SolanaWallet";
export { default as TonWallet } from "./wallets/TonWallet";

export type {
  NearWalletBase,
  WalletManifest,
  EventNearWalletInjected,
  SignInParams,
  SignMessageParams,
  SignedMessage,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
} from "./types/wallet";

export * from "./types/multichain";
export * as tx from "./types/transactions";
