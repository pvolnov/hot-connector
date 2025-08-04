import { NearWallet } from "../../../src";

export interface IPropsWalletAction {
  network: "testnet" | "mainnet";
  wallet: NearWallet;
}
