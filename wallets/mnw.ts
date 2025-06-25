import * as nearAPI from "near-api-js";
import { PublicKey } from "@near-js/crypto";
import type { Transaction, Optional, Account, FinalExecutionOutcome } from "@near-wallet-selector/core";
import { createAction } from "@near-wallet-selector/wallet-utils";
import { Action } from "near-api-js/lib/transaction";
import * as borsh from "borsh";

import { SelectorStorageKeyStore } from "./keystore";

const keyStore = new SelectorStorageKeyStore();

const _completeSignInWithAccessKey = async () => {
  const currentUrl = new URL(window.selector.location);
  const publicKey = currentUrl.searchParams.get("public_key") || "";
  const allKeys = (currentUrl.searchParams.get("all_keys") || "").split(",");
  const accountId = currentUrl.searchParams.get("account_id") || "";
  if (!accountId) return;

  const authData = { accountId, allKeys };
  await window.selector.storage.set("authData", JSON.stringify(authData));

  if (publicKey) {
    const keyPair = await keyStore.getKey("mainnet", "pending_key:" + publicKey);
    await keyStore.setKey("mainnet", accountId, keyPair);
    await keyStore.removeKey("mainnet", "pending_key:" + publicKey);
  }
};

const _completeSignMessage = async () => {
  const hash = new URL(window.selector.location).hash;
  const search = new URLSearchParams(hash.slice(1));
  const signature = search.get("signature") || "";
  const accountId = search.get("accountId") || "";
  if (!signature || !accountId) return;

  await window.selector.storage.set("pendingSignMessage", JSON.stringify({ signature, accountId }));
};

const _completeSignAndSendTransaction = async () => {
  const search = new URL(window.selector.location).searchParams;
  const transactionHashes = search.get("transactionHashes") || "";
  if (!transactionHashes) return;
  await window.selector.storage.set(
    "pendingSignAndSendTransaction",
    JSON.stringify({ transactionHashes: transactionHashes.split(",") })
  );
};

const setupWalletState = async () => {
  const authData = await window.selector.storage.get("authData");
  const parsedAuthData = authData ? JSON.parse(authData) : null;

  if (typeof parsedAuthData?.accountId !== "string") {
    throw new Error("authData not found");
  }

  const near = await nearAPI.connect({
    walletUrl: "https://app.mynearwallet.com",
    nodeUrl: "https://rpc.mainnet.near.org",
    networkId: "mainnet",
    headers: {},
    keyStore,
  });

  const account = await near.account(parsedAuthData.accountId);
  return { near, account, keyStore, authData: parsedAuthData };
};

const MyNearWallet = async () => {
  await _completeSignInWithAccessKey().catch(() => null);
  await _completeSignMessage().catch(() => null);
  await _completeSignAndSendTransaction().catch(() => null);
  let wallet = await setupWalletState().catch(() => null);

  const getAccounts = async (): Promise<Array<Account>> => {
    if (!wallet?.account) return [];
    const publicKey = await wallet.account.connection.signer.getPublicKey(wallet.account.accountId, "mainnet");
    return [{ accountId: wallet.account.accountId, publicKey: publicKey ? publicKey.toString() : "" }];
  };

  const transformTransactions = async (transactions: Array<Optional<Transaction, "signerId">>) => {
    if (!wallet?.account) return [];
    const account = wallet.account;
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

      const walletKeys = wallet?.authData?.allKeys || [];
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

      const existingAccounts = await getAccounts();
      if (existingAccounts.length) return existingAccounts;

      const currentUrl = new URL(window.selector.location);
      const newUrl = new URL("https://app.mynearwallet.com/login/");

      newUrl.searchParams.set("success_url", successUrl || currentUrl.href);
      newUrl.searchParams.set("failure_url", failureUrl || currentUrl.href);

      if (contractId) {
        newUrl.searchParams.set("contract_id", contractId);
        const accessKey = nearAPI.utils.KeyPair.fromRandom("ed25519");
        newUrl.searchParams.set("public_key", accessKey.getPublicKey().toString());
        await keyStore.setKey("mainnet", "pending_key:" + accessKey.getPublicKey(), accessKey);
      }

      if (methodNames) {
        methodNames.forEach((methodName: string) => {
          newUrl.searchParams.append("methodNames", methodName);
        });
      }

      await window.selector.ui.whenApprove({ title: "Sign in", button: "Open wallet" });
      const panel = window.selector.open(newUrl.toString(), "_blank");
      return new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
          wallet = await setupWalletState().catch(() => null);

          if (wallet) {
            resolve([{ accountId: wallet.account.accountId }]);
            clearInterval(timer);
            panel.close();
            return;
          }

          if (panel.closed) {
            clearInterval(timer);
            reject(new Error("signIn rejected"));
          }
        }, 500);
      });
    },

    async signOut(data: any) {
      if (data.network === "testnet") throw "MyNearWallet not supported on testnet";
      await window.selector.storage.remove("authData");
      await keyStore.clear();
    },

    async getAccounts(data: any) {
      if (data.network === "testnet") throw "MyNearWallet not supported on testnet";
      return getAccounts();
    },

    async verifyOwner() {
      throw new Error(`Method not supported by MyNearWallet`);
    },

    async signMessage({ network, message, nonce, recipient }: any) {
      if (network === "testnet") throw "MyNearWallet not supported on testnet";

      const href = new URL("https://app.mynearwallet.com");
      href.pathname = "sign-message";
      href.searchParams.append("message", message);
      href.searchParams.append("nonce", btoa(String.fromCharCode(...nonce)));
      href.searchParams.append("recipient", recipient);
      href.searchParams.append("callbackUrl", window.selector.location);

      await window.selector.ui.whenApprove({ title: "Sign message", button: "Open wallet" });
      const panel = window.selector.open(href.toString(), "_blank");

      return new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
          if (panel.closed || wallet == null) {
            clearInterval(timer);
            reject(new Error("signIn rejected"));
          }

          try {
            const pendingSignMessageJson = await window.selector.storage.get("pendingSignMessage");
            const pendingSignMessage = pendingSignMessageJson ? JSON.parse(pendingSignMessageJson) : null;
            if (!pendingSignMessage) return;

            await window.selector.storage.remove("pendingSignMessage");
            if (pendingSignMessage.accountId !== wallet?.account?.accountId) throw "accountId mismatch";
            if (wallet == null) throw "wallet not found";

            resolve({
              signature: pendingSignMessage.signature,
              accountId: wallet.account.accountId,
              publicKey: wallet.authData.allKeys[0], // WTF?
            });

            clearInterval(timer);
            panel.close();
          } catch {
            clearInterval(timer);
            reject(new Error("signMessage failed"));
            panel.close();
          }
        }, 500);
      });
    },

    async signAndSendTransaction({ network, signerId, receiverId, actions }: any): Promise<FinalExecutionOutcome> {
      if (network === "testnet") throw "MyNearWallet not supported on testnet";
      await window.selector.ui.whenApprove({ title: "Send transaction", button: "Open wallet" });
      const list = await this.signAndSendTransactions({
        transactions: [{ signerId, receiverId, actions }],
        callbackUrl: window.selector.location,
      });

      return list[0];
    },

    async signAndSendTransactions({ network, transactions }: any): Promise<FinalExecutionOutcome[]> {
      if (network === "testnet") throw "MyNearWallet not supported on testnet";

      const newUrl = new URL("sign", "https://app.mynearwallet.com");
      const list = await transformTransactions(transactions);

      newUrl.searchParams.set("callbackUrl", window.selector.location);
      newUrl.searchParams.set(
        "transactions",
        list
          .map((tx) => borsh.serialize(nearAPI.transactions.SCHEMA.Transaction, tx))
          .map((serialized) => Buffer.from(serialized).toString("base64"))
          .join(",")
      );

      await window.selector.ui.whenApprove({ title: "Send transactions", button: "Open wallet" });
      const panel = window.selector.open(newUrl.toString(), "_blank");

      return new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
          if (panel.closed || wallet == null) {
            reject(new Error("signIn rejected"));
            clearInterval(timer);
            return;
          }

          try {
            const json = await window.selector.storage.get("pendingSignAndSendTransaction");
            if (!json) return;

            const { transactionHashes } = JSON.parse(json);
            if (!transactionHashes) return;

            await window.selector.storage.remove("pendingSignAndSendTransaction");
            if (wallet == null) throw "wallet not found";
            panel.close();

            const txs: FinalExecutionOutcome[] = [];
            for (const transactionHash of transactionHashes) {
              const rpc = wallet.near.connection.provider;
              const tx = await rpc.txStatus(transactionHash, wallet.account.accountId, "EXECUTED_OPTIMISTIC");
              txs.push(tx);
            }

            resolve(txs);
            clearInterval(timer);
          } catch (e) {
            clearInterval(timer);
            reject(new Error("signAndSendTransaction failed"));
            panel.close();
          }
        }, 500);
      });
    },
  };
};

MyNearWallet().then((wallet) => {
  window.selector.ready(wallet);
});
