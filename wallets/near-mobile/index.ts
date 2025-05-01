import { NearMobileWallet } from "@peersyst/near-mobile-signer/dist/src/wallet/NearMobileWallet";
import { RepositoryErrorCodes } from "@peersyst/near-mobile-signer/src/data-access/errors/index";
import { Network, SessionState } from "@peersyst/near-mobile-signer/src/common/models";
import { NearMobileStrategy } from "@peersyst/near-mobile-signer/dist/src/wallet/NearMobileWallet.types";
import config from "@peersyst/near-mobile-signer/dist/src/common/config/config";
import QRCodeStyling from "qr-code-styling";
import { KeyPair } from "near-api-js";

import { nearMobileFrame, nearMobileFrameHead } from "./view";

document.head.innerHTML = nearMobileFrameHead;

const connector = document.createElement("div");
connector.innerHTML = nearMobileFrame;
document.body.appendChild(connector);

async function setQRCode({ requestUrl }: { requestUrl: string }) {
  const approveButton = document.getElementById("approve-button");
  const qrCodeParent = document.getElementById("qr-code");
  qrCodeParent!.innerHTML = "";

  const qrCode = new QRCodeStyling({
    width: 180,
    height: 180,
    type: "svg",
    data: requestUrl,
    dotsOptions: {
      color: "#FFFFFF",
    },
    backgroundOptions: {
      color: "transparent",
    },
    cornersSquareOptions: {
      color: "#FFFFFF",
    },
  });

  qrCode.append(qrCodeParent!);

  const urlParts = requestUrl.split("/");
  const id = urlParts[urlParts.length - 1];
  const type = urlParts[urlParts.length - 2];
  approveButton!.onclick = () => {
    window.selector.open(
      `https://near-mobile-signer-backend.peersyst.tech/api/deep-link?uuid=${id}&type=${type}`,
      true
    );
  };
}

export class WidgetStrategy implements NearMobileStrategy {
  constructor() {}

  onRequested(id: string, request: any, onClose?: () => Promise<void>): void {
    const requestType = "message" in request ? "message" : "request";
    const requestUrl = `${config.nearMobileWalletUrl}/${requestType}/${id}`;
    setQRCode({ requestUrl });
  }
}

export class SessionRepository {
  constructor() {
    this.loadSessionState();
  }

  async get() {
    const sessionData = await window.selector.storage.get("session");
    if (!sessionData) return {};
    return JSON.parse(sessionData);
  }

  async set(session: SessionState) {
    await window.selector.storage.set("session", JSON.stringify(session));
  }

  async clear() {
    await window.selector.storage.remove("session");
  }

  private async loadSessionState(): Promise<void> {
    const currentSessionState = await this.get();
    if (!currentSessionState)
      await this.set({
        mainnet: { activeAccount: null, accounts: {} },
        testnet: { activeAccount: null, accounts: {} },
      });
  }

  async getKey(network: Network, accountId: string): Promise<KeyPair> {
    const sessionState = await this.get();
    const privateKey = sessionState[network]?.accounts[accountId];
    if (!privateKey) throw new Error(RepositoryErrorCodes.ACCOUNT_KEY_NOT_FOUND);
    return KeyPair.fromString(privateKey);
  }

  async setKey(network: Network, accountId: string, accessKey: KeyPair): Promise<void> {
    const sessionState = await this.get();

    sessionState[network].accounts[accountId] = accessKey.toString();
    await this.set(sessionState);
  }

  async removeKey(network: Network, accountId: string): Promise<void> {
    const sessionState = await this.get();
    if (sessionState[network].activeAccount === accountId) sessionState[network].activeAccount = null;
    delete sessionState[network].accounts[accountId];
    await this.set(sessionState);
  }

  async getActiveAccount(network: Network): Promise<string> {
    const sessionState = await this.get();
    return sessionState[network].activeAccount;
  }

  async setActiveAccount(network: Network, accountId: string): Promise<void> {
    const sessionState = await this.get();
    const accountExists = Object.keys(sessionState[network].accounts).includes(accountId);
    if (!accountExists) throw new Error(RepositoryErrorCodes.INVALID_ACCOUNT_ID);
    sessionState[network].activeAccount = accountId;
    await this.set(sessionState);
  }

  async getAccounts(network: Network): Promise<string[]> {
    const sessionState = await this.get();
    const accounts = sessionState[network].accounts;
    return Object.keys(accounts);
  }

  async getNetworks(): Promise<string[]> {
    const sessionState = await this.get();
    return Object.keys(sessionState);
  }
}

export const initNearMobileWallet = async () => {
  const nearMobileWallet = new NearMobileWallet({
    sessionRepository: new SessionRepository() as any,
    // TODO: Add custom strategy to handle widget
  });

  // @ts-ignore
  nearMobileWallet.defaultStrategy = new WidgetStrategy();

  async function getAccounts() {
    const accountIds = await nearMobileWallet.getAccounts();
    const accounts: { accountId: string; publicKey: string }[] = [];

    for (let i = 0; i < accountIds.length; i++) {
      const publicKey = await nearMobileWallet.signer.getPublicKey(accountIds[i], "mainnet");
      accounts.push({ accountId: accountIds[i], publicKey: publicKey.toString() });
    }

    return accounts;
  }

  return {
    get network() {
      return "mainnet";
    },

    async signIn(data: any) {
      const contractId = data.contractId !== "" ? data.contractId : undefined;
      await nearMobileWallet.signIn({ ...data, contractId: contractId });
      return await getAccounts();
    },

    async signOut() {
      await nearMobileWallet.signOut();
    },

    async getAccounts() {
      return getAccounts();
    },

    async signAndSendTransaction(data: any) {
      return await nearMobileWallet.signAndSendTransaction(data);
    },

    async verifyOwner() {
      throw Error(
        "[NearMobileWallet]: verifyOwner is deprecated, use signMessage method with implementation NEP0413 Standard"
      );
    },

    async signMessage(data: any) {
      const { recipient, nonce, ...rest } = data;
      const result = await nearMobileWallet.signMessage({ ...rest, receiver: recipient, nonce: Array.from(nonce) });
      return {
        accountId: result.accountId,
        signature: result.signature.toString(),
        publicKey: result.publicKey.toString(),
      };
    },

    async signAndSendTransactions(data: any) {
      return await nearMobileWallet.signAndSendTransactions(data);
    },
  };
};

initNearMobileWallet().then((wallet) => {
  window.selector.ready(wallet);
});
