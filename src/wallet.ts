import uuid4 from "uuid4";
import { FinalExecutionOutcome } from "@near-js/types";

import {
  Account,
  NearWallet,
  SignAndSendTransactionParams,
  SignAndSendTransactionsParams,
  SignedMessage,
  SignInParams,
  SignMessageParams,
  VerifiedOwner,
  VerifyOwnerParams,
  WalletManifest,
} from "./types/wallet";

export class SandboxExecutor {
  iframe?: HTMLIFrameElement;
  _initializeTask: Promise<HTMLIFrameElement> | null = null;
  origin = uuid4();

  constructor(readonly id: string, readonly endpoint: string) {
    this.id = id;
  }

  async _initialize() {
    this.iframe = document.createElement("iframe");
    this.iframe.setAttribute("sandbox", "allow-scripts");
    this.iframe.allow = "usb *; hid *;";
    this.iframe.srcdoc = this.code;

    const content = document.querySelector(".wallet-selector__modal-content");

    if (content) {
      content.innerHTML = ``;
      content.appendChild(this.iframe);
    }

    let readyPromiseResolve: (value: void) => void;
    const readyPromise = new Promise<void>((resolve, reject) => {
      readyPromiseResolve = resolve;
    });

    window.addEventListener("message", (event) => {
      if (event.data.origin !== this.origin) return;

      if (event.data.method === "setStorage") {
        localStorage.setItem(`${this.id}:${event.data.params.key}`, event.data.params.value);
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
        return;
      }

      if (event.data.method === "getStorage") {
        const value = localStorage.getItem(`${this.id}:${event.data.params.key}`);
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: value }, "*");
        return;
      }

      if (event.data.method === "getStorageKeys") {
        const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: keys }, "*");
        return;
      }

      if (event.data.method === "removeStorage") {
        localStorage.removeItem(`${this.id}:${event.data.params.key}`);
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
        return;
      }

      if (event.data.method === "redirect") {
        window.location.href = event.data.params.url;
        this.iframe?.contentWindow?.postMessage({ ...event.data, status: "success", result: null }, "*");
        return;
      }

      if (event.data.method === "wallet-ready") {
        readyPromiseResolve();
      }
    });

    await readyPromise;
    return this.iframe;
  }

  get code() {
    return `
      <style>
        :root {
          --background-color: rgb(40, 40, 40);
          --text-color: rgb(255, 255, 255);
          --border-color: rgb(209, 209, 209);
        }

        * {
          font-family: system-ui, Avenir, Helvetica, Arial, sans-serif
        }

        body, html {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          background-color: var(--background-color);
          color: var(--text-color);
        }
      </style>

      <script>
      window.selector = {
        wallet: null,
        location: "${window.location.href}",
      
        uuid() {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        },
      
        async ready(wallet) {
          window.parent.postMessage({ method: "wallet-ready", origin: "${this.origin}" }, "*");
          window.selector.wallet = wallet;
        },
    
        async call(method, params) {
          const id = window.selector.uuid();
          window.parent.postMessage({ method, params, id, origin: "${this.origin}" }, "*");

          return new Promise((resolve, reject) => {
            const handler = (event) => {
              if (event.data.id !== id || event.data.origin !== "${this.origin}") return;
              window.removeEventListener("message", handler);

              if (event.data.status === "failed") reject(event.data.result);
              else resolve(event.data.result);
            };

            window.addEventListener("message", handler);
          });
        },
  
        async redirect(url) {
          await window.selector.call("redirect", { url });
        },
      
        storage: {
          async set(key, value) {
            await window.selector.call("setStorage", { key, value });
          },
      
          async get(key) {
            return await window.selector.call("getStorage", { key });
          },
      
          async remove(key) {
            await window.selector.call("removeStorage", { key });
          },

          async keys() {
            return await window.selector.call("getStorageKeys", {});
          },
        },
      };
      
      window.addEventListener("message", async (event) => {
        if (event.data.origin !== "${this.origin}") return;
        if (!event.data.method?.startsWith("wallet:")) return;
      
        const wallet = window.selector.wallet;
        const method = event.data.method.replace("wallet:", "");
        const payload = { id: event.data.id, method: event.data.method, origin: "${this.origin}" };
      
        if (wallet == null || typeof wallet[method] !== "function") {
          const data = { ...payload, status: "failed", result: "Method not found" };
          window.parent.postMessage(data, "*");
          return;
        }
      
        try {
          const result = await wallet[method](event.data.params);
          window.parent.postMessage({ ...payload, status: "success", result }, "*");
        } catch (error) {
          const data = { ...payload, status: "failed", result: error };
          window.parent.postMessage(data, "*");
        }
      });
      </script>
      
      <script type="module" src="${this.endpoint}"></script>
    `;
  }

  async call<T>(method: string, params: any): Promise<T> {
    if (!this._initializeTask) this._initializeTask = this._initialize();
    const iframe = await this._initializeTask;

    const id = uuid4();
    iframe.contentWindow?.postMessage({ method, params, id, origin: this.origin }, "*");

    return new Promise<T>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.id !== id || event.data.origin !== this.origin) return;

        window.removeEventListener("message", handler);
        if (event.data.status === "failed") reject(event.data.result);
        else resolve(event.data.result);
      };

      window.addEventListener("message", handler);
    });
  }

  async clearStorage() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.id}:`));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}

export class SandboxWallet implements NearWallet {
  private executor: SandboxExecutor;

  constructor(readonly manifest: WalletManifest) {
    this.executor = new SandboxExecutor(manifest.id, manifest.executor);
  }

  async signIn(params: SignInParams): Promise<Array<Account>> {
    return this.executor.call("wallet:signIn", params);
  }

  async signOut(): Promise<void> {
    await this.executor.call("wallet:signOut", {});
    await this.executor.clearStorage();
  }

  async getAccounts(): Promise<Array<Account>> {
    return this.executor.call("wallet:getAccounts", {});
  }

  async verifyOwner(params: VerifyOwnerParams): Promise<VerifiedOwner | void> {
    return this.executor.call("wallet:verifyOwner", params);
  }

  async signAndSendTransaction(params: SignAndSendTransactionParams): Promise<FinalExecutionOutcome> {
    return this.executor.call("wallet:signAndSendTransaction", params);
  }

  async signAndSendTransactions(params: SignAndSendTransactionsParams): Promise<Array<FinalExecutionOutcome>> {
    return this.executor.call("wallet:signAndSendTransactions", params);
  }

  async signMessage?(params: SignMessageParams): Promise<SignedMessage | void> {
    return this.executor.call("wallet:signMessage", params);
  }
}
