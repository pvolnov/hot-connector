import type { providers, utils } from "near-api-js";
import type { Transaction, Action } from "./transactions";

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Network = "mainnet" | "testnet";

export interface Account {
  /**
   * NEAR account identifier.
   */
  accountId: string;
  /**
   * Account public key.
   */
  publicKey?: string;
}

export interface SignInParams {
  /**
   * Account ID of the Smart Contract.
   */
  contractId: string;
  /**
   * Specify limited access to particular methods on the Smart Contract.
   */
  methodNames?: Array<string>;
  /**
   * Specify the network to sign in to.
   */
  network?: Network;
}

export interface VerifyOwnerParams {
  /**
   * The message requested sign. Defaults to `verify owner` string.
   */
  message: string;
  /**
   * Applicable to browser wallets (e.g. MyNearWallet). This is the callback url once the signing is approved. Defaults to `window.location.href`.
   */
  callbackUrl?: string;
  /**
   * Applicable to browser wallets (e.g. MyNearWallet) extra data that will be passed to the callback url once the signing is approved.
   */
  meta?: string;
  /**
   * Specify the network to verify the owner on.
   */
  network?: Network;
}

export interface VerifiedOwner {
  accountId: string;
  message: string;
  blockId: string;
  publicKey: string;
  signature: string;
  keyType: utils.key_pair.KeyType;
}

export interface SignMessageParams {
  message: string;
  recipient: string;
  nonce: Buffer;
  callbackUrl?: string;
  state?: string;
  /**
   * Specify the network to sign the message on.
   */
  network?: Network;
}

export interface SignedMessage {
  accountId: string;
  publicKey: string;
  signature: string;
}

export type SignMessageMethod = {
  signMessage(params: SignMessageParams): Promise<SignedMessage | void>;
};

export interface SignAndSendTransactionParams {
  /**
   * Account ID used to sign the transaction. Defaults to the first account.
   */
  signerId?: string;
  /**
   * Account ID to receive the transaction. Defaults to `contractId` defined in `init`.
   */
  receiverId?: string;
  /**
   * NEAR Action(s) to sign and send to the network (e.g. `FunctionCall`). You can find more information on `Action` {@link https://github.com/near/wallet-selector/blob/main/packages/core/docs/api/transactions.md | here}.
   */
  actions: Array<Action>;
  /**
   * Specify the network to sign and send the transaction on.
   */
  network?: Network;
}

export interface SignAndSendTransactionsParams {
  /**
   * NEAR Transactions(s) to sign and send to the network. You can find more information on `Transaction` {@link https://github.com/near/wallet-selector/blob/main/packages/core/docs/api/transactions.md | here}.
   */
  transactions: Array<Optional<Transaction, "signerId">>;
  /**
   * Specify the network to sign and send the transactions on.
   */
  network?: Network;
}

export type EventNearWalletInjected = CustomEvent<NearWallet>;

type Permission = { allows?: string[] } | boolean;

export interface WalletManifest {
  id: string;
  platform: string[];
  name: string;
  icon: string;
  description: string;
  website: string;
  version: string;
  executor: string;
  type: "sandbox" | "injected";
  permissions: Record<string, Permission>;
  features: WalletFeatures;
  debug?: boolean;
}

export interface WalletFeatures {
  signMessage: boolean;
  signTransaction: boolean;
  signAndSendTransaction: boolean;
  signAndSendTransactions: boolean;
  verifyOwner: boolean;
  signInWithoutAddKey: boolean;
  testnet: boolean;
}

export interface NearWallet {
  manifest: WalletManifest;

  /**
   * Programmatically sign in. Hardware wallets (e.g. Ledger) require `derivationPaths` to validate access key permissions.
   */
  signIn(params: SignInParams): Promise<Array<Account>>;
  /**
   * Sign out from the wallet.
   */
  signOut(data?: { network?: Network }): Promise<void>;
  /**
   * Returns one or more accounts when signed in.
   * This method can be useful for wallets that support accounts at once such as WalletConnect.
   * In this case, you can use an `accountId` returned as the `signerId` for `signAndSendTransaction`.
   */
  getAccounts(data?: { network?: Network }): Promise<Array<Account>>;
  /**
   * Signs the message and verifies the owner. Message is not sent to blockchain.
   */
  verifyOwner(params: VerifyOwnerParams): Promise<VerifiedOwner | void>;
  /**
   * Signs one or more NEAR Actions before sending to the network.
   * The user must be signed in to call this method as there's at least charges for gas spent.
   */
  signAndSendTransaction(params: SignAndSendTransactionParams): Promise<providers.FinalExecutionOutcome>;
  /**
   * Signs one or more transactions before sending to the network.
   * The user must be signed in to call this method as there's at least charges for gas spent.
   */
  signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<providers.FinalExecutionOutcome>>;
  signMessage(params: SignMessageParams): Promise<SignedMessage>;
}

export type WalletEvents = {
  signedIn: { contractId: string; methodNames: Array<string>; accounts: Array<Account> };
  accountsChanged: { accounts: Array<Account> };
  networkChanged: { networkId: string };
  signedOut: null;
};
