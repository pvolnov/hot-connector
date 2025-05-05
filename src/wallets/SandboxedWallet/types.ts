import { EventMap } from "../../types/wallet-events";

export type MiddlewareContext = {
  method: keyof EventMap;
  params: any;
  origin: string;
};

export type Middleware = (ctx: MiddlewareContext, next: () => Promise<any>) => Promise<any>;
