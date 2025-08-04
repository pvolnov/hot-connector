import type { Provider as EvmProvider } from "@reown/appkit-utils/ethers";
import { WalletType } from "../types/multichain";
import base58 from "../helpers/base58";
import { ChainAbstracted } from "./ChainAbstracted";

class EvmWallet implements ChainAbstracted {
  constructor(readonly wallet: EvmProvider) {}

  get type() {
    return WalletType.EVM;
  }

  getAddress = async (): Promise<string> => {
    const addresses = (await this.wallet.request({ method: "eth_requestAccounts" })) as string[];
    if (addresses.length === 0) throw new Error("No account found");
    return addresses[0].toLowerCase();
  };

  getPublicKey = async (): Promise<string> => {
    throw new Error("Not implemented");
  };

  getIntentsAddress = async (): Promise<string> => {
    const address = await this.getAddress();
    return address.toLowerCase();
  };

  signIntentsWithAuth = async (domain: string, intents?: Record<string, any>[]) => {
    const seed = Buffer.from(window.crypto.getRandomValues(new Uint8Array(32))).toString("hex");
    const msgBuffer = new TextEncoder().encode(`${domain}_${seed}`);
    const nonce = await crypto.subtle.digest("SHA-256", msgBuffer);

    return {
      intent: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce) }),
      address: this.getAddress(),
      publicKey: this.getPublicKey(),
      chainId: WalletType.EVM,
      nonce: seed,
    };
  };

  async signMessage(msg: string) {
    const address = await this.getAddress();
    const result: string = await this.wallet.request({ method: "personal_sign", params: [msg, address] });

    const bytes = new Uint8Array(Buffer.from(result.slice(2), "hex"));
    const y = bytes.slice(-1, 0);
    const yInt = parseInt(`0x${Buffer.from(y).toString("hex")}`, 16);

    const zero = Buffer.from("00", "hex");
    const one = Buffer.from("01", "hex");

    return Buffer.concat([bytes.slice(0, -1), yInt === 27 || yInt === 0 ? zero : one]);
  }

  async sendTransaction(tx: string) {
    return await this.wallet.request({ method: "eth_sendTransaction", params: [tx] });
  }

  async signIntents(
    intents: Record<string, any>[],
    options?: { deadline?: number; nonce?: Buffer | Uint8Array }
  ): Promise<Record<string, any>> {
    const address = await this.getAddress();
    const nonce = new Uint8Array(options?.nonce || crypto.getRandomValues(new Uint8Array(32)));

    const message = JSON.stringify({
      deadline: options?.deadline ? new Date(options.deadline).toISOString() : "2100-01-01T00:00:00.000Z",
      nonce: Buffer.from(nonce).toString("base64"),
      verifying_contract: "intents.near",
      signer_id: address.toLowerCase(),
      intents: intents,
    });

    const buffer = await this.signMessage(message);
    return {
      signature: `secp256k1:${base58.encode(buffer)}`,
      payload: message,
      standard: "erc191",
    };
  }
}

export default EvmWallet;
