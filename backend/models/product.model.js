import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    productName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['Áo', 'Quần', 'Áo khoác', 'Váy', 'Phụ kiện', 'Khác'],
        default: 'Khác',
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'unavailable', 'out_of_stock'],
        default: 'available'
    },
    inventory: {
        type: Number,
        default: 0,
        min: 0
    },
    variant: {
        type: Array,
        default: []
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;