import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const orders = mongoose.connection.collection('orders');
    const recent = await orders.find({}).sort({createdAt: -1}).limit(3).toArray();
    recent.forEach(o => console.log(o._id, o.orderNumber, 'Payment:', o.paymentStatus, 'Method:', o.paymentMethod, 'Email:', o.customerInfo.email));
    process.exit(0);
});
