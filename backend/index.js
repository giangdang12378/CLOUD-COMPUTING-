import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import tenantMiddleware from './middleware/tenant.js';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import orderRoutes from './routes/order.route.js';
import paymentRoutes from './routes/payment.route.js';
import discountRoutes from './routes/discount.route.js';
import staffRoutes from './routes/staff.route.js';
import userRoutes from './routes/user.route.js';
import tenantRoutes from './routes/tenant.route.js';
import customerRoutes from './routes/customer.route.js';
import inventoryRoutes from './routes/inventory.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4173;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server + RDS OK' });
});

app.post('/api/payments/webhook/payos', (req, res, next) => {
  import('./controllers/payment.controller.js').then(m => m.handlePayOSWebhook(req, res));
});
app.use('/api', tenantMiddleware);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/staffs', staffRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
