import { generateEncryptionKey } from "@utils/crypto/generators.ts";

generateEncryptionKey().then((key) => {
  console.log("Generated encryption key:", key);
});
