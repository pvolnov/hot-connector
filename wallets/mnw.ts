import * as nearAPI from "near-api-js";
import { KeyPair, PublicKey } from "@near-js/crypto";
import type { Transaction, Optional, Account } from "@near-wallet-selector/core";
import { createAction } from "@near-wallet-selector/wallet-utils";
import { Action } from "near-api-js/lib/transaction";
import * as borsh from "borsh";

import { SelectorStorageKeyStore } from "./keystore";

const keyStore = new SelectorStorageKeyStore();

const _completeSignInWithAccessKey = async () => {
  const authData = await window.selector.storage.get("authData");
  if (authData) return JSON.parse(authData);

  const currentUrl = new URL(window.selector.location);
  const publicKey = currentUrl.searchParams.get("public_key") || "";
  const allKeys = (currentUrl.searchParams.get("all_keys") || "").split(",");
  const accountId = currentUrl.searchParams.get("account_id") || "";

  if (accountId) {
    const authData = { accountId, allKeys };
    await window.selector.storage.set("authData", JSON.stringify(authData));

    if (publicKey) {
      const keyPair = await keyStore.getKey("mainnet", "pending_key:" + publicKey);
      await keyStore.setKey("mainnet", accountId, keyPair);
      await keyStore.removeKey("mainnet", "pending_key:" + publicKey);
    }

    return { accountId, allKeys };
  }

  return null;
};

const setupWalletState = async () => {
  const authData = await _completeSignInWithAccessKey();

  const near = await nearAPI.connect({
    walletUrl: "https://app.mynearwallet.com",
    nodeUrl: "https://rpc.mainnet.near.org",
    networkId: "mainnet",
    headers: {},
    keyStore,
  });

  const account = authData ? await near.account(authData.accountId) : null;
  return { near, account, keyStore, authData };
};

const MyNearWallet = async () => {
  const _state = await setupWalletState();

  const getAccounts = async (): Promise<Array<Account>> => {
    if (!_state.account) return [];
    const publicKey = await _state.account.connection.signer.getPublicKey(_state.account.accountId, "mainnet");
    return [{ accountId: _state.account.accountId, publicKey: publicKey ? publicKey.toString() : "" }];
  };

  const transformTransactions = async (transactions: Array<Optional<Transaction, "signerId">>) => {
    if (!_state.account) return [];
    const account = _state.account;
    const { networkId, signer, provider } = account.connection;
    const localKey = await signer.getPublicKey(account.accountId, networkId);

    const accessKeyMatchesTransaction = async (
      accessKey: any,
      receiverId: string,
      actions: Action[]
    ): Promise<boolean> => {
      const {
        access_key: { permission },
      } = accessKey;

      if (permission === "FullAccess") return true;
      if (permission.FunctionCall) {
        const { receiver_id: allowedReceiverId, method_names: allowedMethods } = permission.FunctionCall;
        /********************************
          Accept multisig access keys and let wallets attempt to signAndSendTransaction
          If an access key has itself as receiverId and method permission add_request_and_confirm, then it is being used in a wallet with multisig contract: https://github.com/near/core-contracts/blob/671c05f09abecabe7a7e58efe942550a35fc3292/multisig/src/lib.rs#L149-L153
          ********************************/
        if (allowedReceiverId === account.accountId && allowedMethods.includes("add_request_and_confirm")) return true;
        if (allowedReceiverId === receiverId) {
          if (actions.length !== 1) return false;
          const [{ functionCall }] = actions;

          return (
            functionCall &&
            (!functionCall.deposit || functionCall.deposit.toString() === "0") && // TODO: Should support charging amount smaller than allowance?
            (allowedMethods.length === 0 || allowedMethods.includes(functionCall.methodName))
          );
        }
      }

      return false;
    };

    const accessKeyForTransaction = async (
      receiverId: string,
      actions: Action[],
      localKey?: PublicKey
    ): Promise<any> => {
      const accessKeys = await account.getAccessKeys();
      if (localKey) {
        const accessKey = accessKeys.find((key) => key.public_key.toString() === localKey.toString());
        if (accessKey && (await accessKeyMatchesTransaction(accessKey, receiverId, actions))) {
          return accessKey;
        }
      }

      const walletKeys = _state.authData?.allKeys;
      for (const accessKey of accessKeys) {
        if (
          walletKeys.indexOf(accessKey.public_key) !== -1 &&
          (await accessKeyMatchesTransaction(accessKey, receiverId, actions))
        ) {
          return accessKey;
        }
      }

      return null;
    };

    return Promise.all(
      transactions.map(async (transaction, index) => {
        const actions = transaction.actions.map((action) => createAction(action));
        const accessKey = await accessKeyForTransaction(transaction.receiverId, actions, localKey);

        if (!accessKey)
          throw new Error(`Failed to find matching key for transaction sent to ${transaction.receiverId}`);

        const block = await provider.block({ finality: "final" });
        const nonce = accessKey.access_key.nonce + BigInt(index + 1);

        return nearAPI.transactions.createTransaction(
          account.accountId,
          nearAPI.utils.PublicKey.from(accessKey.public_key),
          transaction.receiverId,
          nonce,
          actions,
          nearAPI.utils.serialize.base_decode(block.header.hash)
        );
      })
    );
  };

  return {
    async signIn({ network, contractId, methodNames, successUrl, failureUrl }: any) {
      if (network === "testnet") throw "MyNearWallet not supported on testnet";

      console.log("signIn", contractId, methodNames, successUrl, failureUrl);
      const existingAccounts = await getAccounts();
      if (existingAccounts.length) return existingAccounts;

      const currentUrl = new URL(window.selector.location);
      console.log("currentUrl", currentUrl);
      const newUrl = new URL("https://app.mynearwallet.com/login/");

      newUrl.searchParams.set("success_url", successUrl || currentUrl.href);
      newUrl.searchParams.set("failure_url", failureUrl || currentUrl.href);

      if (contractId) {
        newUrl.searchParams.set("contract_id", contractId);
        const accessKey = nearAPI.utils.KeyPair.fromRandom("ed25519");
        newUrl.searchParams.set("public_key", accessKey.getPublicKey().toString());
        await _state.keyStore.setKey("mainnet", "pending_key:" + accessKey.getPublicKey(), accessKey);
      }

      if (methodNames) {
        methodNames.forEach((methodName: string) => {
          newUrl.searchParams.append("methodNames", methodName);
        });
      }

      window.selector.open(newUrl.toString());
    },

    async signOut(data: any) {
      if (data.network === "testnet") throw "MyNearWallet not supported on testnet";
      await _state.keyStore.clear();
    },

    async getAccounts(data: any) {
      if (data.network === "testnet") throw "MyNearWallet not supported on testnet";
      return getAccounts();
    },

    async verifyOwner() {
      throw new Error(`Method not supported by MyNearWallet`);
    },

    async signMessage({ network, message, nonce, recipient, callbackUrl, state }: any) {
      if (network === "testnet") throw "MyNearWallet not supported on testnet";

      const url = callbackUrl || window.selector.location;
      if (!url) throw new Error(`The callbackUrl is missing for MyNearWallet`);

      const href = new URL("https://app.mynearwallet.com");
      href.pathname = "sign-message";
      href.searchParams.append("message", message);
      href.searchParams.append("nonce", btoa(String.fromCharCode(...nonce)));
      href.searchParams.append("recipient", recipient);
      href.searchParams.append("callbackUrl", url);
      if (state) href.searchParams.append("state", state);

      window.selector.open(href.toString());
      return;
    },

    async signAndSendTransaction({ network, signerId, receiverId, actions, callbackUrl }: any) {
      if (network === "testnet") throw "MyNearWallet not supported on testnet";

      const url = callbackUrl || window.selector.location;
      if (!url) throw new Error(`The callbackUrl is missing for MyNearWallet`);
      await this.signAndSendTransactions({ transactions: [{ signerId, receiverId, actions }], callbackUrl: url });
    },

    async signAndSendTransactions({ network, transactions, callbackUrl }: any) {
      if (network === "testnet") throw "MyNearWallet not supported on testnet";

      const url = callbackUrl || window.selector.location;
      if (!url) throw new Error(`The callbackUrl is missing for MyNearWallet`);

      const newUrl = new URL("sign", "https://app.mynearwallet.com");
      const list = await transformTransactions(transactions);

      newUrl.searchParams.set("callbackUrl", url);
      newUrl.searchParams.set(
        "transactions",
        list
          .map((tx) => borsh.serialize(nearAPI.transactions.SCHEMA.Transaction, tx))
          .map((serialized) => Buffer.from(serialized).toString("base64"))
          .join(",")
      );

      window.selector.open(newUrl.toString());
    },
  };
};

MyNearWallet().then((wallet) => {
  window.selector.ready(wallet);
});
