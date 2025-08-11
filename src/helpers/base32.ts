const base32_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const create_base32_map = () => {
  const base32M = Array(256).fill(-1);
  for (let i = 0; i < base32_chars.length; ++i) base32M[base32_chars.charCodeAt(i)] = i;
  return base32M;
};

const base32Map = create_base32_map();

const base32 = {
  decode(base32String: string) {
    if (!base32String || typeof base32String !== "string") {
      throw new Error(`Expected base32 string but got "${base32String}"`);
    }

    // Remove padding and convert to uppercase
    base32String = base32String.replace(/=+$/, "").toUpperCase();

    let bits = 0;
    let value = 0;
    let index = 0;
    const result = new Uint8Array(Math.ceil((base32String.length * 5) / 8));

    for (let i = 0; i < base32String.length; i++) {
      const char = base32String[i];
      const charValue = base32Map[char.charCodeAt(0)];

      if (charValue === -1) {
        throw new Error(`Invalid base32 character "${char}"`);
      }

      value = (value << 5) | charValue;
      bits += 5;

      if (bits >= 8) {
        result[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }

    return result.slice(0, index);
  },

  encode(buffer: Uint8Array) {
    let result = "";
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        const index = (value >>> (bits - 5)) & 31;
        result += base32_chars[index];
        bits -= 5;
      }
    }

    if (bits > 0) {
      const index = (value << (5 - bits)) & 31;
      result += base32_chars[index];
    }

    // Add padding
    while (result.length % 8 !== 0) {
      result += "=";
    }

    return result;
  },
};

export default base32;
