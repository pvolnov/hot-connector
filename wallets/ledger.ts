import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import type Transport from "@ledgerhq/hw-transport";
import * as nearAPI from "near-api-js";
import { providers } from "near-api-js";
import { Schema, serialize } from "borsh";

// Further reading regarding APDU Ledger API:
// - https://gist.github.com/Wollac/49f0c4e318e42f463b8306298dfb4f4a
// - https://github.com/LedgerHQ/app-near/blob/master/workdir/app-near/src/constants.h

export const CLA = 0x80; // Always the same for Ledger.

export enum NEAR_INS {
  GET_VERSION = 0x06,
  GET_PUBLIC_KEY = 0x04,
  GET_WALLET_ID = 0x05,
  SIGN_TRANSACTION = 0x02,
  NEP413_SIGN_MESSAGE = 0x07,
  NEP366_SIGN_DELEGATE_ACTION = 0x08,
}

export const P1_LAST = 0x80; // End of Bytes to Sign (finalize)
export const P1_MORE = 0x00; // More bytes coming
export const P1_IGNORE = 0x00;
export const P2_IGNORE = 0x00;
export const CHUNK_SIZE = 250;

// Converts BIP32-compliant derivation path to a Buffer.
// More info here: https://github.com/LedgerHQ/ledger-live-common/blob/master/docs/derivation.md
export function parseDerivationPath(derivationPath: string) {
  const parts = derivationPath.split("/");

  return Buffer.concat(
    parts
      .map((part) => {
        return part.endsWith(`'`) ? Math.abs(parseInt(part.slice(0, -1))) | 0x80000000 : Math.abs(parseInt(part));
      })
      .map((i32) => {
        return Buffer.from([(i32 >> 24) & 0xff, (i32 >> 16) & 0xff, (i32 >> 8) & 0xff, i32 & 0xff]);
      })
  );
}

// TODO: Understand what this is exactly. What's so special about 87?
export const networkId = "W".charCodeAt(0);

interface GetPublicKeyParams {
  derivationPath: string;
}

interface SignParams {
  data: Buffer;
  derivationPath: string;
}

interface InternalSignParams extends SignParams {
  ins: NEAR_INS.NEP366_SIGN_DELEGATE_ACTION | NEAR_INS.NEP413_SIGN_MESSAGE | NEAR_INS.SIGN_TRANSACTION;
}

interface EventMap {
  disconnect: Error;
}

export interface Subscription {
  remove: () => void;
}

export class LedgerClient {
  private transport: Transport | null = null;

  isConnected = () => {
    return Boolean(this.transport);
  };

  connect = async () => {
    this.transport = await TransportWebHID.create();

    const handleDisconnect = () => {
      this.transport?.off("disconnect", handleDisconnect);
      this.transport = null;
    };

    this.transport.on("disconnect", handleDisconnect);
  };

  disconnect = async () => {
    if (!this.transport) {
      throw new Error("Device not connected");
    }

    await this.transport.close();
    this.transport = null;
  };

  setScrambleKey = (key: string) => {
    if (!this.transport) {
      throw new Error("Device not connected");
    }

    this.transport.setScrambleKey(key);
  };

  on = <Event extends keyof EventMap>(event: Event, callback: (data: EventMap[Event]) => void): Subscription => {
    if (!this.transport) {
      throw new Error("Device not connected");
    }

    this.transport.on(event, callback);

    return {
      remove: () => this.transport?.off(event, callback),
    };
  };

  off = (event: keyof EventMap, callback: () => void) => {
    if (!this.transport) {
      throw new Error("Device not connected");
    }

    this.transport.off(event, callback);
  };

  getVersion = async () => {
    if (!this.transport) {
      throw new Error("Device not connected");
    }

    const res = await this.transport.send(CLA, NEAR_INS.GET_VERSION, P1_IGNORE, P2_IGNORE);

    const [major, minor, patch] = Array.from(res);

    return `${major}.${minor}.${patch}`;
  };

  getPublicKey = async ({ derivationPath }: GetPublicKeyParams) => {
    if (!this.transport) {
      throw new Error("Device not connected");
    }

    const res = await this.transport.send(
      CLA,
      NEAR_INS.GET_PUBLIC_KEY,
      P2_IGNORE,
      networkId,
      parseDerivationPath(derivationPath)
    );

    return nearAPI.utils.serialize.base_encode(res.subarray(0, -2));
  };

  private internalSign = async ({ data, derivationPath, ins }: InternalSignParams) => {
    if (!this.transport) {
      throw new Error("Device not connected");
    }

    // NOTE: getVersion call resets state to avoid starting from partially filled buffer
    await this.getVersion();

    const allData = Buffer.concat([parseDerivationPath(derivationPath), data]);

    for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
      const isLastChunk = offset + CHUNK_SIZE >= allData.length;

      const response = await this.transport.send(
        CLA,
        ins,
        isLastChunk ? P1_LAST : P1_MORE,
        P2_IGNORE,
        Buffer.from(allData.subarray(offset, offset + CHUNK_SIZE))
      );

      if (isLastChunk) {
        return Buffer.from(response.subarray(0, -2));
      }
    }

    throw new Error("Invalid data or derivation path");
  };

  sign = async ({ data, derivationPath }: SignParams) => {
    return this.internalSign({
      data,
      derivationPath,
      ins: NEAR_INS.SIGN_TRANSACTION,
    });
  };

  signMessage = async ({ data, derivationPath }: SignParams) => {
    return this.internalSign({
      data,
      derivationPath,
      ins: NEAR_INS.NEP413_SIGN_MESSAGE,
    });
  };

  signDelegateAction = async ({ data, derivationPath }: SignParams) => {
    return this.internalSign({
      data,
      derivationPath,
      ins: NEAR_INS.NEP366_SIGN_DELEGATE_ACTION,
    });
  };
}

class NearProvider {
  private provider: providers.JsonRpcProvider;

  constructor() {
    this.provider = new providers.JsonRpcProvider({ url: "https://rpc.mainnet.near.org" });
  }

  async checkAccessKey(accountId: string, publicKey: string) {
    const res = await this.provider.query({
      request_type: "view_access_key",
      finality: "final",
      account_id: accountId,
      public_key: `ed25519:${publicKey}`,
    });

    if ((res as any).error) {
      return false;
    }

    return true;
  }
}

const client = new LedgerClient();
const nearProvider = new NearProvider();

const NEAR_DEFAULT_PATH = "44'/397'/0'/0'/";

export class LedgerPayload {
  message: string;
  nonce: Buffer;
  recipient: string;
  callbackUrl?: string;

  constructor(data: LedgerPayload) {
    this.message = data.message;
    this.nonce = data.nonce;
    this.recipient = data.recipient;
    if (data.callbackUrl) {
      this.callbackUrl = data.callbackUrl;
    }
  }
}

export const ledgerPayloadSchema: Schema = {
  struct: {
    message: "string",
    nonce: { array: { type: "u8", len: 32 } },
    recipient: "string",
    callbackUrl: { option: "string" },
  },
};

export const serializeLedgerNEP413Payload = (ledgerPayload: LedgerPayload): Buffer => {
  const payload = new LedgerPayload({ ...ledgerPayload });
  return Buffer.from(serialize(ledgerPayloadSchema, payload));
};

class Wallet {
  private hdPathIndex = 1;

  private get hdPath() {
    return `${NEAR_DEFAULT_PATH}${this.hdPathIndex}'`;
  }

  getAccounts = async () => {
    const ledgerAccount = await window.selector.storage.get("ledger-account");

    if (ledgerAccount) return JSON.parse(ledgerAccount);
    return [];
  };

  private renderProcessInLedger = async () => {
    const [{ h, render }, htm] = await Promise.all([
      import("https://esm.sh/preact@10.19.3" as any),
      import("https://unpkg.com/htm@3.1.1?module" as any),
    ]);

    const htmlBinded = htm.default.bind(h);

    render(
      htmlBinded`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:1rem">Process in Ledger</div>`,
      document.body
    );
  };

  async signIn() {
    const [{ h, render }, htm] = await Promise.all([
      import("https://esm.sh/preact@10.19.3" as any),
      import("https://unpkg.com/htm@3.1.1?module" as any),
    ]);

    const htmlBinded = htm.default.bind(h);

    return new Promise((resolve, reject) => {
      const tryConnect = async () => {
        try {
          await client.connect();
          const publicKey = await new Promise(async (resolve) => {
            await this.renderProcessInLedger();
            const publicKey = await client.getPublicKey({ derivationPath: this.hdPath });
            resolve(publicKey);
          });
          const accountId = await renderManuallyProviderAccountId(publicKey as string);
          window.selector.storage.set("ledger-account", JSON.stringify([{ accountId, publicKey }]));
          resolve([{ accountId, publicKey }]);
        } catch (err) {
          reject(err);
        }
      };

      const renderSignIn = () => {
        render(
          htmlBinded`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:1rem">
              <h1>Ledger Connect</h1>
              <button style="background-color: #fff; color: #000; padding: 10px 20px; border-radius: 5px; height: 40px;" onClick=${renderSpecifyHDPath}>Specify HD Path</button>
              <button style="background-color: #fff; color: #000; padding: 10px 20px; border-radius: 5px; height: 40px;" onClick=${tryConnect}>Connect</button>
            </div>
          `,
          document.body
        );
      };

      const renderManuallyProviderAccountId = (publicKey: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          let accountId = "";
          let error = false;

          const update = () => {
            render(
              htmlBinded`
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:1rem;padding: 0 1rem;">
                  <h1 style="text-align: center;font-size: 16px;">Failed to automatically find account id. Provide it manually:</h1>
                  <input
                    style="background-color: #fff; color: #000; padding: 10px 20px; border-radius: 5px; width: 200px; height: 40px; box-sizing: border-box;"
                    type="text"
                    value=${accountId}
                    onInput=${(e: any) => {
                      accountId = e.target.value;
                      error = false;
                      update(); // перерендер без ошибок
                    }}
                  />
                  <button
                    style="background-color: #fff; color: #000; padding: 10px 20px; border-radius: 5px; height: 40px;"
                    onClick=${async () => {
                      try {
                        await nearProvider.checkAccessKey(accountId, publicKey);
                        resolve(accountId);
                      } catch {
                        error = true;
                        update();
                      }
                    }}
                  >
                    Submit
                  </button>
                  ${error ? htmlBinded`<span style="color: red;">Invalid account id</span>` : null}
                </div>
              `,
              document.body
            );
          };

          update();
        });
      };

      const renderSpecifyHDPath = () => {
        render(
          htmlBinded`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:1rem">
              <h1>Specify HD Path</h1>
              <div style="display:flex;gap:0.5rem">
                <span style="background-color: #fff; color: #000; padding: 10px 20px; border-radius: 5px; height: 40px; box-sizing: border-box;">${NEAR_DEFAULT_PATH}</span>
                <input
                  style="background-color: #fff; color: #000; padding: 10px 20px; border-radius: 5px; width: 100px; height: 40px; box-sizing: border-box;"
                  type="number"
                  min="0"
                  value=${this.hdPathIndex}
                  onInput=${(e: any) => (this.hdPathIndex = parseInt(e.target.value))}
                />
              </div>
              <button style="background-color: #fff; color: #000; padding: 10px 20px; border-radius: 5px; height: 40px;" onClick=${renderSignIn}>Back</button>
            </div>
          `,
          document.body
        );
      };

      renderSignIn();
    });
  }

  signOut = async () => {
    return [];
  };

  signMessage = async ({ message }: { message: string }) => {
    if (!client.isConnected()) {
      await client.connect();
    }

    try {
      const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));

      const serializedPayload = serializeLedgerNEP413Payload({
        message,
        nonce,
        recipient: "uuint.near",
      });

      const signatureBuffer = await client.signMessage({
        data: serializedPayload,
        derivationPath: this.hdPath,
      });

      return {
        signature: nearAPI.utils.serialize.base_encode(signatureBuffer),
      };
    } catch (err) {
      console.error("Failed to sign message with Ledger:", err);
      throw err;
    }
  };

  signAndSendTransaction = async ({ receiverId, actions }: { receiverId: string; actions: any[] }) => {
    await this.renderProcessInLedger();

    if (!client.isConnected()) {
      await new Promise(async (resolve) => {
        await this.renderProcessInLedger();
        await client.connect();
        resolve(undefined);
      });
    }

    const publicKey = await client.getPublicKey({ derivationPath: this.hdPath });
    const accountId = (await this.getAccounts())[0].accountId;

    const provider = new providers.JsonRpcProvider({ url: "https://rpc.mainnet.near.org" });

    const block = await provider.block({ finality: "final" });
    const blockHash = nearAPI.utils.serialize.base_decode(block.header.hash);

    const accessKey: any = await provider.query({
      request_type: "view_access_key",
      finality: "final",
      account_id: accountId,
      public_key: `ed25519:${publicKey}`,
    });

    const nonce = accessKey.nonce + 1;

    const mappedActions = actions.map((a: any) => {
      switch (a.type) {
        case "Transfer":
          return nearAPI.transactions.transfer(a.params.deposit);
        case "FunctionCall":
          return nearAPI.transactions.functionCall(
            a.params.methodName,
            Buffer.from(JSON.stringify(a.params.args)),
            a.params.gas,
            a.params.deposit
          );
        default:
          throw new Error(`Unsupported action type: ${a.type}`);
      }
    });

    const tx = nearAPI.transactions.createTransaction(
      accountId,
      nearAPI.utils.PublicKey.from(publicKey),
      receiverId,
      nonce,
      mappedActions,
      blockHash
    );

    const serializedTx = nearAPI.utils.serialize.serialize(nearAPI.transactions.SCHEMA.Transaction, tx);

    const signature = await client.sign({
      data: Buffer.from(serializedTx),
      derivationPath: this.hdPath,
    });

    const signedTx = new nearAPI.transactions.SignedTransaction({
      transaction: tx,
      signature: new nearAPI.transactions.Signature({
        keyType: 0,
        data: signature,
      }),
    });

    const signedSerialized = nearAPI.utils.serialize.serialize(nearAPI.transactions.SCHEMA.SignedTransaction, signedTx);

    const result = await provider.sendJsonRpc("broadcast_tx_commit", [
      Buffer.from(signedSerialized).toString("base64"),
    ]);

    return result;
  };

  signAndSendTransactions = async () => {
    return [
      {
        transaction: "transaction",
      },
    ];
  };
}

const wallet = new Wallet();

console.log("Ledger wallet ready", window.selector);
window.selector.ready(wallet);
