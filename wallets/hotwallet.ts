import { HOT } from "@hot-wallet/sdk";

const style = document.createElement("style");
style.textContent = `
  iframe {
    border: none !important;
    border-radius: 0px !important;
    width: 100vw !important;
    height: 100vh !important;
  }

  div {
    padding: 0 !important;
  }
`;

document.head.appendChild(style);

const wallet = {
  getAccounts: async () => {
    const hotAccount = await window.selector.storage.get("hot-account");
    if (hotAccount) return [JSON.parse(hotAccount)];
    return [];
  },

  signIn: async () => {
    const result = await HOT.request("near:signIn", {});
    window.selector.storage.set("hot-account", JSON.stringify(result));
    return [result];
  },

  signOut: async () => {},

  signMessage: async (payload: any) => {
    const res = await HOT.request("near:signMessage", payload);
    return res;
  },

  signAndSendTransaction: async (payload: any) => {
    return await HOT.request("near:signAndSendTransactions", payload);
  },

  signAndSendTransactions: async (payload: any) => {
    return await HOT.request("near:signAndSendTransactions", payload);
  },
};

window.selector.ready(wallet);
