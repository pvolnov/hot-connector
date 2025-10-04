import { WalletType } from "@hot-labs/near-connect";

export enum OmniToken {
  USDT = "nep141:wrap.near",
  USDC = "nep141:usdc.near",
}

export const OmniTokenMetadata: Record<OmniToken, { decimals: number; symbol: string; contractId: string }> = {
  [OmniToken.USDT]: { decimals: 6, symbol: "USDT", contractId: "wrap.near" },
  [OmniToken.USDC]: { decimals: 6, symbol: "USDC", contractId: "usdc.near" },
};

export interface AuthCommitment {
  tradingAddress: string;
  signed: Record<string, any>;
  address: string;
  publicKey: string;
  chainId: WalletType;
  seed: string;
}

export interface TrasferIntent {
  intent: "transfer";
  tokens: Record<string, string>;
  receiver_id: string;
}

export interface TokenBalance {
  id: string;
  int: bigint;
  float: number;
  decimals: number;
  symbol: string;
}
