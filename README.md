# NEAR Connect

An easily upgradeable, secure and lightweight wallet connector for the NEAR blockchain

## How it works

Unlike near-wallet-selector, this library provides a secure execution environment for integrating wallets. This eliminates the need for a single registry of code for all wallets.

## Wallet integration

The developer writes a self-hosted script that implements the integration of their wallet and adds a description to the manifest:

```json
{
  "id": "hot-wallet",
  "version": "1.0.0",
  "name": "Hot Wallet",
  "platform": ["android", "ios", "web"],
  "icon": "https://app.hot-labs.org/images/hot/hot-icon.png",
  "description": "Hot Wallet is a wallet that allows you to send and receive NEAR.",
  "executor": "https://hot-labs.org/hot-wallet.js",
  "website": "https://hot-labs.org/wallet",
  "type": "sandbox"
}
```

The script `https://hot-labs.org/hot-wallet.js` called in a standalone iframe if the user decides to use this wallet on the site. The script implements the NearWallet wallet class and registers it in a special object
`window.selector.ready(yourNearWallet)`

After that, the library delegates user requests directly to `yourNearWallet` via `iframe.postMessage` communication.
In addition, the script has the ability to draw any UI in the area allocated for the iframe that is necessary for interaction with the wallet.

## Sandbox limitations

For security, the wallet script runs in a sandboxed iframe, which has many limitations. It cannot call modals or access an external page or use localStorage.
The `window.selector` implements some features for this:

```ts
interface NearSelector {
  ready: (wallet: any) => void;
  redirect: (url: string) => void;
  storage: {
    set: (key: string, value: string) => Promise<void>;
    get: (key: string) => Promise<string>;
    remove: (key: string) => Promise<void>;
    keys: () => Promise<string[]>;
  };
}
```

## Injected wallets

Like Ethereum Multi Injected Provider stander (https://eips.ethereum.org/EIPS/eip-6963) this library supports injected wallets for extenstions and mobile browsers. Your injection script can dispatch custom event

## Milestones

- Support all near-wallet-selector wallets
- Custom manifests for debugging mode
- Full backward compatibility with near-wallet-selector
