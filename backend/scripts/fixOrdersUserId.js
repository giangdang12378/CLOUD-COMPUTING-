// backend/scripts/fixOrdersUserIdV2.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixOrdersUserId = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not found');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected!');

        // Find user by email
        const user = await User.findOne({ email: 'lyquoclam123@gmail.com' });

        if (!user) {
            console.error('User not found!');
            const allUsers = await User.find({}, 'name email role');
            console.log('\nAvailable users:');
            allUsers.forEach(u => {
                console.log(`- ${u.name} (${u.email}) - ID: ${u._id}`);
            });
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user._id})`);

        // First, let's check current orders
        console.log('\nChecking current orders...');
        const ordersWithoutUserId = await Order.find({
            $or: [
                { userId: null },
                { userId: { $exists: false } }
            ]
        });

        console.log(`Found ${ordersWithoutUserId.length} orders without userId`);

        // Update each order individually
        let updated = 0;
        for (const order of ordersWithoutUserId) {
            console.log(`Updating order ${order.orderNumber}...`);
            order.userId = user._id;
            await order.save();
            updated++;
        }

        console.log(`\nSuccessfully updated ${updated} orders`);

        // Verify the update
        const stillMissing = await Order.countDocuments({
            $or: [
                { userId: null },
                { userId: { $exists: false } }
            ]
        });

        console.log(`Orders still without userId: ${stillMissing}`);

        // Show all orders with their userId
        console.log('\nAll orders status:');
        const allOrders = await Order.find({}, 'orderNumber userId').populate('userId', 'name email');
        allOrders.forEach(order => {
            console.log(`- ${order.orderNumber}: ${order.userId ? order.userId.name + ' (' + order.userId._id + ')' : 'NO USER'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixOrdersUserId();