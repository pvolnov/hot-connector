import type { Account } from "@near-wallet-selector/core";
import { EMeteorWalletSignInType, getNetworkPreset, MeteorWallet } from "@meteorwallet/sdk";
import { SelectorStorageKeyStore } from "./keystore";
import * as nearAPI from "near-api-js";

const setupWalletState = async (network: string) => {
  const keyStore = new SelectorStorageKeyStore();
  const near = await nearAPI.connect({ keyStore, ...getNetworkPreset("mainnet"), headers: {} });
  const wallet = new MeteorWallet({ near, appKeyPrefix: "near_app" });
  return { wallet, keyStore };
};

const img = document.createElement("img");
img.src = "https://github.com/Meteor-Wallet/meteor-public/raw/main/logo_svg.svg";
img.style.width = "150px";
img.style.height = "150px";
img.style.margin = "auto";
img.style.objectFit = "cover";
document.body.appendChild(img);

document.body.style.display = "flex";
document.body.style.alignItems = "center";
document.body.style.justifyContent = "center";
document.body.style.height = "100vh";

const createMeteorWallet = async () => {
  const _state = await setupWalletState("mainnet");

  const getAccounts = async (network: string): Promise<Array<Account>> => {
    const accountId = _state.wallet.getAccountId();
    const account = _state.wallet.account();
    if (!accountId || !account) return [];

    const publicKey = await account.connection.signer.getPublicKey(account.accountId, network);
    return [{ accountId, publicKey: publicKey ? publicKey.toString() : "" }];
  };

  return {
    async signIn({ network, contractId, methodNames }: any) {
      if (methodNames.length) {
        await _state.wallet.requestSignIn({
          methods: methodNames,
          type: EMeteorWalletSignInType.SELECTED_METHODS,
          contract_id: contractId,
        });
      } else {
        await _state.wallet.requestSignIn({
          type: EMeteorWalletSignInType.ALL_METHODS,
          contract_id: contractId,
        });
      }

      const accounts = await getAccounts(network);
      return accounts;
    },

    async signOut() {
      if (_state.wallet.isSignedIn()) {
        await _state.wallet.signOut();
      }
    },

    async isSignedIn() {
      if (!_state.wallet) return false;
      return _state.wallet.isSignedIn();
    },

    async getAccounts(data: any) {
      return getAccounts(data.network);
    },

    async verifyOwner({ message }: any) {
      const response = await _state.wallet.verifyOwner({ message });
      if (response.success) return response.payload;
      throw new Error(`Couldn't verify owner: ${response.message}`);
    },

    async signMessage({ network, message, nonce, recipient, state }: any) {
      const accountId = _state.wallet.getAccountId();
      const response = await _state.wallet.signMessage({ message, nonce, recipient, accountId, state });
      if (response.success) return response.payload;
      throw new Error(`Couldn't sign message owner: ${response.message}`);
    },

    async signAndSendTransaction({ network, signerId, receiverId, actions }: any) {
      if (!_state.wallet.isSignedIn()) {
        throw new Error("Wallet not signed in");
      }

      const account = _state.wallet.account()!;
      return account["signAndSendTransaction_direct"]({ receiverId: receiverId, actions });
    },

    async signAndSendTransactions({ network, transactions }: any) {
      if (!_state.wallet.isSignedIn()) throw new Error("Wallet not signed in");
      return _state.wallet.requestSignTransactions({ transactions });
    },
  };
};

createMeteorWallet().then((wallet) => {
  window.selector.ready(wallet);
});
