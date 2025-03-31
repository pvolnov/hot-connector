const wallet = {
  getAccounts: async () => {
    return [{ accountId: "hot-wallet" }];
  },

  signIn: async () => {
    return [{ accountId: "hot-wallet" }];
  },

  signOut: async () => {
    return [];
  },

  signMessage: async () => {
    return {
      signature: "signature",
      publicKey: "publicKey",
    };
  },

  signAndSendTransaction: async () => {
    return {
      transaction: "transaction",
    };
  },

  signAndSendTransactions: async () => {
    return [
      {
        transaction: "transaction",
      },
    ];
  },
};

window.selector.ready(wallet);
