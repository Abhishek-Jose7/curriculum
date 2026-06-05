const encoder = new TextEncoder();

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function hashPassword(password: string, iterations = 600000): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: iterations,
      hash: "SHA-256"
    },
    passwordKey,
    256
  );
  
  const saltB64 = arrayBufferToBase64(saltBytes.buffer);
  const hashB64 = arrayBufferToBase64(derivedBits);
  
  return `pbkdf2_sha256$${iterations}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  
  if (!storedHash.startsWith("pbkdf2_sha256$")) {
    // Legacy plaintext comparison
    return password === storedHash;
  }
  
  const parts = storedHash.split("$");
  if (parts.length !== 4) return false;
  
  const iterations = parseInt(parts[1], 10);
  const saltB64 = parts[2];
  const hashB64 = parts[3];
  
  try {
    const saltBytes = new Uint8Array(base64ToArrayBuffer(saltB64));
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: iterations,
        hash: "SHA-256"
      },
      passwordKey,
      256
    );
    
    const computedHashB64 = arrayBufferToBase64(derivedBits);
    return computedHashB64 === hashB64;
  } catch (err) {
    console.error("Failed to verify password hash:", err);
    return false;
  }
}
