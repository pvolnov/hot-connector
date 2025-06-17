/// <reference types="vite/client" />

interface Window {
  selector: {
    network: "testnet" | "mainnet";
    location: string;
    ready: (wallet: any) => void;

    parentFrame?: {
      postMessage: (data: any) => Promise<void>;
    };

    open: (
      url: string,
      newTab?: boolean | string,
      options?: string
    ) => {
      close: () => void;
      postMessage: (message: any) => void;
      closed: boolean;
    };

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
