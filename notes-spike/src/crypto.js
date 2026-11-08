import { argon2id } from "hash-wasm";

// Turn bytes into text (Base64) so they're easy to show and store, and back again.
export const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
export const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

// A salt is random bytes stored next to the user's data. It isn't secret.
// It makes sure two users with the same password still get different keys.
export function newSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
}

// Step 1: password + salt -> 32-byte key, using argon2id (slow on purpose).
// Step 2: hand those bytes to Web Crypto as an AES-GCM key that can't be read back out.
export async function deriveKey(password, salt) {
    const keyBytes = await argon2id({
        password,
        salt,
        parallelism: 1,
        iterations: 3,
        memorySize: 65536, // in KiB, so 64 MiB
        hashLength: 32, // 32 bytes = 256-bit key
        outputType: "binary",
    });
    return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

// Encrypt a note. The IV (Initialisation Vector) must be new and random every time you encrypt.
export async function encryptText(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

// Decrypt a note. With the wrong key (wrong password), throws an error.
export async function decryptText(key, { iv, ciphertext }) {
    const data = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(iv) },
        key,
        fromBase64(ciphertext)
    );
    return new TextDecoder().decode(data);
}