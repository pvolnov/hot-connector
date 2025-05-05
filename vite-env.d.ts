/// <reference types="vite/client" />

interface Window {
  selector: {
    network: "testnet" | "mainnet";
    location: string;
    ready: (wallet: any) => void;
    open: (url: string, newTab?: boolean) => void;
    showContent: () => void;
    storage: {
      set: (key: string, value: string) => Promise<void>;
      get: (key: string) => Promise<string>;
      remove: (key: string) => Promise<void>;
      keys: () => Promise<string[]>;
    };
  };
}

declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
