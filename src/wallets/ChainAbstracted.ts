import SolanaAccount from "../wallets/SolanaWallet";
import { NearWallet } from "../wallets/near-wallets/NearWallet";
import EvmAccount from "../wallets/EvmWallet";
import TonAccount from "../wallets/TonWallet";

export interface ConnectedWallets {
  [WalletType.SOLANA]: SolanaAccount | null;
  [WalletType.NEAR]: NearWallet | null;
  [WalletType.EVM]: EvmAccount | null;
  [WalletType.TON]: TonAccount | null;
}

export enum WalletType {
  NEAR = 1010,
  EVM = 1,
  SOLANA = 1001,
  TON = 1111,
}

export interface SignedAuth {
  signed: Record<string, any>;
  address: string;
  publicKey: string;
  chainId: WalletType;
  seed: string;
}

export interface ChainAbstracted {
  get type(): WalletType;

  getAddress(): Promise<string>;
  getPublicKey(): Promise<string>;
  getIntentsAddress(): Promise<string>;

  signIntentsWithAuth(domain: string, intents?: Record<string, any>[]): Promise<SignedAuth>;
  signIntents(intents: Record<string, any>[]): Promise<Record<string, any>>;
}
