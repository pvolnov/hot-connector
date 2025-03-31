/// <reference types="vite/client" />

interface Window {
  selector: {
    location: string;
    ready: (wallet: any) => void;
    redirect: (url: string) => void;
    storage: {
      set: (key: string, value: string) => Promise<void>;
      get: (key: string) => Promise<string>;
      remove: (key: string) => Promise<void>;
      keys: () => Promise<string[]>;
    };
  };
}
