import type { FinalExecutionOutcome } from "@near-wallet-selector/core";

import binary_to_base58 from "../helpers/base58/encode";
import { uuid4 } from "../helpers/uuid";
import {
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignMessageParams,
  SignedMessage,
  SignInParams,
  WalletManifest,
  Account,
  NearWallet,
  Network,
} from "../types/wallet";

export abstract class IntentsWallet implements NearWallet {
  abstract manifest: WalletManifest;
  abstract signIn(params: SignInParams): Promise<Array<Account>>;
  abstract signOut(data?: { network?: Network }): Promise<void>;
  abstract getAccounts(data?: { network?: Network }): Promise<Array<Account>>;
  abstract signAndSendTransaction(params: SignAndSendTransactionParams): Promise<FinalExecutionOutcome>;
  abstract signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<FinalExecutionOutcome>>;
  abstract signMessage(params: SignMessageParams): Promise<SignedMessage>;

  async signIntentsWithAuth(domain: string, intents?: Record<string, any>[]) {
    const wallet = await this.getAccounts();
    if (wallet.length === 0) throw new Error("No account found");

    const seed = uuid4();
    const input = `${domain}_${seed}`;
    const msgBuffer = new TextEncoder().encode(input);
    const nonce = await crypto.subtle.digest("SHA-256", msgBuffer);

    return {
      intent: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce) }),
      address: wallet[0].accountId,
      publicKey: wallet[0].publicKey,
      chainId: 1010 as const,
      nonce: seed,
      domain,
    };
  }

  async signIntents(
    intents: Record<string, any>[],
    options?: { deadline?: number; nonce?: Buffer | Uint8Array }
  ): Promise<Record<string, any>> {
    const wallet = await this.getAccounts();
    if (wallet.length === 0) throw new Error("No account found");

    const nonce = new Uint8Array(options?.nonce || crypto.getRandomValues(new Uint8Array(32)));
    const intentAccount = wallet[0].accountId;

    const message = JSON.stringify({
      deadline: options?.deadline ? new Date(options.deadline).toISOString() : "2100-01-01T00:00:00.000Z",
      signer_id: intentAccount,
      intents: intents,
    });

    const result = await this.signMessage?.({ message, recipient: "intents.near", nonce });
    if (!result) throw new Error("Failed to sign message");

    const { signature, publicKey } = result;
    return {
      standard: "nep413",
      payload: { nonce: arrayBufferToBase64(nonce), recipient: "intents.near", message },
      signature: "ed25519:" + binary_to_base58(base64ToArrayBuffer(signature)),
      public_key: publicKey,
    };
  }
}
