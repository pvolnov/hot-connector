import type { Optional, Transaction, Account } from "@near-wallet-selector/core";
import { signTransactions } from "@near-wallet-selector/wallet-utils";
import type { FinalExecutionOutcome } from "near-api-js/lib/providers/index.js";
import type { Signer } from "near-api-js";
import * as nearAPI from "near-api-js";

const provider = new nearAPI.providers.JsonRpcProvider({
  url: "https://rpc.mainnet.near.org",
});

const Nightly = async () => {
  await window.selector.external("nightly.near", "connect");

  const getAccounts = async (): Promise<Array<Account>> => {
    const { accountId, publicKey } = await window.selector.external("nightly.near", "account");
    if (!accountId) return [];
    return [{ accountId, publicKey: publicKey.toString() }];
  };

  const transformTransactions = async (
    transactions: Array<Optional<Transaction, "signerId" | "receiverId">>
  ): Promise<Array<Transaction>> => {
    const accounts = await getAccounts();
    if (!accounts.length) {
      throw new Error("Wallet not signed in");
    }

    return transactions.map((transaction) => {
      return {
        signerId: transaction.signerId || accounts[0].accountId,
        receiverId: transaction.receiverId || "",
        actions: transaction.actions,
      };
    });
  };

  const signer: Signer = {
    createKey: () => {
      throw new Error("Not implemented");
    },

    getPublicKey: async (accountId) => {
      const accounts = await getAccounts();
      const account = accounts.find((a) => a.accountId === accountId);

      if (!account) {
        throw new Error("Failed to find public key for account");
      }

      return nearAPI.utils.PublicKey.from(account.publicKey!);
    },

    signMessage: async (message, accountId) => {
      const accounts = await getAccounts();
      const account = accounts.find((a) => a.accountId === accountId);

      if (!account) {
        throw new Error("Failed to find account for signing");
      }

      try {
        const tx = nearAPI.transactions.Transaction.decode(Buffer.from(message));
        const signedTx = await window.selector.external("nightly.near", "signTransaction", tx);
        return { signature: signedTx.signature.data, publicKey: tx.publicKey };
      } catch (err) {
        console.log("Failed to sign message");
        console.error(err);
        throw Error("Invalid message. Only transactions can be signed");
      }
    },
  };

  return {
    async signIn() {
      const existingAccounts = await getAccounts();
      if (existingAccounts.length) return existingAccounts;
      await window.selector.external("nightly.near", "connect");
      return getAccounts();
    },

    async signOut() {
      await window.selector.external("nightly.near", "disconnect");
    },

    async getAccounts() {
      return await getAccounts();
    },

    async verifyOwner({ message }: any) {
      throw new Error(`Method not supported`);
    },

    async signMessage({ message, nonce, recipient, state }: any) {
      console.log("Nightly:signMessage", { message, nonce, recipient, state });
      const isConnected = await window.selector.external("nightly.near", "isConnected");
      if (!isConnected) await window.selector.external("nightly.near", "connect");

      return await window.selector.external("nightly.near", "signMessage", {
        message,
        nonce,
        recipient,
        state,
      });
    },

    async signAndSendTransaction({ signerId, receiverId, actions, network }: any) {
      console.log("signAndSendTransaction", { signerId, receiverId, actions });
      const accounts = await getAccounts();

      if (!accounts.length) {
        throw new Error("Wallet not signed in");
      }

      const [signedTx] = await signTransactions(
        await transformTransactions([{ signerId, receiverId, actions }]),
        signer,
        network
      );

      return provider.sendTransaction(signedTx);
    },

    async signAndSendTransactions({ transactions, network }: any) {
      console.log("signAndSendTransactions", { transactions });
      const signedTxs = await signTransactions(await transformTransactions(transactions), signer, network);
      const results: Array<FinalExecutionOutcome> = [];

      for (let i = 0; i < signedTxs.length; i++) {
        results.push(await provider.sendTransaction(signedTxs[i]));
      }

      return results;
    },

    async createSignedTransaction({ receiverId, actions, network }: any) {
      console.log("createSignedTransaction", { receiverId, actions });
      const [signedTx] = await signTransactions(
        await transformTransactions([{ receiverId, actions }]),
        signer,
        network
      );
      return signedTx;
    },

    async signTransaction({ transaction, network }: any) {
      console.log("signTransaction", { transaction });
      return await nearAPI.transactions.signTransaction(transaction, signer, transaction.signerId, network);
    },

    async getPublicKey() {
      console.log("getPublicKey", {});
      throw new Error(`Method not supported`);
    },

    async signNep413Message() {
      throw new Error(`Method not supported`);
    },

    async signDelegateAction(delegateAction: any) {
      throw new Error(`Method not supported`);
    },
  };
};

Nightly().then((wallet) => {
  window.selector.ready(wallet);
});
