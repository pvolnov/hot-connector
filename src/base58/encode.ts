const base58_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const create_base58_map = () => {
  const base58M = Array(256).fill(-1);
  for (let i = 0; i < base58_chars.length; ++i) base58M[base58_chars.charCodeAt(i)] = i;
  return base58M;
};

const base58Map = create_base58_map();

/**
 * Converts a Uint8Array into a base58 string.
 * @param {Uint8Array} uint8array Unsigned integer array.
 * @returns { import("./base58_chars.js").base58_chars } base58 string representation of the binary array.
 * @example <caption>Usage.</caption>
 * ```js
 * const str = binary_to_base58([15, 239, 64])
 * console.log(str)
 * ```
 * Logged output will be 6MRy.
 */
function binary_to_base58(uint8array: Buffer | Uint8Array) {
  const result = [];

  for (const byte of uint8array) {
    let carry = byte;
    for (let j = 0; j < result.length; ++j) {
      // @ts-ignore
      const x = (base58Map[result[j]] << 8) + carry;
      result[j] = base58_chars.charCodeAt(x % 58);
      carry = (x / 58) | 0;
    }
    while (carry) {
      result.push(base58_chars.charCodeAt(carry % 58));
      carry = (carry / 58) | 0;
    }
  }

  for (const byte of uint8array)
    if (byte) break;
    else result.push("1".charCodeAt(0));

  result.reverse();

  return String.fromCharCode(...result);
}

export default binary_to_base58;
