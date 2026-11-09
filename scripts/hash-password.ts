import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const password = process.argv[2];

if (!password || password.length < 8) {
  console.error("Gunakan: npm run auth:hash-password -- \"password-minimal-8-karakter\"");
  process.exit(1);
}

async function main() {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  console.log(`${salt}:${key.toString("hex")}`);
}

void main();
