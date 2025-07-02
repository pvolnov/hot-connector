import { FinalExecutionOutcome } from "@near-wallet-selector/core";
import {
  Account,
  NearWallet,
  Network,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignedMessage,
  SignInParams,
  SignMessageParams,
} from "../types/wallet";
import { WalletSelector } from "../selector";
import { IntentsWallet } from "./IntentsWallet";

export class InjectedWallet extends IntentsWallet implements NearWallet {
  constructor(readonly selector: WalletSelector, readonly wallet: NearWallet) {
    super();
  }

  get manifest() {
    return this.wallet.manifest;
  }

  async signIn(params: SignInParams): Promise<Array<Account>> {
    return this.wallet.signIn({ ...params, network: params.network || this.selector.network });
  }

  async signOut(data?: { network?: Network }): Promise<void> {
    await this.wallet.signOut({ network: data?.network || this.selector.network });
  }

  async getAccounts(data?: { network?: Network }): Promise<Array<Account>> {
    return this.wallet.getAccounts({ network: data?.network || this.selector.network });
  }

  async signAndSendTransaction(params: SignAndSendTransactionParams): Promise<FinalExecutionOutcome> {
    return this.wallet.signAndSendTransaction({ ...params, network: params.network || this.selector.network });
  }

  async signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<FinalExecutionOutcome>> {
    return this.wallet.signAndSendTransactions({ ...params, network: params.network || this.selector.network });
  }

  async signMessage(params: SignMessageParams): Promise<SignedMessage> {
    return this.wallet.signMessage({ ...params, network: params.network || this.selector.network });
  }
}
