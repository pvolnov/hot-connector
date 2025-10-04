import { sha256 } from "@noble/hashes/sha2";
import { KeyPair, KeyPairString } from "@near-js/crypto";
import { Intents, base58 } from "@hot-labs/near-connect";
import { AuthCommitment, OmniToken, OmniTokenMetadata, TrasferIntent, TokenBalance } from "./types";

class Wibe3Wallet {
  #keyPair: KeyPair;
  intents: Intents;

  constructor({ privateKey }: { privateKey: string }) {
    const key = privateKey.startsWith("ed25519:") ? (privateKey as KeyPairString) : `ed25519:${privateKey}`;
    this.#keyPair = KeyPair.fromString(key as KeyPairString);
    this.intents = new Intents();
  }

  get tradingAddress() {
    return Buffer.from(this.#keyPair.getPublicKey().data).toString("hex").toLowerCase();
  }

  async validateAuth(auth: AuthCommitment): Promise<boolean> {
    return true;
  }

  async getBalance(token: OmniToken): Promise<TokenBalance> {
    const balances = await this.intents.getIntentsBalances([token], this.tradingAddress);
    const metadata = OmniTokenMetadata[token];
    const icon = `https://storage.herewallet.app/ft/1010:${metadata.contractId}.png`;
    return {
      int: balances[token] || 0n,
      id: metadata.contractId,
      float: Number(balances[token] || 0) / Math.pow(10, metadata.decimals),
      decimals: metadata.decimals,
      symbol: metadata.symbol,
      icon,
    };
  }

  async transfer(args: { token: OmniToken; amount: number; to: string; paymentId: string }) {
    const int = Math.floor(args.amount * 10 ** OmniTokenMetadata[args.token].decimals);

    const intent: TrasferIntent = {
      intent: "transfer",
      tokens: { [args.token]: int.toString() },
      receiver_id: args.to.toLowerCase(),
    };

    const nonce = new Uint8Array(sha256(args.paymentId)).slice(0, 32);
    const signed = await this.signIntents({ nonce, intents: [intent] });
    await this.intents.publishSignedIntents([signed]);
  }

  async signIntents(options: {
    deadline?: number;
    nonce: Uint8Array;
    intents: Record<string, any>[];
  }): Promise<Record<string, any>> {
    const nonce = new Uint8Array(options.nonce);
    const signerId = this.tradingAddress;

    const message = JSON.stringify({
      deadline: options?.deadline ? new Date(options.deadline).toISOString() : "2100-01-01T00:00:00.000Z",
      nonce: Buffer.from(nonce).toString("base64"),
      verifying_contract: "intents.near",
      signer_id: signerId,
      intents: options.intents,
    });

    const signature = this.#keyPair.sign(Buffer.from(message)).signature;
    return {
      signature: `ed25519:${base58.default.encode(signature)}`,
      public_key: this.#keyPair.getPublicKey().toString(),
      standard: "raw_ed25519",
      payload: message,
    };
  }
}

export default Wibe3Wallet;
