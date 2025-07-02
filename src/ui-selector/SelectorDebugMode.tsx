import { useState } from "preact/hooks";
import { WalletSelector } from "../selector";

const SelectorDebugMode = ({ selector }: { selector: WalletSelector }) => {
  const [debugManifest, setDebugManifest] = useState(
    JSON.stringify(
      {
        id: "yet-another-wallet",
        name: "Yet Another Wallet",
        icon: "https://yet-another-wallet.app/logo.svg",
        description: "Yet another wallet for NEAR Protocol",
        website: "https://yet-another-wallet.app/",
        version: "1.0.0",
        executor: "https://yet-another-wallet.app/script.js",
        type: "sandbox",

        features: {
          signMessage: true,
          signTransaction: false,
          signAndSendTransaction: true,
          signAndSendTransactions: true,
          signInWithoutAddKey: true,
          verifyOwner: false,
          testnet: true,
        },

        platform: { web: "", chrome: "" },
        permissions: {
          storage: true,
          open: { allows: ["https://yet-another-wallet.app"] },
        },
      },
      null,
      2
    )
  );

  return (
    <div style={{ padding: "32px" }} class="wallet-intro">
      <h2>Add debug wallet</h2>

      <textarea
        style={{
          width: "100%",
          height: "400px",
          padding: "12px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "12px",
          lineHeight: "1.4",
          resize: "vertical",
        }}
        value={debugManifest}
        onChange={(e) => setDebugManifest(e.currentTarget.value)}
      />

      <button
        onClick={() => {
          try {
            const manifest = JSON.parse(debugManifest);
            selector.registerDebugWallet(manifest);
          } catch (error) {
            console.error(error);
            alert("Invalid manifest");
          }
        }}
      >
        Add to manifest
      </button>
    </div>
  );
};

export default SelectorDebugMode;
