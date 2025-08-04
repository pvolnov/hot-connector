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
import { WalletType } from "../../types/multichain";
import { ChainAbstracted } from "../ChainAbstracted";

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
    const publicKey = await this.getPublicKey();
    return Buffer.from(base58.decode(publicKey)).toString("hex");
  };

  signIntentsWithAuth = async (domain: string, intents?: Record<string, any>[], useOnlyPublicKeyAsSigner = false) => {
    const accounts = await this.getAccounts();
    if (accounts.length === 0) throw new Error("No account found");

    const seed = Buffer.from(window.crypto.getRandomValues(new Uint8Array(32))).toString("hex");
    const msgBuffer = new TextEncoder().encode(`${domain}_${seed}`);
    const nonce = await crypto.subtle.digest("SHA-256", msgBuffer);

    const signerId = useOnlyPublicKeyAsSigner ? await this.getIntentsAddress() : accounts[0].accountId;
    return {
      intent: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce), signer_id: signerId }),
      address: accounts[0].accountId,
      publicKey: accounts[0].publicKey,
      chainId: WalletType.NEAR,
      nonce: seed,
      domain,
    };
  };

  signIntents = async (
    intents: Record<string, any>[],
    options?: { signer_id: string; deadline?: number; nonce?: Buffer | Uint8Array }
  ): Promise<Record<string, any>> => {
    const nonce = new Uint8Array(options?.nonce || crypto.getRandomValues(new Uint8Array(32)));

    const message = JSON.stringify({
      deadline: options?.deadline ? new Date(options.deadline).toISOString() : "2100-01-01T00:00:00.000Z",
      signer_id: options?.signer_id,
      intents: intents,
    });

    const result = await this.signMessage({ message, recipient: "intents.near", nonce: Buffer.from(nonce) });
    if (!result) throw new Error("Failed to sign message");

    const { signature, publicKey } = result;
    return {
      standard: "nep413",
      payload: { nonce: Buffer.from(nonce).toString("base64"), recipient: "intents.near", message },
      signature: `ed25519:${base58.encode(Buffer.from(signature, "base64"))}`,
      public_key: publicKey,
    };
  };
}
