import type { SendTransactionOptions } from "@reown/appkit-adapter-solana";
import type { Provider as SolanaProvider } from "@reown/appkit-utils/solana";
import type { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";

import { WalletType } from "../types/multichain";
import base58 from "../helpers/base58";
import { ChainAbstracted } from "./ChainAbstracted";

class SolanaWallet implements ChainAbstracted {
  constructor(readonly wallet: SolanaProvider) {}

  get type() {
    return WalletType.SOLANA;
  }

  getAddress = async (): Promise<string> => {
    const addresses = await this.wallet.getAccounts();
    if (addresses.length === 0) throw new Error("No account found");
    return addresses[0].address;
  };

  getPublicKey = async (): Promise<string> => {
    return this.getAddress();
  };

  getIntentsAddress = async (): Promise<string> => {
    const address = await this.getAddress();
    return Buffer.from(base58.decode(address)).toString("hex").toLowerCase();
  };

  async signIntentsWithAuth(domain: string, intents?: Record<string, any>[]) {
    const address = await this.getAddress();
    const seed = Buffer.from(window.crypto.getRandomValues(new Uint8Array(32))).toString("hex");
    const msgBuffer = new TextEncoder().encode(`${domain}_${seed}`);
    const nonce = await crypto.subtle.digest("SHA-256", msgBuffer);

    return {
      intent: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce) }),
      publicKey: `ed25519:${address}`,
      chainId: WalletType.SOLANA,
      address: address,
      nonce: seed,
    };
  }

  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendTransactionOptions
  ): Promise<string> {
    return await this.wallet.sendTransaction(transaction, connection, options);
  }

  async signMessage(message: string) {
    return await this.wallet.signMessage(new TextEncoder().encode(message));
  }

  async signIntents(
    intents: Record<string, any>[],
    options?: { deadline?: number; nonce?: Buffer | Uint8Array }
  ): Promise<Record<string, any>> {
    const nonce = new Uint8Array(options?.nonce || crypto.getRandomValues(new Uint8Array(32)));
    const signerId = await this.getIntentsAddress();
    const publicKey = await this.getPublicKey();

    const message = JSON.stringify({
      deadline: options?.deadline ? new Date(options.deadline).toISOString() : "2100-01-01T00:00:00.000Z",
      nonce: Buffer.from(nonce).toString("base64"),
      verifying_contract: "intents.near",
      signer_id: signerId,
      intents: intents,
    });

    const signature = await this.signMessage(message);
    return {
      signature: `ed25519:${base58.encode(signature)}`,
      public_key: `ed25519:${publicKey}`,
      standard: "raw_ed25519",
      payload: message,
    };
  }
}

export default SolanaWallet;
