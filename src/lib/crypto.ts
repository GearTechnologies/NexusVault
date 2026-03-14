/**
 * Client-side AES-GCM encryption/decryption helpers using the Web Crypto API.
 * No third-party crypto libraries — all operations go through crypto.subtle.
 */

/**
 * Converts an ArrayBuffer to a lowercase hex string.
 * @param buffer - The buffer to convert.
 * @returns Hex string representation.
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a hex string back to an ArrayBuffer.
 * @param hex - Hex string to convert.
 * @returns ArrayBuffer representation.
 */
export function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Encrypts a plaintext string using AES-GCM 256-bit encryption.
 * Generates a random key and IV for each call.
 * @param plaintext - The string to encrypt.
 * @returns Object with ciphertext, iv, and key all as hex strings.
 */
export async function encryptData(
  plaintext: string
): Promise<{ ciphertext: string; iv: string; key: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const rawKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    rawKey,
    data
  );

  const exportedKey = await crypto.subtle.exportKey('raw', rawKey);

  return {
    ciphertext: bufferToHex(encrypted),
    iv: bufferToHex(iv.buffer),
    key: bufferToHex(exportedKey),
  };
}

/**
 * Decrypts an AES-GCM ciphertext back to plaintext.
 * @param ciphertext - Hex string of the encrypted data.
 * @param iv - Hex string of the initialisation vector.
 * @param keyHex - Hex string of the AES-GCM 256-bit key.
 * @returns The decrypted plaintext string.
 */
export async function decryptData(
  ciphertext: string,
  iv: string,
  keyHex: string
): Promise<string> {
  const keyBuffer = hexToBuffer(keyHex);
  const ivBuffer = hexToBuffer(iv);
  const ciphertextBuffer = hexToBuffer(ciphertext);

  const importedKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    importedKey,
    ciphertextBuffer
  );

  return new TextDecoder().decode(decrypted);
}
