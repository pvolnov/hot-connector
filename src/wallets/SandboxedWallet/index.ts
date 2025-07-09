import { FinalExecutionOutcome } from "@near-wallet-selector/core";
import {
  Account,
  NearWallet,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignedMessage,
  SignInParams,
  SignMessageParams,
  WalletManifest,
} from "../../types/wallet";
import { WalletSelector } from "../../selector";
import SandboxExecutor from "./executor";

export class SandboxWallet implements NearWallet {
  executor: SandboxExecutor;

  constructor(readonly selector: WalletSelector, readonly manifest: WalletManifest) {
    this.executor = new SandboxExecutor(selector, manifest);
  }

  async signIn(params: SignInParams): Promise<Array<Account>> {
    return this.executor.call("wallet:signIn", { ...params, network: params.network || this.selector.network });
  }

  async signOut(): Promise<void> {
    await this.executor.call("wallet:signOut", { network: this.selector.network });
    await this.executor.clearStorage();
  }

  async getAccounts(): Promise<Array<Account>> {
    return this.executor.call("wallet:getAccounts", { network: this.selector.network });
  }

  async signAndSendTransaction(params: SignAndSendTransactionParams): Promise<FinalExecutionOutcome> {
    const network = params.network || this.selector.network;
    return this.executor.call("wallet:signAndSendTransaction", { ...params, network });
  }

  async signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<FinalExecutionOutcome>> {
    const network = params.network || this.selector.network;
    return this.executor.call("wallet:signAndSendTransactions", { ...params, network });
  }

  async signMessage(params: SignMessageParams): Promise<SignedMessage> {
    const network = params.network || this.selector.network;
    return this.executor.call("wallet:signMessage", { ...params, network });
  }
}

export default SandboxWallet;
