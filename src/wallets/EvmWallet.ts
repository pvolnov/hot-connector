import type { Provider as EvmProvider } from "@reown/appkit-utils/ethers";

import { ChainAbstracted, WalletType } from "./ChainAbstracted";
import base58 from "../helpers/base58";
import { hex } from "../helpers/hex";
import base64 from "../helpers/base64";

class EvmWallet implements ChainAbstracted {
  constructor(readonly wallet: EvmProvider) {}

  get type() {
    return WalletType.EVM;
  }

  getAddress = async (): Promise<string> => {
    const addresses = (await this.wallet.request({ method: "eth_requestAccounts" })) as string[];
    if (!addresses || addresses.length === 0) throw new Error("No account found");
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
    const seed = hex.encode(window.crypto.getRandomValues(new Uint8Array(32)));
    const msgBuffer = new TextEncoder().encode(`${domain}_${seed}`);
    const nonce = await window.crypto.subtle.digest("SHA-256", new Uint8Array(msgBuffer));
    const address = await this.getAddress();

    return {
      signed: await this.signIntents(intents || [], { nonce: new Uint8Array(nonce) }),
      address: address,
      publicKey: address,
      chainId: WalletType.EVM,
      seed,
    };
  };

  async signMessage(msg: string) {
    const address = await this.getAddress();
    const result: string = await this.wallet.request({ method: "personal_sign", params: [msg, address] });

    const bytes = hex.decode(result.slice(2));
    const y = bytes.slice(-1, 0);
    const yInt = parseInt(`0x${hex.encode(y)}`, 16);

    const zero = hex.decode("00");
    const one = hex.decode("01");

    return new Uint8Array([...bytes.slice(0, -1), ...(yInt === 27 || yInt === 0 ? zero : one)]);
  }

  async sendTransaction(tx: string) {
    return await this.wallet.request({ method: "eth_sendTransaction", params: [tx] });
  }

  async signIntents(
    intents: Record<string, any>[],
    options?: { deadline?: number; nonce?: Uint8Array }
  ): Promise<Record<string, any>> {
    const address = await this.getAddress();
    const nonce = new Uint8Array(options?.nonce || window.crypto.getRandomValues(new Uint8Array(32)));

    const message = JSON.stringify({
      deadline: options?.deadline ? new Date(options.deadline).toISOString() : "2100-01-01T00:00:00.000Z",
      verifying_contract: "intents.near",
      signer_id: address.toLowerCase(),
      nonce: base64.encode(nonce),
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
