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
    return await this.getFullAccessPublicKey(accounts[0].accountId);
  };

  getIntentsAddress = async (): Promise<string> => {
    return await this.getAddress();
  };

  _cache: Record<string, string> = {};
  getFullAccessPublicKey = async (address: string): Promise<string> => {
    if (this._cache[address]) return this._cache[address];
    if (!address.includes(".")) return `ed25519:${base58.encode(hex.decode(address))}`;

    const response = await fetch("https://relmn.aurora.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "view_access_key_list",
          finality: "final",
          account_id: address,
        },
      }),
    });

    const { result } = await response.json();
    const publicKey = result?.keys?.find((t: any) => t.access_key.permission === "FullAccess").public_key;
    if (!publicKey) throw new Error("No full access key found");
    this._cache[address] = publicKey;
    return publicKey;
  };

  signIntentsWithAuth = async (domain: string, intents?: Record<string, any>[]) => {
    const address = await this.getAddress();
    const publicKey = await this.getPublicKey();

    const seed = hex.encode(window.crypto.getRandomValues(new Uint8Array(32)));
    const msgBuffer = new TextEncoder().encode(`${domain}_${seed}`);
    const nonce = await window.crypto.subtle.digest("SHA-256", new Uint8Array(msgBuffer));

    const signerId = hex.encode(base58.decode(publicKey.replace("ed25519:", "")));
    if (!signerId) throw new Error("No full access key found");

    return {
      signed: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce), signerId }),
      address: address,
      publicKey: publicKey,
      chainId: WalletType.NEAR,
      domain,
      seed,
    };
  };

  signIntents = async (
    intents: Record<string, any>[],
    options?: { nonce?: Uint8Array; deadline?: number; signerId?: string }
  ): Promise<Record<string, any>> => {
    const nonce = new Uint8Array(options?.nonce || window.crypto.getRandomValues(new Uint8Array(32)));
    const signerId = options?.signerId || (await this.getIntentsAddress());

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
      signature: signature.includes("ed25519:") ? signature : `ed25519:${base58.encode(base64.decode(signature))}`,
      public_key: publicKey,
    };
  };
}
