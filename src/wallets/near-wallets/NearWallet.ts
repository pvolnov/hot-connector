import type { FinalExecutionOutcome } from "@near-wallet-selector/core";

import {
  Account,
  Network,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignInParams,
  SignMessageParams,
  SignedMessage,
  WalletManifest,
} from "../../types/wallet";
import base58 from "../../helpers/base58";
import { ChainAbstracted, WalletType } from "../ChainAbstracted";
import { hex } from "../../helpers/hex";
import base64 from "../../helpers/base64";

export abstract class NearWallet implements ChainAbstracted {
  abstract get manifest(): WalletManifest;
  abstract getAccounts(): Promise<Array<Account>>;
  abstract signMessage(params: SignMessageParams): Promise<SignedMessage>;
  abstract signIn(params: SignInParams): Promise<Array<Account>>;
  abstract signOut(data?: { network?: Network }): Promise<void>;
  abstract signAndSendTransaction(params: SignAndSendTransactionParams): Promise<FinalExecutionOutcome>;
  abstract signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<FinalExecutionOutcome>>;

  get type(): WalletType {
    return WalletType.NEAR;
  }

  getAddress = async (): Promise<string> => {
    const accounts = await this.getAccounts();
    if (accounts.length === 0) throw new Error("No account found");
    return accounts[0].accountId;
  };

  getPublicKey = async (): Promise<string> => {
    const accounts = await this.getAccounts();
    if (accounts.length === 0) throw new Error("No account found");
    return accounts[0].publicKey;
  };

  getIntentsAddress = async (): Promise<string> => {
    return await this.getAddress();
  };

  signIntentsWithAuth = async (domain: string, intents?: Record<string, any>[]) => {
    const accounts = await this.getAccounts();
    if (accounts.length === 0) throw new Error("No account found");

    const seed = hex.encode(window.crypto.getRandomValues(new Uint8Array(32)));
    const msgBuffer = new TextEncoder().encode(`${domain}_${seed}`);
    const nonce = await window.crypto.subtle.digest("SHA-256", msgBuffer);

    return {
      signed: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce) }),
      address: accounts[0].accountId,
      publicKey: accounts[0].publicKey,
      chainId: WalletType.NEAR,
      domain,
      seed,
    };
  };

  signIntents = async (
    intents: Record<string, any>[],
    options?: { nonce?: Uint8Array; deadline?: number }
  ): Promise<Record<string, any>> => {
    const nonce = new Uint8Array(options?.nonce || window.crypto.getRandomValues(new Uint8Array(32)));
    const signerId = await this.getIntentsAddress();

    const message = JSON.stringify({
      deadline: options?.deadline ? new Date(options.deadline).toISOString() : "2100-01-01T00:00:00.000Z",
      signer_id: signerId,
      intents: intents,
    });

    const result = await this.signMessage({ message, recipient: "intents.near", nonce });
    if (!result) throw new Error("Failed to sign message");

    const { signature, publicKey } = result;
    return {
      standard: "nep413",
      payload: { nonce: base64.encode(nonce), recipient: "intents.near", message },
      signature: `ed25519:${base58.encode(base64.decode(signature))}`,
      public_key: publicKey,
    };
  };
}
