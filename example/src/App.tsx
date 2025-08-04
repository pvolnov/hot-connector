import { FC, useEffect, useState } from "react";

import { HotConnector, NearWallet } from "../../src";
import { Account } from "../../src/types/wallet.ts";
import { WalletType } from "../../src/types/multichain.ts";

import { WalletActions } from "./WalletActions.tsx";
import { NetworkSelector } from "./form-component/NetworkSelector.tsx";
import { nearConnector, tonConnectUI } from "./selectors.ts";
import { appKitModal } from "./selectors.ts";
import "./index.css";

export const ExampleNEAR: FC = () => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("mainnet");
  const [account, _setAccount] = useState<{ id: string; network: "testnet" | "mainnet" }>();
  const [wallet, setWallet] = useState<NearWallet | undefined>();

  function setAccount(account: Account | undefined) {
    if (account == null) return _setAccount(undefined);
    _setAccount({ id: account.accountId, network: account.accountId.endsWith("testnet") ? "testnet" : "mainnet" });
  }

  useEffect(() => {
    nearConnector.on("wallet:signIn", async (t) => {
      setWallet(await nearConnector.wallet());
      setAccount(t.accounts[0]);
    });

    nearConnector.on("wallet:signOut", async () => {
      setWallet(undefined);
      setAccount(undefined);
    });

    nearConnector.wallet().then((wallet) => {
      wallet.getAccounts().then((t) => {
        setAccount(t[0]);
        setWallet(wallet);
      });
    });
  }, [network, nearConnector]);

  const networkAccount = account != null && account.network === network ? account : undefined;
  const connect = async () => {
    if (networkAccount != null) return nearConnector.disconnect();
    await nearConnector.connect();
  };

  return (
    <div className="view">
      <p>NEAR Example</p>
      <NetworkSelector
        network={network}
        onSelectNetwork={(network) => {
          setNetwork(network);
          nearConnector.switchNetwork(network);
        }}
      />
      <button className={"input-button"} onClick={() => connect()}>
        {networkAccount != null ? `${networkAccount.id} (logout)` : "Connect"}
      </button>

      {networkAccount != null && <WalletActions wallet={wallet!} network={network} />}
    </div>
  );
};

export const MultichainExample = () => {
  const [wallets, setWallets] = useState<Record<WalletType, string | null>>({
    [WalletType.NEAR]: null,
    [WalletType.EVM]: null,
    [WalletType.SOLANA]: null,
    [WalletType.TON]: null,
  });

  const [connector] = useState<HotConnector>(() => {
    return new HotConnector({
      onConnect: async (wallet) => {
        const address = await wallet.getAddress();
        setWallets((t) => ({ ...t, [wallet.type]: address }));
      },

      onDisconnect: (type) => {
        setWallets({ ...wallets, [type]: null });
      },

      chains: [WalletType.NEAR, WalletType.EVM, WalletType.SOLANA, WalletType.TON],
      nearConnector: nearConnector,
      tonConnect: tonConnectUI,
      appKit: appKitModal,
    });
  });

  return (
    <div className="view">
      <p>Multichain Example</p>

      <button className={"input-button"} onClick={() => connector.connect()}>
        Open connector
      </button>

      {Object.entries(wallets).map(
        ([type, address]) =>
          address != null && (
            <div key={type} style={{ width: 200 }}>
              <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{address}</p>
              <button className={"input-button"} onClick={() => connector.auth(type, "auth", [])}>
                Sign auth intents
              </button>
            </div>
          )
      )}
    </div>
  );
};
