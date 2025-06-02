import type { Account } from "@near-wallet-selector/core";
import { EMeteorWalletSignInType, getNetworkPreset, MeteorWallet } from "@meteorwallet/sdk";
import { SelectorStorageKeyStore } from "./keystore";
import * as nearAPI from "near-api-js";

const keyStore = new SelectorStorageKeyStore();
const setupWalletState = async (network: string) => {
  const near = await nearAPI.connect({ keyStore, ...getNetworkPreset(network), headers: {} });
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
  const _states: Record<string, { wallet: MeteorWallet; keyStore: SelectorStorageKeyStore }> = {};

  const getState = async (network: string) => {
    if (network !== "testnet" && network !== "mainnet") throw new Error("Invalid network");
    if (_states[network]) return _states[network];
    const _state = await setupWalletState(network);
    _states[network] = _state;
    return _state;
  };

  const getAccounts = async (network: string): Promise<Array<Account>> => {
    const _state = await getState(network);
    const accountId = _state.wallet.getAccountId();
    const account = _state.wallet.account();
    if (!accountId || !account) return [];

    const publicKey = await account.connection.signer.getPublicKey(account.accountId, network);
    return [{ accountId, publicKey: publicKey ? publicKey.toString() : "" }];
  };

  return {
    async signIn({ network, contractId, methodNames }: any) {
      const state = await getState(network);
      if (methodNames?.length) {
        await state.wallet.requestSignIn({
          methods: methodNames,
          type: EMeteorWalletSignInType.SELECTED_METHODS,
          contract_id: contractId,
        });
      } else {
        await state.wallet.requestSignIn({
          type: EMeteorWalletSignInType.ALL_METHODS,
          contract_id: contractId,
        });
      }

      const accounts = await getAccounts(network);
      return accounts;
    },

    async signOut({ network }: any) {
      const state = await getState(network);
      if (state.wallet.isSignedIn()) {
        await state.wallet.signOut();
      }
    },

    async isSignedIn({ network }: any) {
      const state = await getState(network);
      if (!state.wallet) return false;
      return state.wallet.isSignedIn();
    },

    async getAccounts({ network }: any) {
      return getAccounts(network);
    },

    async verifyOwner({ network, message }: any) {
      const state = await getState(network);
      const response = await state.wallet.verifyOwner({ message });
      if (response.success) return response.payload;
      throw new Error(`Couldn't verify owner: ${response.message}`);
    },

    async signMessage({ network, message, nonce, recipient, state }: any) {
      const { wallet } = await getState(network);
      const accountId = wallet.getAccountId();
      const response = await wallet.signMessage({ message, nonce, recipient, accountId, state });
      if (response.success) return response.payload;
      throw new Error(`Couldn't sign message owner: ${response.message}`);
    },

    async signAndSendTransaction({ network, signerId, receiverId, actions }: any) {
      const state = await getState(network);
      if (!state.wallet.isSignedIn()) throw new Error("Wallet not signed in");

      const account = state.wallet.account()!;
      return account["signAndSendTransaction_direct"]({ receiverId: receiverId, actions });
    },

    async signAndSendTransactions({ network, transactions }: any) {
      const state = await getState(network);
      if (!state.wallet.isSignedIn()) throw new Error("Wallet not signed in");
      return state.wallet.requestSignTransactions({ transactions });
    },
  };
};

createMeteorWallet().then((wallet) => {
  window.selector.ready(wallet);
});
