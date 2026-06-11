import dotenv from "dotenv";
dotenv.config();
import * as PayOS from "@payos/node";

const payos = new PayOS.PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

async function test() {
    try {
        const body = {
            orderCode: Number(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000)), 
            amount: 10000,
            description: `Don hang 12345`,
            items: [
                {
                    name: 'Test item',
                    quantity: 1,
                    price: 10000
                }
            ],
            returnUrl: `http://localhost:5173/order-success/123`,
            cancelUrl: `http://localhost:5173/checkout`,
        };
        const paymentLinkResponse = await payos.createPaymentLink(body);
        console.log("Success:", paymentLinkResponse.checkoutUrl);
    } catch (err) {
        console.error("Error details:", err);
    }
}
test();
