// backend/scripts/completeFix.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../models/order.model.js';
import Payment from '../models/payment.model.js';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const completeFix = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected!\n');

        // Step 1: Find the user
        const user = await User.findOne({ email: 'lyquoclam123@gmail.com' });
        if (!user) {
            console.error('User Lý Quốc Lâm not found!');
            process.exit(1);
        }
        console.log(`Using user: ${user.name} (${user._id})\n`);

        // Step 2: Get all orders
        const orders = await Order.find({});
        console.log(`Found ${orders.length} total orders\n`);

        let fixedOrders = 0;
        let createdPayments = 0;

        for (const order of orders) {
            // Fix userId if missing
            if (!order.userId) {
                console.log(`Fixing userId for order ${order.orderNumber}`);
                order.userId = user._id;
                await order.save();
                fixedOrders++;
            }

            // Check if payment exists
            const existingPayment = await Payment.findOne({ orderId: order._id });

            if (!existingPayment) {
                // Create payment
                const payment = new Payment({
                    orderId: order._id,
                    userId: order.userId || user._id,
                    amount: order.finalAmount || order.totalAmount || 0,
                    currency: 'VND',
                    paymentMethod: order.paymentMethod || 'cod',
                    transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000000)}`,
                    status: determinePaymentStatus(order),
                    description: `Thanh toán cho đơn hàng ${order.orderNumber}`,
                    processedAt: order.status === 'delivered' ? order.updatedAt : null,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                });

                await payment.save();
                createdPayments++;
                console.log(`Created payment for order ${order.orderNumber}`);
            }
        }

        console.log('\n=== SUMMARY ===');
        console.log(`Fixed userId for ${fixedOrders} orders`);
        console.log(`Created ${createdPayments} new payments`);

        // Verify
        const paymentsCount = await Payment.countDocuments();
        console.log(`Total payments in database: ${paymentsCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

function determinePaymentStatus(order) {
    if (order.status === 'cancelled') return 'failed';

    if (order.paymentMethod === 'cod') {
        return order.status === 'delivered' ? 'completed' : 'pending';
    }

    if (order.paymentStatus === 'paid' || order.status === 'delivered') {
        return 'completed';
    }

    return order.paymentStatus === 'failed' ? 'failed' : 'pending';
}

completeFix();