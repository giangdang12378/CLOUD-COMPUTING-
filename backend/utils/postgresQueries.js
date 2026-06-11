import pool from '../config/postgres.js';

export const queryProductsByTenant = async (tenantId) => {
    const result = await pool.query(
        `SELECT * FROM products WHERE tenant_id = $1 ORDER BY created_at DESC`,
        [tenantId]
    );
    return result.rows;
};

export const queryProductByIdAndTenant = async (productId, tenantId) => {
    if (tenantId) {
        const result = await pool.query(
            `SELECT * FROM products WHERE id = $1 AND tenant_id = $2`,
            [productId, tenantId]
        );
        return result.rows[0] || null;
    }

    const result = await pool.query(
        `SELECT * FROM products WHERE id = $1`,
        [productId]
    );
    return result.rows[0] || null;
};

export const queryOrdersByTenant = async ({ tenantId, limit = 10, offset = 0, status, paymentStatus, search }) => {
    let clause = 'WHERE tenant_id = $1';
    const params = [tenantId];
    let index = 2;

    if (status) {
        clause += ` AND status = $${index}`;
        params.push(status);
        index += 1;
    }
    if (paymentStatus) {
        clause += ` AND payment_status = $${index}`;
        params.push(paymentStatus);
        index += 1;
    }
    if (search) {
        clause += ` AND (order_number ILIKE $${index} OR notes ILIKE $${index})`;
        params.push(`%${search}%`);
        index += 1;
    }

    const result = await pool.query(
        `SELECT * FROM orders ${clause} ORDER BY created_at DESC LIMIT $${index} OFFSET $${index + 1}`,
        [...params, limit, offset]
    );
    return result.rows;
};

export const queryOrderByIdAndTenant = async (orderId, tenantId) => {
    const params = [orderId];
    let sql = `SELECT * FROM orders WHERE id = $1`;
    if (tenantId) {
        sql += ` AND tenant_id = $2`;
        params.push(tenantId);
    }
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
};

export const queryOrderItemsByOrder = async (orderId) => {
    const result = await pool.query(
        `SELECT * FROM order_items WHERE order_id = $1`,
        [orderId]
    );
    return result.rows;
};

export const insertProduct = async ({ tenantId, productName, description, image, category, price, inventory, status, variant }) => {
    const result = await pool.query(
        `INSERT INTO products(tenant_id, product_name, description, image, category, price, inventory, status)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [tenantId, productName, description, image, category, price, inventory, status]
    );

    const product = result.rows[0];
    if (Array.isArray(variant) && variant.length > 0) {
        const insertVariantText = `INSERT INTO product_variants(product_id, variant_name, variant_value) VALUES `;
        const values = [];
        const placeholders = [];
        let index = 1;
        for (const item of variant) {
            const name = item.name || item.variant_name || 'option';
            const value = item.value || item.variant_value || item.option || JSON.stringify(item);
            placeholders.push(`($${index++}, $${index++}, $${index++})`);
            values.push(product.id, name, value);
        }
        if (placeholders.length > 0) {
            await pool.query(insertVariantText + placeholders.join(', '), values);
        }
    }

    return product;
};

export const updateProductByIdAndTenant = async (productId, tenantId, updateData) => {
    const keys = Object.keys(updateData).filter(key => key !== 'variant');
    if (keys.length === 0) {
        const result = await pool.query(`SELECT * FROM products WHERE id = $1 AND tenant_id = $2`, [productId, tenantId]);
        return result.rows[0] || null;
    }

    const setFragments = keys.map((key, index) => `${key} = $${index + 1}`);
    const params = keys.map(key => updateData[key]);
    params.push(productId, tenantId);

    const result = await pool.query(
        `UPDATE products SET ${setFragments.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} AND tenant_id = $${keys.length + 2} RETURNING *`,
        params
    );

    return result.rows[0] || null;
};

export const deleteProductVariantsByProductId = async (productId) => {
    await pool.query(`DELETE FROM product_variants WHERE product_id = $1`, [productId]);
};

export const insertProductVariants = async (productId, variants) => {
    if (!Array.isArray(variants) || variants.length === 0) return;
    const insertVariantText = `INSERT INTO product_variants(product_id, variant_name, variant_value) VALUES `;
    const values = [];
    const placeholders = [];
    let index = 1;
    for (const item of variants) {
        const name = item.name || item.variant_name || 'option';
        const value = item.value || item.variant_value || item.option || JSON.stringify(item);
        placeholders.push(`($${index++}, $${index++}, $${index++})`);
        values.push(productId, name, value);
    }
    await pool.query(insertVariantText + placeholders.join(', '), values);
};

export const setProductUnavailable = async (productId, tenantId) => {
    const result = await pool.query(
        `UPDATE products SET status = 'unavailable', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [productId, tenantId]
    );
    return result.rows[0] || null;
};

export const queryProductAttributesByTenant = async (tenantId) => {
    const colorsResult = await pool.query(
        `SELECT DISTINCT variant_value FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE p.tenant_id = $1 AND pv.variant_name ILIKE 'color' ORDER BY variant_value`,
        [tenantId]
    );

    const sizesResult = await pool.query(
        `SELECT DISTINCT variant_value FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE p.tenant_id = $1 AND pv.variant_name ILIKE 'size' ORDER BY variant_value`,
        [tenantId]
    );

    return {
        colors: colorsResult.rows.map(row => row.variant_value).filter(v => v),
        sizes: sizesResult.rows.map(row => row.variant_value).filter(v => v)
    };
};

export const queryTenantScoped = async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return result.rows;
};
