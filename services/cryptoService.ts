export const cryptoService = {
  // Convert string to ArrayBuffer
  str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  },

  // Convert ArrayBuffer to string
  ab2str(buf: ArrayBuffer): string {
    return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
  },

  // Convert ArrayBuffer to base64
  ab2base64(buf: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },

  // Convert base64 to ArrayBuffer
  base642ab(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  },

  async getKeyMaterial(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
  },

  async deriveKey(passwordKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as any,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  },

  async encrypt(text: string, password: string): Promise<string> {
    const cleanText = text?.trim();
    const cleanPass = password?.trim();
    if (!cleanText || !cleanPass) return "";
    
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const passwordKey = await this.getKeyMaterial(cleanPass);
    const aesKey = await this.deriveKey(passwordKey, salt);
    
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      enc.encode(cleanText)
    );
    
    // Format: base64(salt) + ":" + base64(iv) + ":" + base64(ciphertext)
    const saltB64 = this.ab2base64(salt.buffer);
    const ivB64 = this.ab2base64(iv.buffer);
    const ciphertextB64 = this.ab2base64(encryptedContent);
    
    return `${saltB64}:${ivB64}:${ciphertextB64}`;
  },

  async decrypt(encryptedPayload: string, password: string): Promise<string> {
    const cleanPayload = encryptedPayload?.trim();
    const cleanPass = password?.trim();
    if (!cleanPayload || !cleanPass) return "";
    
    try {
      const parts = cleanPayload.split(':');
      if (parts.length !== 3) throw new Error("Invalid encrypted payload format");
      
      const salt = new Uint8Array(this.base642ab(parts[0]));
      const iv = new Uint8Array(this.base642ab(parts[1]));
      const ciphertext = this.base642ab(parts[2]);
      
      const passwordKey = await this.getKeyMaterial(cleanPass);
      const aesKey = await this.deriveKey(passwordKey, salt);
      
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        ciphertext
      );
      
      const dec = new TextDecoder();
      return dec.decode(decryptedContent).trim();
    } catch (e) {
      console.error("Decryption failed:", e);
      throw new Error("Incorrect Vault Password or corrupted data.");
    }
  }
};
