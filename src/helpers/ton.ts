import hex from "./hex";
import base64 from "./base64";

const noBounceableTag = 0x51;
const testOnlyTag = 0x80;

/**
 * Converts raw TON address to no-bounceable user-friendly format. [See details]{@link https://ton.org/docs/learn/overviews/addresses#user-friendly-address}
 * @param hexAddress raw TON address formatted as "0:<hex string without 0x>".
 * @param [testOnly=false] convert address to test-only form. [See details]{@link https://ton.org/docs/learn/overviews/addresses#user-friendly-address}
 */
export const toUserFriendlyAddress = (hexAddress: string, testOnly = false) => {
  const { wc, hex } = parseHexAddress(hexAddress);
  let tag = noBounceableTag;
  if (testOnly) {
    tag |= testOnlyTag;
  }
  const addr = new Int8Array(34);
  addr[0] = tag;
  addr[1] = wc;
  addr.set(hex, 2);

  const addressWithChecksum = new Uint8Array(36);
  addressWithChecksum.set(addr);
  addressWithChecksum.set(crc16(new Uint8Array(addr)), 34);
  let addressBase64 = base64.encode(addressWithChecksum);
  return addressBase64.replace(/\+/g, "-").replace(/\//g, "_");
};

export const parseHexAddress = (hexAddress: string) => {
  if (!hexAddress.includes(":")) {
    throw `Wrong address ${hexAddress}. Address must include ":".`;
  }

  const parts = hexAddress.split(":");
  if (parts.length !== 2) {
    throw `Wrong address ${hexAddress}. Address must include ":" only once.`;
  }

  const wc = parseInt(parts[0]);
  if (wc !== 0 && wc !== -1) {
    throw `Wrong address ${hexAddress}. WC must be eq 0 or -1, but ${wc} received.`;
  }

  const hexStr = parts[1];
  if ((hexStr === null || hex === void 0 ? void 0 : hexStr.length) !== 64) {
    throw `Wrong address ${hexAddress}. Hex part must be 64bytes length, but ${
      hexStr === null || hex === void 0 ? void 0 : hexStr.length
    } received.`;
  }

  return { wc, hex: hex.decode(hexStr) };
};

export const crc16 = (data: Uint8Array) => {
  const poly = 0x1021;
  let reg = 0;
  const message = new Uint8Array(data.length + 2);
  message.set(data);
  for (let byte of message) {
    let mask = 0x80;
    while (mask > 0) {
      reg <<= 1;
      if (byte & mask) {
        reg += 1;
      }
      mask >>= 1;
      if (reg > 0xffff) {
        reg &= 0xffff;
        reg ^= poly;
      }
    }
  }
  return new Uint8Array([Math.floor(reg / 256), reg % 256]);
};
