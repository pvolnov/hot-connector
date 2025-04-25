import { FinalExecutionOutcome } from "@near-wallet-selector/core";
import { EventEmitter } from "../../events";
import {
  Account,
  NearWallet,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignedMessage,
  SignInParams,
  SignMessageParams,
  VerifiedOwner,
  VerifyOwnerParams,
  WalletManifest,
} from "../../types/wallet";
import { EventMap } from "../../types/wallet-events";
import SandboxExecutor from "./executor";
import { Middleware } from "./types";

export class SandboxWallet implements NearWallet {
  private executor: SandboxExecutor;

  constructor(readonly manifest: WalletManifest, readonly events: EventEmitter<EventMap>) {
    this.executor = new SandboxExecutor(manifest.id, manifest.executor, events);
  }

  use(middleware: Middleware) {
    this.executor.use(middleware);
  }

  async signIn(params: SignInParams): Promise<Array<Account>> {
    return this.executor.call("wallet:signIn", params);
  }

  async signOut(): Promise<void> {
    await this.executor.call("wallet:signOut", {});
    await this.executor.clearStorage();
  }

  async getAccounts(): Promise<Array<Account>> {
    return this.executor.call("wallet:getAccounts", {});
  }

  async verifyOwner(params: VerifyOwnerParams): Promise<VerifiedOwner | void> {
    return this.executor.call("wallet:verifyOwner", params);
  }

  async signAndSendTransaction(params: SignAndSendTransactionParams): Promise<FinalExecutionOutcome> {
    return this.executor.call("wallet:signAndSendTransaction", params);
  }

  async signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<FinalExecutionOutcome>> {
    return this.executor.call("wallet:signAndSendTransactions", params);
  }

  async signMessage?(params: SignMessageParams): Promise<SignedMessage | void> {
    return this.executor.call("wallet:signMessage", params);
  }
}

export default SandboxWallet;
