import type { SendTransactionRequest, TonConnectUI } from "@tonconnect/ui";
import { ChainAbstracted } from "./ChainAbstracted";
import { WalletType } from "../types/multichain";
import base58 from "../helpers/base58";
import { hex } from "../helpers/hex";
import base64 from "../helpers/base64";

class TonWallet implements ChainAbstracted {
  constructor(readonly wallet: TonConnectUI) {}

  get type() {
    return WalletType.TON;
  }

  getAddress = async (): Promise<string> => {
    if (!this.wallet.account) throw new Error("No account found");
    return this.wallet.account.address;
  };

  getPublicKey = async (): Promise<string> => {
    if (!this.wallet.account?.publicKey) throw new Error("No public key found");
    return this.wallet.account.publicKey;
  };

  async getIntentsAddress() {
    const publicKey = await this.getPublicKey();
    return publicKey.toLowerCase();
  }

  async sendTransaction(msgs: SendTransactionRequest) {
    return this.wallet.sendTransaction(msgs);
  }

  async signIntentsWithAuth(domain: string, intents?: Record<string, any>[]) {
    const seed = hex.encode(window.crypto.getRandomValues(new Uint8Array(32)));
    const msgBuffer = new TextEncoder().encode(`${domain}_${seed}`);
    const nonce = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const publicKey = await this.getPublicKey();
    const address = await this.getAddress();

    return {
      intent: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce) }),
      publicKey: `ed25519:${publicKey}`,
      chainId: WalletType.TON,
      address: address,
      nonce: seed,
    };
  }

  async signIntents(intents: Record<string, any>[], options?: { deadline?: number; nonce?: Uint8Array }) {
    const publicKey = await this.getPublicKey();
    const nonce = new Uint8Array(options?.nonce || window.crypto.getRandomValues(new Uint8Array(32)));
    const message = {
      deadline: new Date(Date.now() + 24 * 3_600_000 * 365).toISOString(),
      signer_id: await this.getIntentsAddress(),
      verifying_contract: "intents.near",
      nonce: base64.encode(nonce),
      intents,
    };

    const result = await this.wallet.signData({ text: JSON.stringify(message), type: "text" });
    return {
      ...result,
      standard: "ton_connect",
      signature: "ed25519:" + base58.encode(base64.decode(result.signature)),
      public_key: `ed25519:${publicKey}`,
    };
  }
}

export default TonWallet;
