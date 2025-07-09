import { NearWallet } from "..";
import { Account } from "./wallet";

export interface EventMap {
  "wallet:signIn": { wallet: NearWallet; accounts: Account[]; success: boolean };
  "wallet:signOut": any;
  "selector:manifestUpdated": any;
  "selector:walletsChanged": any;
}

export type EventType = keyof EventMap;

export type EventCallback<K extends EventType> = (payload: EventMap[K]) => void;
