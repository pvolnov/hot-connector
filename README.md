# NEAR Connect

![image.png](./media/image.png)

Zero-dependenices (only preact for UI), robust, secure and lightweight wallet connector for the NEAR blockchain with **easily updatable** wallets code

`yarn add @hot-labs/near-selector`

## How it works

Unlike near-wallet-selector, this library provides a secure execution environment for integrating wallets. This eliminates the need for a single registry of code for all wallets.

## Wallet integration

The developer writes a self-hosted script that implements the integration of their wallet and adds a description to the common [manifest](./repository/manifest.ts):

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

The `executor` endpoint called in a standalone iframe if the user decides to use this wallet on the site. The script implements the [NearWallet](./src/types/wallet.ts) wallet class and registers it in a special object
`window.selector.ready(yourNearWallet)`

After that, the library delegates user requests directly to `yourNearWallet` via `iframe.postMessage` communication.
In addition, the script has the ability to draw any UI in the area allocated for the iframe that is necessary for interaction with the wallet.

## Sandbox limitations

For security, the wallet script runs in a sandboxed iframe, which has many limitations. It cannot call modals or access an external page or use localStorage.
The `window.selector` implements some features for this:

```ts
interface NearSelector {
  location: string; // initial dapp location href
  ready: (wallet: any) => void; // must call executor script for register wallet
  open: (url: string, newTab = false) => void; // used for my-near-wallet

  // use instead of localStorage
  storage: {
    set: (key: string, value: string) => Promise<void>;
    get: (key: string) => Promise<string>;
    remove: (key: string) => Promise<void>;
    keys: () => Promise<string[]>;
  };
}
```

## Manifest permissions

- `{ "storage": true  }`: Use window.selector.storage in execution script
- `{ "open": { allows: ["https://wallet.app"] } }` Use window.selector.open for `allow` domains
- `{ "location": true }`: Use window.selector.location for initial url from dapp
- `{ "usb": true }`: Use usb in execution script (use for Ledger)
- `{ "hid": true }`: Use hid in execution script (use for Ledger)

## Injected wallets

Like [Ethereum Multi Injected Provider Standart](https://eips.ethereum.org/EIPS/eip-6963) this library supports injected wallets for extenstions and in-app browsers. Your injection script can dispatch custom event with your wallet:

```js
window.dispatchEvent(new CustomEvent("near-wallet-injected", { detail: wallet }));
```

## Background

Maintaining the current near-wallet-selector takes a lot of time and effort, wallet developers wait a long time to get an update to their connector inside a monolithic code base. After which they can wait months for applications to integrate their wallet into their site or update their frontend to update the wallet connector. This requires a lot of work on the review side of the near-wallet-selector team and STILL does not ensure the security of internal packages that will be installed in applications (for example, RHEA Finance or Near Intents).
All these problems prompted us to write a new solution that will:

1. safely and isolatedly execute the code for connecting to wallets
2. quickly and conveniently update wallets on all sites
3. Save the internal near-wallet-selector team from endlessly maintaining a huge code base, because now only the wallet itself is responsible for the connection of each wallet and hosts its script wherever it wants.

## Milestones

- Support all near-wallet-selector wallets
- Custom manifests for debugging mode
- Full backward compatibility with near-wallet-selector
