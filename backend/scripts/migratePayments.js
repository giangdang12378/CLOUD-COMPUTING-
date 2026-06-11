// backend/scripts/migratePayments.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../models/order.model.js';
import Payment from '../models/payment.model.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env (go up 2 levels from scripts folder)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const migratePayments = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found in environment variables. Check your .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Get all orders
        const orders = await Order.find({});
        console.log(`Found ${orders.length} orders`);

        let created = 0;
        let skipped = 0;

        for (const order of orders) {
            // Skip orders without userId
            if (!order.userId) {
                console.log(`Skipping order ${order.orderNumber} - no userId`);
                skipped++;
                continue;
            }

            // Check if payment already exists for this order
            const existingPayment = await Payment.findOne({ orderId: order._id });

            if (existingPayment) {
                console.log(`Payment already exists for order ${order.orderNumber}`);
                skipped++;
                continue;
            }

            // Create payment record
            const payment = new Payment({
                orderId: order._id,
                userId: order.userId,
                amount: order.finalAmount || order.totalAmount || 0,
                currency: 'VND',
                paymentMethod: order.paymentMethod || 'cod',
                transactionId: Payment.generateTransactionId(),
                status: determinePaymentStatus(order),
                description: `Thanh toán cho đơn hàng ${order.orderNumber}`,
                processedAt: order.status === 'delivered' ? order.updatedAt : null,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            });

            await payment.save();
            created++;
            console.log(`Created payment for order ${order.orderNumber}`);
        }

        console.log(`\nMigration completed!`);
        console.log(`Created: ${created} payments`);
        console.log(`Skipped: ${skipped} orders (already had payments)`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

function determinePaymentStatus(order) {
    // Determine payment status based on order status and payment method
    if (order.status === 'cancelled') {
        return 'failed';
    }

    if (order.paymentMethod === 'cod') {
        if (order.status === 'delivered') {
            return 'completed';
        }
        return 'pending';
    }

    // For other payment methods
    if (order.paymentStatus === 'paid' || order.status === 'delivered') {
        return 'completed';
    }

    if (order.paymentStatus === 'failed') {
        return 'failed';
    }

    return 'pending';
}

// Run migration
migratePayments();