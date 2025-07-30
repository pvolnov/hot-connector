import { FC, useEffect, useState } from "react";
import { WalletSelector, WalletSelectorUI, NearWallet } from "../../src";

import "../../modal-ui.sass";
import "./index.css";

import manifest from "../public/repository/manifest.json";
import { NetworkSelector } from "./form-component/NetworkSelector.tsx";
import { Account } from "../../src/types/wallet.ts";
import { WalletActions } from "./WalletActions.tsx";

const defaultNetwork = "testnet";

const createSelectorAndModal = (network: "testnet" | "mainnet") => {
  const selector = new WalletSelector({manifest: manifest as any, network, logger: console});

  return ({
    selector,
    modal: new WalletSelectorUI(selector),
  });
};

export const ExampleNEAR: FC = () => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">(defaultNetwork);

  const [{selector, modal}, setSelectorAndModal] = useState<{
    selector: WalletSelector,
    modal: WalletSelectorUI
  }>(() => createSelectorAndModal(defaultNetwork));

  const [wallet, setWallet] = useState<NearWallet | undefined>();
  const [account, _setAccount] = useState<{ id: string; network: "testnet" | "mainnet" }>();

  function setAccount(_account: Account | undefined) {
    _setAccount(_account != null ? {
      id: _account.accountId,
      network: _account.accountId.endsWith("testnet") ? "testnet" : "mainnet",
    } : undefined);
  }

  useEffect(() => {
    selector.on("wallet:signIn", async (t) => {
      setWallet(await selector.wallet());
      setAccount(t.accounts[0]);
    });

    selector.on("wallet:signOut", async () => {
      setWallet(undefined);
      setAccount(undefined);
    });

    selector.wallet().then((wallet) => {
      wallet.getAccounts().then((t) => {
        setAccount(t[0]);
        setWallet(wallet);
      });
    });
  }, [network, selector]);

  const networkAccount = account != null && account.network === network ? account : undefined;

  const connect = async () => {
    if (networkAccount != null) return selector.disconnect();
    await modal.open();
  };

  return (
    <div className="view">
      <p>NEAR Example</p>
      <NetworkSelector network={network} onSelectNetwork={(network) => {
        setNetwork(network);
        setSelectorAndModal(createSelectorAndModal(network));
      }}/>
      <button className={"input-button"}
              onClick={() => connect()}>{networkAccount != null ? `${networkAccount.id} (logout)` : "Connect"}</button>
      {networkAccount != null && <>
        <WalletActions wallet={wallet!} network={network}/>
      </>}
    </div>
  );
};

/*
const SignMessage = ({ wallet }: { wallet: NearWallet }) => {
  const singMessage = async () => {
    const nonce = Buffer.from(window.crypto.getRandomValues(new Uint8Array(32)));
    const result = await wallet.signMessage?.({ message: "Hello", recipient: "Demo app", nonce });
    console.log(`Is verfiied: ${result?.signature}`);
  };

  const sendTx = async () => {
    const result = await wallet.signAndSendTransaction({
      receiverId: "demo.near",
      actions: [{ type: "Transfer", params: { deposit: "0" } }],
    });

    console.log({ result });
  };

  return (
    <>
      <SignMessage/>
      <button onClick={() => sendTx()}>Send tx</button>
    </>
  );
};
*/
