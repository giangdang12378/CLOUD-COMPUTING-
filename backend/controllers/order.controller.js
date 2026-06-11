import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { reduceInventory, increaseInventory } from './inventory.controller.js';
import Payment from '../models/payment.model.js';
import Tenant from '../models/tenant.model.js';
import payos from '../utils/payos.js';
import { sendInvoiceEmail } from '../mailtrap/emails.js';
import { queryOrdersByTenant, queryOrderByIdAndTenant } from '../utils/postgresQueries.js';

const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const USE_PG = process.env.USE_PG === 'true';

// Helper function để xử lý đường dẫn hình ảnh
const processImagePath = (imagePath) => {
    if (!imagePath) return '/placeholder-product.jpg';

    // Chuyển đổi backslash thành forward slash
    let processedPath = imagePath.replace(/\\/g, '/');

    // Đảm bảo có '/' ở đầu nếu chưa có
    if (!processedPath.startsWith('/') && !processedPath.startsWith('http')) {
        processedPath = '/' + processedPath;
    }

    return processedPath;
};

// Tạo đơn hàng mới
export const createOrder = async (req, res) => {
    console.log("Create Order Request Body:", req.body);
    try {
        const {
            items,
            shippingAddress,
            paymentMethod: rawPaymentMethod,
            shippingFee = 0,
            discountAmount = 0,
            notes = "",
            status: initialStatus,
            paymentStatus: initialPaymentStatus,
            isPos = false
        } = req.body;

        // Validate required fields
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Giỏ hàng trống",
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin giao hàng",
            });
        }

        if (!rawPaymentMethod) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn phương thức thanh toán",
            });
        }

        // Map payment method for PoS or use as is
        let paymentMethod = rawPaymentMethod;
        if (isPos) {
            if (rawPaymentMethod === 'cash') paymentMethod = 'cod';
            if (rawPaymentMethod === 'transfer') paymentMethod = 'bank_transfer';
        }

        // Prepare order items and calculate total
        let totalAmount = 0;
        const orderItems = [];
        let inferredTenantId = req.tenantId;

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy sản phẩm ${item.productId}`,
                });
            }

            // Lấy tenantId từ sản phẩm nếu chưa có (dành cho marketplace customers)
            if (!inferredTenantId) {
                inferredTenantId = product.tenantId;
            }

            // Check if product has variants
            if (product.variant && product.variant.length > 0 && (item.color || item.size)) {
                // Inventory check
                if (product.inventory < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm ${product.productName} chỉ còn ${product.inventory} sản phẩm`,
                    });
                }

                // Update inventory
                product.inventory -= item.quantity;
                await product.save();

                // Add to order items with variant info
                orderItems.push({
                    productId: product._id,
                    productName: product.productName,
                    price: product.price,
                    quantity: item.quantity,
                    variant: {
                        color: item.color,
                        size: item.size
                    },
                    image: product.image || item.image,
                    note: item.note
                });
            } else {
                // Product without variants - use main inventory
                if (product.inventory < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm ${product.productName} chỉ còn ${product.inventory} sản phẩm`,
                    });
                }

                // Update inventory
                product.inventory -= item.quantity;
                await product.save();

                // Add to order items without variant info
                orderItems.push({
                    productId: product._id,
                    productName: product.productName,
                    price: product.price,
                    quantity: item.quantity,
                    image: product.image || item.image,
                    note: item.note
                });
            }

            totalAmount += product.price * item.quantity;
        }

        // Calculate final amount
        const finalAmount = totalAmount + shippingFee - discountAmount;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Đảm bảo có tenantId
        if (!inferredTenantId) {
            return res.status(400).json({
                success: false,
                message: "Không thể xác định cửa hàng cho đơn hàng này",
            });
        }

        // Kiểm tra quyền PoS (admin/staff)
        const canSetStatus = isPos && req.user && ['admin', 'tenant_admin', 'tenant_staff'].includes(req.user.role);
        const finalOrderStatus = canSetStatus ? (initialStatus || 'delivered') : 'pending';
        const finalPaymentStatus = canSetStatus ? (initialPaymentStatus || 'paid') : (paymentMethod === 'cod' ? 'pending' : 'processing');

        // Bổ sung các trường bắt buộc cho PoS shipping address nếu thiếu
        const finalShippingAddress = {
            fullName: shippingAddress.fullName || "Khách lẻ",
            phone: shippingAddress.phone || "0000000000",
            address: shippingAddress.address || "Tại cửa hàng",
            city: shippingAddress.city || "Tại cửa hàng",
            district: shippingAddress.district || "Tại cửa hàng",
            ward: shippingAddress.ward || "Tại cửa hàng"
        };

        // Create order với cấu trúc phù hợp với schema
        const order = new Order({
            orderNumber,
            tenantId: inferredTenantId,
            customerId: req.userId || req.user?._id || null,
            customerInfo: {
                name: finalShippingAddress.fullName,
                email: shippingAddress.email || req.user?.email || ""
            },
            items: orderItems,
            shippingAddress: finalShippingAddress,
            paymentMethod,
            paymentStatus: finalPaymentStatus,
            totalAmount,
            shippingFee,
            discountAmount,
            finalAmount,
            notes,
            status: finalOrderStatus,
            statusHistory: [{
                status: finalOrderStatus,
                timestamp: new Date(),
                note: isPos ? "Order created via POS" : "Order created",
                updatedBy: req.userId || req.user?._id || null
            }]
        });

        await order.save();

        // Increment usage count of promo code if applied
        if (req.body.promoCode) {
            try {
                const Discount = (await import('../models/discount.model.js')).default;
                await Discount.findOneAndUpdate(
                    { tenantId: inferredTenantId, code: req.body.promoCode.trim().toUpperCase() },
                    { $inc: { usageCount: 1 } }
                );
                console.log(`✅ Incremented usageCount for promoCode: ${req.body.promoCode}`);
            } catch (discountErr) {
                console.error("❌ Error incrementing promo code usageCount:", discountErr);
            }
        }

        // Create payment record
        const payment = new Payment({
            orderId: order._id,
            tenantId: inferredTenantId,
            userId: req.userId || req.user?._id || null,
            amount: finalAmount,
            currency: 'VND',
            paymentMethod: paymentMethod || 'cod',
            transactionId: Payment.generateTransactionId(),
            status: finalPaymentStatus === 'paid' ? 'completed' : (paymentMethod === 'cod' ? 'pending' : 'processing'),
            processedAt: finalPaymentStatus === 'paid' ? new Date() : undefined,
            description: `Thanh toán cho đơn hàng ${orderNumber} ${isPos ? '(POS)' : ''}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        await payment.save();

        // Fetch tenant info for invoice
        const tenant = await Tenant.findById(inferredTenantId);
        
        // Prepare invoice data
        const invoiceData = {
            customerName: order.customerInfo.name,
            storeName: tenant?.name || "Cửa hàng của chúng tôi",
            transactionId: order.orderNumber,
            orderDate: new Date(order.createdAt).toLocaleString('vi-VN'),
            paymentMethod: order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 
                           order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 
                           order.paymentMethod === 'payos' ? 'Thanh toán Online (PayOS)' : order.paymentMethod,
            orderItems: order.items,
            subtotal: order.totalAmount,
            shippingFee: order.shippingFee,
            discountAmount: order.discountAmount,
            totalAmount: order.finalAmount,
            storeAddress: tenant?.address || "Đang cập nhật",
            storePhone: tenant?.phone || "Đang cập nhật"
        };

        // Send invoice email (async)
        if (order.customerInfo.email && (paymentMethod === 'cod' || finalPaymentStatus === 'paid')) {
            sendInvoiceEmail(order.customerInfo.email, invoiceData);
        }

        // Handle PayOS Payment Link Creation
        let checkoutUrl = null;
        if ((paymentMethod === 'payos' || (isPos && paymentMethod === 'bank_transfer'))) {
            if (!payos) {
                console.error("❌ PayOS is not configured but was requested.");
                // We don't throw error here to allow COD, but for payos method it's a problem
                if (paymentMethod === 'payos') {
                    // Revert inventory because order is invalid without payment link
                    for (const item of order.items) {
                        await increaseInventory(item.productId, item.quantity);
                    }
                    await Order.findByIdAndDelete(order._id);
                    await Payment.findByIdAndDelete(payment._id);
                    return res.status(500).json({
                        success: false,
                        message: "Cổng thanh toán Online chưa được cấu hình. Vui lòng thử lại sau hoặc chọn phương thức khác."
                    });
                }
            } else {
                // For customer checkout or POS transfer
                try {
                    const orderItems = order.items.map(item => ({
                        name: item.productName.slice(0, 50), // PayOS limit
                        quantity: item.quantity,
                        price: item.price
                    }));

                    const body = {
                        orderCode: Number(Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000)), 
                        amount: order.finalAmount,
                        description: `Don hang ${order.orderNumber.slice(-10)}`,
                        items: orderItems,
                        returnUrl: isPos ? `http://localhost:5173/admin/pos` : `http://localhost:5173/order-success/${order._id}`,
                        cancelUrl: isPos ? `http://localhost:5173/admin/pos` : `http://localhost:5173/checkout`,
                    };

                    // const paymentLinkResponse = await payos.createPaymentLink(body);
                    // checkoutUrl = paymentLinkResponse.checkoutUrl;
                    let paymentLinkResponse;

try {
    paymentLinkResponse = await payos.paymentRequests.create(body);
    checkoutUrl = paymentLinkResponse.checkoutUrl;
} catch (error) {
    console.error("❌ PayOS createPaymentLink error:", error);

    return res.status(500).json({
        success: false,
        message: "Không tạo được link PayOS",
        error: error.message
    });
}

                    // Update payment with PayOS info
                    payment.metadata.payosOrderCode = body.orderCode;
                    payment.metadata.paymentLinkId = paymentLinkResponse.paymentLinkId;
                    await payment.save();
                } catch (error) {
                    console.error("PayOS API Error:", error);
                    if (paymentMethod === 'payos') {
                        // Revert if it's the only payment method
                        for (const item of order.items) {
                            await increaseInventory(item.productId, item.quantity);
                        }
                        await Order.findByIdAndDelete(order._id);
                        await Payment.findByIdAndDelete(payment._id);
                        return res.status(500).json({
                            success: false,
                            message: "Lỗi kết nối cổng thanh toán. Vui lòng thử lại.",
                            error: error.message
                        });
                    }
                }
            }
        }

        res.status(201).json({
            success: true,
            message: isPos ? "Đã tạo đơn hàng" : "Đặt hàng thành công",
            order,
            paymentId: payment._id,
            checkoutUrl // Return PayOS link if created
        });
    } catch (error) {
        console.error("❌ ERROR CREATING ORDER:", error.stack || error);
        res.status(500).json({
            success: false,
            message: "Không thể tạo đơn hàng",
            error: error.message,
            stack: error.stack
        });
    }
};


// Lấy danh sách đơn hàng (Admin)
export const getOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = '',
            paymentStatus = '',
            search = '',
            sortBy = 'newest',
            startDate = '',
            endDate = ''
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        if (USE_PG) {
            const tenantId = req.tenantId;
            const rows = await queryOrdersByTenant({
                tenantId,
                limit: limitNum,
                offset: skip,
                status: status && status !== 'all' ? status : undefined,
                paymentStatus: paymentStatus && paymentStatus !== 'all' ? paymentStatus : undefined,
                search: search || undefined
            });

            const processedOrders = rows.map(order => ({
                ...order,
                items: []
            }));

            return res.json({
                orders: processedOrders,
                pagination: {
                    currentPage: pageNum,
                    totalPages: 1,
                    totalOrders: processedOrders.length,
                    hasNextPage: false,
                    hasPrevPage: false,
                    limit: limitNum
                }
            });
        }

        let filter = {};
        if (req.tenantId) {
            filter.tenantId = req.tenantId;
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (paymentStatus && paymentStatus !== 'all') {
            filter.paymentStatus = paymentStatus;
        }

        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customerInfo.name': { $regex: search, $options: 'i' } },
                { 'customerInfo.email': { $regex: search, $options: 'i' } },
                { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        let sort = {};
        switch (sortBy) {
            case 'oldest':
                sort.createdAt = 1;
                break;
            case 'amount_asc':
                sort.finalAmount = 1;
                break;
            case 'amount_desc':
                sort.finalAmount = -1;
                break;
            case 'newest':
            default:
                sort.createdAt = -1;
                break;
        }

        const orders = await Order
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('customerId', 'name email')
            .populate('items.productId', 'productName image');

        // Xử lý hình ảnh cho orders
        const processedOrders = orders.map(order => ({
            ...order.toObject(),
            items: order.items.map(item => ({
                ...item,
                image: processImagePath(item.productId?.image || item.image)
            }))
        }));

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limitNum);

        res.json({
            orders: processedOrders,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalOrders,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                limit: limitNum
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết đơn hàng
export const getOrderById = async (req, res) => {
    try {
        if (USE_PG) {
            const order = await queryOrderByIdAndTenant(req.params.id, req.tenantId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            return res.json({
                ...order,
                items: []
            });
        }

        const query = { _id: req.params.id };
        if (req.tenantId) query.tenantId = req.tenantId;

        const order = await Order
            .findOne(query)
            .populate('customerId', 'name email')
            .populate('items.productId', 'productName image inventory status')
            .populate('statusHistory.updatedBy', 'name');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Xử lý hình ảnh cho order detail
        const processedOrder = {
            ...order.toObject(),
            items: order.items.map(item => ({
                ...item,
                image: processImagePath(item.productId?.image || item.image)
            }))
        };

        res.json(processedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật trạng thái đơn hàng (Admin only)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentStatus, paymentMethod, note } = req.body;

        const query = { _id: id };
        if (req.tenantId) query.tenantId = req.tenantId;

        const order = await Order.findOne(query);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng",
            });
        }

        const oldStatus = order.status;
        const oldPaymentStatus = order.paymentStatus;
        const oldPaymentMethod = order.paymentMethod;

        // 1. Update Order Status
        if (status) {
            const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Trạng thái đơn hàng không hợp lệ",
                });
            }

            order.status = status;

            // Handle inventory adjustment
            if (status === "cancelled" && oldStatus !== "cancelled") {
                // Return items to inventory
                for (const item of order.items) {
                    await increaseInventory(item.productId, item.quantity);
                }
            } else if (status === "delivered" && oldStatus === "cancelled") {
                // Deduct items from inventory again
                for (const item of order.items) {
                    await reduceInventory(item.productId, item.quantity);
                }
            }

            // Sync payment status for delivered/cancelled if not explicitly provided
            if (!paymentStatus) {
                if (status === 'delivered') {
                    order.paymentStatus = 'paid';
                } else if (status === 'cancelled') {
                    order.paymentStatus = 'failed';
                }
            }
        }

        // 2. Update Payment Status
        if (paymentStatus) {
            const validPaymentStatuses = ['pending', 'processing', 'paid', 'failed', 'refunded'];
            if (!validPaymentStatuses.includes(paymentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Trạng thái thanh toán không hợp lệ",
                });
            }
            order.paymentStatus = paymentStatus;
        }

        // 3. Update Payment Method
        if (paymentMethod) {
            const validPaymentMethods = ['cod', 'bank_transfer', 'e_wallet', 'payos'];
            if (!validPaymentMethods.includes(paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    message: "Phương thức thanh toán không hợp lệ",
                });
            }
            order.paymentMethod = paymentMethod;
        }

        // 4. Update matching Payment record if it exists
        const payment = await Payment.findOne({ orderId: order._id });
        if (payment) {
            if (paymentMethod) payment.paymentMethod = paymentMethod;
            if (paymentStatus) {
                payment.status = paymentStatus === 'paid' ? 'completed' : 
                                 paymentStatus === 'failed' ? 'failed' : 
                                 paymentStatus === 'refunded' ? 'refunded' : 'pending';
                if (paymentStatus === 'paid') {
                    payment.processedAt = new Date();
                }
            }
            await payment.save();
        }

        // 5. Add custom status history
        let historyNote = note || '';
        if (!historyNote) {
            const changes = [];
            if (status && status !== oldStatus) changes.push(`Trạng thái: ${oldStatus} -> ${status}`);
            if (paymentStatus && paymentStatus !== oldPaymentStatus) changes.push(`Thanh toán: ${oldPaymentStatus} -> ${paymentStatus}`);
            if (paymentMethod && paymentMethod !== oldPaymentMethod) changes.push(`Phương thức: ${oldPaymentMethod} -> ${paymentMethod}`);
            historyNote = `Cập nhật đơn hàng (${changes.join(', ')})`;
        }

        order.statusHistory.push({
            status: status || order.status,
            timestamp: new Date(),
            note: historyNote,
            updatedBy: req.userId || req.user?._id || null
        });

        await order.save();

        res.json({
            success: true,
            message: "Cập nhật đơn hàng thành công",
            order,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: "Không thể cập nhật trạng thái đơn hàng",
            error: error.message,
        });
    }
};

// Cập nhật trạng thái thanh toán (Admin only)
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, note = '' } = req.body;
        const orderId = req.params.id;

        if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentStatus = paymentStatus;
        order.statusHistory.push({
            status: `payment_${paymentStatus}`,
            timestamp: new Date(),
            note: note || `Payment status changed to ${paymentStatus}`,
            updatedBy: req.userId
        });

        await order.save();

        res.json({
            message: 'Payment status updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy đơn hàng của customer (User only) - Phiên bản đã cập nhật hoàn toàn
export const getCustomerOrders = async (req, res) => {
    try {
        const customerId = req.userId;
        const { page = 1, limit = 10, status = '' } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let filter = { customerId };
        if (req.tenantId) {
            filter.tenantId = req.tenantId;
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        const orders = await Order
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate({
                path: 'items.productId',
                select: 'productName image',
                match: { _id: { $exists: true } }
            })
            .lean();

        // Xử lý các mục không có productId hợp lệ và chuẩn hóa đường dẫn hình ảnh
        const sanitizedOrders = orders.map(order => ({
            ...order,
            items: order.items.map(item => {
                // Xử lý hình ảnh từ nhiều nguồn với thứ tự ưu tiên
                let finalImage = '/placeholder-product.jpg';

                // Ưu tiên hình ảnh từ populate (productId) - nếu sản phẩm vẫn tồn tại
                if (item.productId?.image) {
                    finalImage = processImagePath(item.productId.image);
                }
                // Sau đó từ item.image (được lưu khi tạo order)
                else if (item.image) {
                    finalImage = processImagePath(item.image);
                }

                // Tên sản phẩm với thứ tự ưu tiên tương tự
                const productName = item.productId?.productName ||
                    item.productName ||
                    'Sản phẩm không xác định';

                return {
                    ...item,
                    // Cập nhật image path đã xử lý
                    image: finalImage,
                    // Thông tin sản phẩm để tương thích với frontend
                    product: {
                        productName: productName,
                        image: finalImage
                    },
                    // Đảm bảo có productName ở level item
                    productName: productName
                };
            })
        }));

        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limitNum);

        // Log để debug
        console.log(`Returning ${sanitizedOrders.length} orders for customer ${customerId}`);
        if (sanitizedOrders.length > 0) {
            console.log('Sample order item image paths:',
                sanitizedOrders[0].items.map(item => ({
                    productName: item.productName,
                    image: item.image,
                    hasProductId: !!item.productId
                }))
            );
        }

        res.json({
            orders: sanitizedOrders,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalOrders,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

// Hủy đơn hàng (Customer only, chỉ khi pending)
export const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const customerId = req.userId;
        const { reason = '' } = req.body;

        const order = await Order.findOne({ _id: orderId, customerId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Can only cancel pending orders' });
        }

        // Hoàn trả inventory
        for (const item of order.items) {
            await increaseInventory(item.productId, item.quantity);
        }

        order.status = 'cancelled';
        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            note: reason || 'Cancelled by customer'
        });

        await order.save();

        res.json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get order statistics (Admin only)
export const getOrderStats = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const matchStage = { createdAt: { $gte: startDate } };
        if (req.tenantId) matchStage.tenantId = req.tenantId;

        const stats = await Order.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$finalAmount' } } }
        ]);

        const totalOrders = await Order.countDocuments(matchStage);
        
        const revMatchStage = { ...matchStage, status: { $ne: 'cancelled' } };
        const totalRevenue = await Order.aggregate([
            { $match: revMatchStage },
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]);

        res.json({
            period: `${period} days`,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            statusBreakdown: stats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
