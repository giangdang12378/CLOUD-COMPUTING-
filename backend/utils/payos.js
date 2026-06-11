import * as PayOS from "@payos/node";
import dotenv from "dotenv";

dotenv.config();

let payos = null;

console.log("PAYOS_CLIENT_ID =", process.env.PAYOS_CLIENT_ID);

const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

if (clientId && apiKey && checksumKey) {
    try {
        // 👇 QUAN TRỌNG: dùng PayOS.PayOS
        payos = new PayOS.PayOS(
            clientId,
            apiKey,
            checksumKey
        );

        console.log("✅ PayOS initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize PayOS:", error.message);
    }
} else {
    console.warn("⚠️ Warning: PayOS environment variables are missing.");
}

export default payos;