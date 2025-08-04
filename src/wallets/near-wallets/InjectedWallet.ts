import type { FinalExecutionOutcome } from "@near-wallet-selector/core";

import {
  Account,
  NearWalletBase,
  Network,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignedMessage,
  SignInParams,
  SignMessageParams,
} from "../../types/wallet";
import { NearConnector } from "../../NearConnector";
import { NearWallet } from "./NearWallet";

export class InjectedWallet extends NearWallet {
  constructor(readonly connector: NearConnector, readonly wallet: NearWalletBase) {
    super();
  }

  get manifest() {
    return this.wallet.manifest;
  }

  async signIn(params: SignInParams): Promise<Array<Account>> {
    return this.wallet.signIn({ ...params, network: params.network || this.connector.network });
  }

  async signOut(data?: { network?: Network }): Promise<void> {
    await this.wallet.signOut({ network: data?.network || this.connector.network });
  }

  async getAccounts(data?: { network?: Network }): Promise<Array<Account>> {
    return this.wallet.getAccounts({ network: data?.network || this.connector.network });
  }

  async signAndSendTransaction(params: SignAndSendTransactionParams): Promise<FinalExecutionOutcome> {
    return this.wallet.signAndSendTransaction({ ...params, network: params.network || this.connector.network });
  }

  async signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<FinalExecutionOutcome>> {
    return this.wallet.signAndSendTransactions({ ...params, network: params.network || this.connector.network });
  }

  async signMessage(params: SignMessageParams): Promise<SignedMessage> {
    return this.wallet.signMessage({ ...params, network: params.network || this.connector.network });
  }
}
