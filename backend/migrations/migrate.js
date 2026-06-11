import dotenv from 'dotenv';
import mongoose from 'mongoose';
import pg from 'pg';
import { randomUUID } from 'crypto';

dotenv.config();

const { Client } = pg;

const pgClient = new Client({
    host: process.env.PG_HOST || process.env.DB_HOST,
    port: parseInt(process.env.PG_PORT || process.env.DB_PORT || '5432', 10),
    user: process.env.PG_USER || process.env.DB_USER,
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PG_DATABASE || process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
});

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error('MONGO_URI is required in environment variables');
}

await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

await pgClient.connect();

const db = mongoose.connection.db;
const tenantIdMap = new Map();
const userIdMap = new Map();
const productIdMap = new Map();
const orderIdMap = new Map();

const safeValue = (value) => value === undefined ? null : value;
const safeText = (value) => value !== undefined && value !== null ? String(value) : null;
const safeDate = (value) => value ? new Date(value) : null;
const newUuid = () => randomUUID();

const insertRow = async (query, values) => {
    await pgClient.query(query, values);
};

const normalizeVariant = (variant) => {
    if (variant == null) return null;
    if (typeof variant === 'string') {
        return { name: 'option', value: variant };
    }
    if (typeof variant === 'object') {
        const name = variant.name || variant.variant_name || Object.keys(variant).join(', ');
        const value = variant.value || variant.variant_value || variant.option ||
            (variant.color && variant.size ? `${variant.color}/${variant.size}` : variant.color || variant.size || JSON.stringify(variant));
        return { name, value };
    }
    return { name: 'option', value: String(variant) };
};

const migrateTenants = async () => {
    const tenants = await db.collection('tenants').find({}).toArray();
    for (const tenant of tenants) {
        const pgId = newUuid();
        tenantIdMap.set(tenant._id.toString(), pgId);

        await insertRow(`
            INSERT INTO tenants(id, name, domain, email, is_active, lock_reason, created_at, updated_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)
            ON CONFLICT DO NOTHING
        `, [
            pgId,
            safeText(tenant.name),
            safeText(tenant.domain),
            safeText(tenant.email),
            tenant.isActive !== undefined ? tenant.isActive : true,
            safeText(tenant.lockReason),
            safeDate(tenant.createdAt) || new Date(),
            safeDate(tenant.updatedAt) || new Date()
        ]);
    }
    console.log(`Migrated ${tenants.length} tenants`);
};

const migrateUsers = async () => {
    const users = await db.collection('users').find({}).toArray();
    for (const user of users) {
        const pgId = newUuid();
        userIdMap.set(user._id.toString(), pgId);
        const tenantId = tenantIdMap.get(user.tenantId?.toString()) || null;

        await insertRow(`
            INSERT INTO users(id, tenant_id, name, email, password, role, is_verified, is_active,
                verification_token, verification_token_expires_at, last_login, lock_reason, created_at, updated_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            ON CONFLICT DO NOTHING
        `, [
            pgId,
            tenantId,
            safeText(user.name),
            safeText(user.email),
            safeText(user.password),
            safeText(user.role) || 'customer',
            user.isVerified ?? false,
            user.isActive ?? true,
            safeText(user.verificationToken),
            safeDate(user.verificationTokenExpiresAt),
            safeDate(user.lastLogin),
            safeText(user.lockReason),
            safeDate(user.createdAt) || new Date(),
            safeDate(user.updatedAt) || new Date()
        ]);
    }
    console.log(`Migrated ${users.length} users`);
};

const migrateProducts = async () => {
    const products = await db.collection('products').find({}).toArray();
    for (const product of products) {
        const pgId = newUuid();
        productIdMap.set(product._id.toString(), pgId);
        const tenantId = tenantIdMap.get(product.tenantId?.toString()) || null;

        await insertRow(`
            INSERT INTO products(id, tenant_id, product_name, description, image, category, price, inventory, status, created_at, updated_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT DO NOTHING
        `, [
            pgId,
            tenantId,
            safeText(product.productName),
            safeText(product.description),
            safeText(product.image),
            safeText(product.category),
            product.price ?? 0,
            product.inventory ?? 0,
            safeText(product.status),
            safeDate(product.createdAt) || new Date(),
            safeDate(product.updatedAt) || new Date()
        ]);

        const variants = Array.isArray(product.variant) ? product.variant : [];
        for (const variant of variants) {
            const normalized = normalizeVariant(variant);
            if (!normalized) continue;
            await insertRow(`
                INSERT INTO product_variants(product_id, variant_name, variant_value)
                VALUES($1,$2,$3)
                ON CONFLICT DO NOTHING
            `, [pgId, safeText(normalized.name), safeText(normalized.value)]);
        }
    }
    console.log(`Migrated ${products.length} products and product variants`);
};

const migrateDiscounts = async () => {
    const discounts = await db.collection('discounts').find({}).toArray();
    for (const discount of discounts) {
        const pgId = newUuid();
        const tenantId = tenantIdMap.get(discount.tenantId?.toString()) || null;

        await insertRow(`
            INSERT INTO discounts(id, tenant_id, code, description, discount_type, discount_value,
                min_order_value, max_discount_amount, usage_limit, usage_count, is_active, start_date, end_date, created_at, updated_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            ON CONFLICT DO NOTHING
        `, [
            pgId,
            tenantId,
            safeText(discount.code),
            safeText(discount.description),
            safeText(discount.discountType),
            discount.discountValue ?? 0,
            discount.minOrderValue ?? 0,
            discount.maxDiscountAmount ?? null,
            discount.usageLimit ?? null,
            discount.usageCount ?? 0,
            discount.isActive ?? true,
            safeDate(discount.startDate),
            safeDate(discount.endDate),
            safeDate(discount.createdAt) || new Date(),
            safeDate(discount.updatedAt) || new Date()
        ]);
    }
    console.log(`Migrated ${discounts.length} discounts`);
};

const migrateOrders = async () => {
    const orders = await db.collection('orders').find({}).toArray();
    for (const order of orders) {
        const pgId = newUuid();
        orderIdMap.set(order._id.toString(), pgId);
        const tenantId = tenantIdMap.get(order.tenantId?.toString()) || null;
        const customerId = userIdMap.get(order.customerId?.toString()) || null;

        await insertRow(`
            INSERT INTO orders(id, tenant_id, customer_id, order_number, total_amount, shipping_fee,
                discount_amount, final_amount, status, payment_method, payment_status, notes, created_at, updated_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            ON CONFLICT DO NOTHING
        `, [
            pgId,
            tenantId,
            customerId,
            safeText(order.orderNumber),
            order.totalAmount ?? 0,
            order.shippingFee ?? 0,
            order.discountAmount ?? 0,
            order.finalAmount ?? 0,
            safeText(order.status),
            safeText(order.paymentMethod),
            safeText(order.paymentStatus),
            safeText(order.notes),
            safeDate(order.createdAt) || new Date(),
            safeDate(order.updatedAt) || new Date()
        ]);

        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
            const productId = productIdMap.get(item.productId?.toString()) || null;
            const quantity = item.quantity ?? 0;
            const price = item.price ?? 0;
            const subtotal = item.subtotal ?? (quantity * price);

            await insertRow(`
                INSERT INTO order_items(order_id, product_id, quantity, price, subtotal)
                VALUES($1,$2,$3,$4,$5)
                ON CONFLICT DO NOTHING
            `, [pgId, productId, quantity, price, subtotal]);
        }
    }
    console.log(`Migrated ${orders.length} orders and order_items`);
};

const migratePayments = async () => {
    const payments = await db.collection('payments').find({}).toArray();
    for (const payment of payments) {
        const pgId = newUuid();
        const tenantId = tenantIdMap.get(payment.tenantId?.toString()) || null;
        const orderId = orderIdMap.get(payment.orderId?.toString()) || null;
        const userId = userIdMap.get(payment.userId?.toString()) || null;

        await insertRow(`
            INSERT INTO payments(id, tenant_id, order_id, user_id, amount, currency, payment_method,
                transaction_id, status, refund_amount, refund_reason, failure_reason, description,
                processed_at, created_at, updated_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            ON CONFLICT DO NOTHING
        `, [
            pgId,
            tenantId,
            orderId,
            userId,
            payment.amount ?? 0,
            safeText(payment.currency) || 'VND',
            safeText(payment.paymentMethod),
            safeText(payment.transactionId),
            safeText(payment.status),
            payment.refundAmount ?? 0,
            safeText(payment.refundReason),
            safeText(payment.failureReason),
            safeText(payment.description),
            safeDate(payment.processedAt),
            safeDate(payment.createdAt) || new Date(),
            safeDate(payment.updatedAt) || new Date()
        ]);
    }
    console.log(`Migrated ${payments.length} payments`);
};

const run = async () => {
    try {
        await migrateTenants();
        await migrateUsers();
        await migrateProducts();
        await migrateDiscounts();
        await migrateOrders();
        await migratePayments();
        console.log('✅ Data migration completed');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pgClient.end();
        await mongoose.disconnect();
        process.exit(0);
    }
};

await run();