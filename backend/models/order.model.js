import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    variant: {
        color: String,
        size: String
    },
    image: {
        type: String,
        default: ''
    },
    note: {
        type: String,
        trim: true
    }
});

const shippingAddressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    district: {
        type: String,
        trim: true
    },
    ward: {
        type: String,
        trim: true
    }
});

const orderSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    tenantInfo: {
        name: String,
        email: String,
        phone: String,
        address: String
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerInfo: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String
        }
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'bank_transfer', 'e_wallet', 'payos'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    shippingAddress: shippingAddressSchema,
    notes: {
        type: String,
        trim: true
    },
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: {
            type: String,
            trim: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    estimatedDelivery: {
        type: Date
    },
    actualDelivery: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customerInfo.email': 1 });

// Generate order number
orderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Calculate final amount
orderSchema.pre('save', function (next) {
    this.finalAmount = this.totalAmount + this.shippingFee - this.discountAmount;
    next();
});

// Add status to history when status changes
orderSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: `Status changed to ${this.status}`
        });
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;