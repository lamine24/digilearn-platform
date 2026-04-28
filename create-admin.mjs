import { SignJWT } from "jose";
import mysql from "mysql2/promise";

const JWT_SECRET = "local-dev-secret-key-digilearn-2024";
const OPEN_ID = "admin-local";
const APP_ID = "digilearn-local";

const conn = await mysql.createConnection("mysql://digilearn:digilearn123@localhost:3306/digilearn");

await conn.execute(
  `INSERT INTO users (openId, name, email, role, loginMethod, lastSignedIn, createdAt, updatedAt)
   VALUES (?, ?, ?, 'admin', 'local', NOW(), NOW(), NOW())
   ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), role='admin', updatedAt=NOW()`,
  [OPEN_ID, "Admin DigiLearn", "admin@digilearn.local"]
);

await conn.end();
console.log("Admin user created.");

const secretKey = new TextEncoder().encode(JWT_SECRET);
const expirationSeconds = Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 365) / 1000);

const token = await new SignJWT({ openId: OPEN_ID, appId: APP_ID, name: "Admin DigiLearn" })
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setExpirationTime(expirationSeconds)
  .sign(secretKey);

console.log("\nSession token (cookie: app_session_id):\n");
console.log(token);
console.log("\nPour vous connecter, ouvrez la console du navigateur sur http://localhost:3000 et tapez:");
console.log(`document.cookie = "app_session_id=${token}; path=/"; location.reload();`);
