// Script to generate a key - save as generate-key.ts
const generateSecureKey = (): string => {
  const keyBytes = new Uint8Array(32); // 256 bits = 32 bytes
  crypto.getRandomValues(keyBytes);
  // Convert to base64 for storage
  return btoa(String.fromCharCode(...keyBytes));
};

console.log("Generated key:", generateSecureKey());
