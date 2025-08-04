import { WalletType } from "../types/multichain";

export interface ChainAbstracted {
  get type(): WalletType;

  getAddress(): Promise<string>;
  getPublicKey(): Promise<string>;
  getIntentsAddress(): Promise<string>;

  signIntentsWithAuth(domain: string, intents?: Record<string, any>[]): Promise<Record<string, any>>;
  signIntents(intents: Record<string, any>[]): Promise<Record<string, any>>;
}
