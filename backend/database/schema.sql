CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    email VARCHAR(255),

    is_active BOOLEAN DEFAULT true,

    lock_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,

    role VARCHAR(50) NOT NULL,

    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    verification_token TEXT,
    verification_token_expires_at TIMESTAMP,

    last_login TIMESTAMP,

    lock_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    product_name VARCHAR(255) NOT NULL,

    description TEXT,

    image TEXT,

    category VARCHAR(255),

    price DECIMAL(12,2) NOT NULL,

    inventory INTEGER DEFAULT 0,

    status VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    product_id UUID REFERENCES products(id) ON DELETE CASCADE,

    variant_name VARCHAR(255),
    variant_value VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    code VARCHAR(100) NOT NULL,

    description TEXT,

    discount_type VARCHAR(50),

    discount_value DECIMAL(12,2),

    min_order_value DECIMAL(12,2),

    max_discount_amount DECIMAL(12,2),

    usage_limit INTEGER,

    usage_count INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,

    start_date TIMESTAMP,
    end_date TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    customer_id UUID,

    order_number VARCHAR(100),

    total_amount DECIMAL(12,2),

    shipping_fee DECIMAL(12,2),

    discount_amount DECIMAL(12,2),

    final_amount DECIMAL(12,2),

    status VARCHAR(50),

    payment_method VARCHAR(50),

    payment_status VARCHAR(50),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

    product_id UUID REFERENCES products(id),

    quantity INTEGER,
    price DECIMAL(12,2),

    subtotal DECIMAL(12,2)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    order_id UUID REFERENCES orders(id),

    user_id UUID REFERENCES users(id),

    amount DECIMAL(12,2),

    currency VARCHAR(20),

    payment_method VARCHAR(50),

    transaction_id TEXT,

    status VARCHAR(50),

    refund_amount DECIMAL(12,2),

    refund_reason TEXT,

    failure_reason TEXT,

    description TEXT,

    processed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);