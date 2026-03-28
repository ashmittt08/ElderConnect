import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Fallback to local file
    const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
    }
  }
} catch (error) {
  console.error("Failed to load Firebase credentials:", error);
}

if (!serviceAccount) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is missing and serviceAccountKey.json not found or invalid."
    );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
