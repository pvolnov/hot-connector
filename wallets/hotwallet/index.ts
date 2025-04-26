import { baseEncode } from "@near-js/utils";
import { QRCode } from "@here-wallet/core/qrcode-strategy";
import crypto from "crypto";

import { head } from "./view";
import { body } from "./view";
const root = document.createElement("div");
root.style.height = "100%";
document.body.appendChild(root);
document.head.innerHTML = head;
root.innerHTML = body;

export const proxyApi = "https://h4n.app";
const logoImage = new Image();
logoImage.src = "https://hot-labs.org/hot-widget/icon.svg";

export const uuid4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const wait = (timeout: number) => {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
};

export class RequestFailed extends Error {
  name = "RequestFailed";
  constructor(readonly payload: any) {
    super();
  }
}

class HOT {
  static shared = new HOT();

  async getResponse(id: string) {
    const res = await fetch(`${proxyApi}/${id}/response`, {
      headers: { "content-type": "application/json" },
      method: "GET",
    });

    if (res.ok === false) throw Error(await res.text());
    const { data } = await res.json();
    return JSON.parse(data);
  }

  async computeRequestId(request: object) {
    const query = baseEncode(JSON.stringify({ ...request, _id: uuid4() }));
    const hashsum = crypto.createHash("sha1").update(query).digest("hex");
    const id = Buffer.from(hashsum, "hex").toString("base64");
    const requestId = id.replaceAll("/", "_").replaceAll("-", "+").slice(0, 13);
    return { requestId, query };
  }

  async createRequest(request: object, signal?: AbortSignal) {
    const { query, requestId } = await this.computeRequestId(request);
    const res = await fetch(`${proxyApi}/${requestId}/request`, {
      body: JSON.stringify({ data: query }),
      headers: { "content-type": "application/json" },
      method: "POST",
      signal,
    });

    if (res.ok === false) throw Error(await res.text());
    return requestId;
  }

  async request(method: string, request: any): Promise<any> {
    const id = uuid4();
    const qr = document.querySelector(".qr-code");
    if (qr) qr.innerHTML = "";

    const requestId = await this.createRequest({
      origin: window.selector.location,
      inside: true,
      $hot: true,
      method,
      request,
      id,
    });

    const link = `hotconnect-${baseEncode(requestId)}`;
    const qrcode = new QRCode({
      value: `https://t.me/hot_wallet/app?startapp=${link}`,
      logo: logoImage,
      size: 140,
      radius: 0.8,
      ecLevel: "H",

      fill: {
        type: "linear-gradient",
        position: [0, 0, 1, 1],
        colorStops: [
          [0, "#fff"],
          [0.34, "#fff"],
          [1, "#fff"],
        ],
      },

      withLogo: true,
      imageEcCover: 0.3,
      quiet: 1,
    });

    qrcode.render();
    qr?.appendChild(qrcode.canvas);

    // @ts-ignore
    window.openWallet = () => window.selector.open(`https://t.me/hot_wallet/app?startapp=${link}`, true); // @ts-ignore
    window.openMobile = () => window.selector.open(`hotwallet://${link}`, true);

    const poolResponse = async () => {
      await wait(3000);
      const data: any = await this.getResponse(requestId).catch(() => null);
      if (data == null) return await poolResponse();
      if (data.success) return data.payload;
      throw new RequestFailed(data.payload);
    };

    const result = await poolResponse();
    return result;
  }
}

class NearWallet {
  getAccounts = async () => {
    const hotAccount = await window.selector.storage.get("hot-account");
    if (hotAccount) return [JSON.parse(hotAccount)];
    return [];
  };

  signIn = async () => {
    const result = await HOT.shared.request("near:signIn", {});
    window.selector.storage.set("hot-account", JSON.stringify(result));
    return [result];
  };

  signOut = async () => {
    await window.selector.storage.remove("hot-account");
  };

  signMessage = async (payload: any) => {
    const res = await HOT.shared.request("near:signMessage", payload);
    return res;
  };

  signAndSendTransaction = async (payload: any) => {
    return await HOT.shared.request("near:signAndSendTransactions", {
      transactions: [payload],
    });
  };

  signAndSendTransactions = async (payload: any) => {
    return await HOT.shared.request("near:signAndSendTransactions", payload);
  };
}

window.selector.ready(new NearWallet());
