export const hex = {
  encode(buffer: Uint8Array) {
    return [...buffer].map((x) => x.toString(16).padStart(2, "0")).join("");
  },

  decode(hex: string) {
    const hexString = hex.replace(/^0x/, "");
    const pairs = hexString.match(/[\dA-F]{2}/gi);
    const integers = pairs?.map((s) => parseInt(s, 16)) || [];
    return new Uint8Array(integers);
  },
};

export default hex;
