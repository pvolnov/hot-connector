export interface EventMap {
  "wallet:signIn": any;
  "wallet:signOut": any;
  "wallet:signMessage": any;
  "wallet:signAndSendTransaction": any;
  "wallet:signAndSendTransactions": any;
  "wallet:getAccounts": any;
  "wallet:verifyOwner": any;
}

export type EventType = keyof EventMap;

export type EventCallback<K extends EventType> = (payload: EventMap[K]) => void;
