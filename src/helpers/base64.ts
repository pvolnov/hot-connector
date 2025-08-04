const base64 = {
  decode(base64: string) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Uint8Array(bytes.buffer);
  },

  encode(buffer: Uint8Array) {
    var binary = "";
    var len = buffer.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return window.btoa(binary);
  },
};

export default base64;
