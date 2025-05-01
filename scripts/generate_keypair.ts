import { exportJwk, generateCryptoKeyPair } from "@fedify/fedify";

const result = await generateCryptoKeyPair("RSASSA-PKCS1-v1_5");
console.log("=========");
console.log("Generated Key Pair!!");
console.log("=========");
console.log(result);
const jwk = await exportJwk(result.privateKey);
console.log("=========");
console.log("Exported JWK!!");
console.log("=========");
console.log(JSON.stringify(jwk));
