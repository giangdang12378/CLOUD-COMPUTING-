import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Tenant from '../models/tenant.model.js';
import { sendInvoiceEmail } from '../mailtrap/emails.js';
import payos from '../utils/payos.js';
import { increaseInventory } from './inventory.controller.js';

// Webhook handler for PayOS
export const handlePayOSWebhook = async (req, res) => {
    try {
        // 1. Log incoming webhook data clearly
        console.log(">>> PayOS Webhook received:", JSON.stringify(req.body, null, 2));

        const { code, data, desc } = req.body;
        
        if (code === "00" && data) {
            const { orderCode, paymentLinkId, description } = data;

            // 2. Find Payment using both metadata.payosOrderCode AND metadata.paymentLinkId
            let payment = await Payment.findOne({ 
                $or: [
                    { 'metadata.payosOrderCode': Number(orderCode) },
                    { 'metadata.paymentLinkId': paymentLinkId }
                ]
            });

            let order;

            if (payment) {
                // 3. Update Payment record status
                if (payment.status !== 'completed') {
                    payment.status = 'completed';
                    payment.processedAt = new Date();
                    
                    // Update gateway response info
                    if (!payment.paymentDetails) payment.paymentDetails = {};
                    payment.paymentDetails.gatewayResponse = data;
                    
                    await payment.save();
                    console.log(`Payment record ${payment._id} marked as completed`);
                }
                
                // Find associated order
                order = await Order.findById(payment.orderId);
            } else {
                // 5. Fallback: find Order directly if Payment not found by metadata
                console.log(`Payment not found for orderCode ${orderCode}. Attempting fallback search...`);
                
                // In order.controller.js: description: `Don hang ${order.orderNumber.slice(-10)}`
                if (description) {
                    const parts = description.split(' ');
                    const orderSuffix = parts[parts.length - 1]; 
                    
                    if (orderSuffix) {
                        // Search for order where orderNumber ends with the suffix from description
                        order = await Order.findOne({ 
                            orderNumber: { $regex: orderSuffix + '$' } 
                        });
                        
                        if (order) {
                            console.log(`Order found via fallback description match: ${order.orderNumber}`);
                            // Attempt to find and update any associated payment record
                            payment = await Payment.findOne({ orderId: order._id });
                            if (payment && payment.status !== 'completed') {
                                payment.status = 'completed';
                                payment.processedAt = new Date();
                                payment.metadata.payosOrderCode = orderCode;
                                payment.metadata.paymentLinkId = paymentLinkId;
                                await payment.save();
                            }
                        }
                    }
                }
            }

            // 4. Update Order paymentStatus and status
            if (order) {
                // Atomically update order status from non-paid to paid to avoid race conditions
                const updatedOrder = await Order.findOneAndUpdate(
                    { _id: order._id, paymentStatus: { $ne: 'paid' } },
                    {
                        $set: {
                            paymentStatus: 'paid',
                            status: 'delivered'
                        },
                        $push: {
                            statusHistory: {
                                status: 'delivered',
                                timestamp: new Date(),
                                note: 'Thanh toán qua PayOS thành công (Xác nhận qua Webhook)'
                            }
                        }
                    },
                    { new: true }
                );
                
                if (updatedOrder) {
                    console.log(`Order ${order.orderNumber} status updated atomically to delivered/paid`);

                    // 6. Call sendInvoiceEmail only if status was actually updated
                    try {
                        const tenant = await Tenant.findById(order.tenantId);
                        const invoiceData = {
                            customerName: updatedOrder.customerInfo.name,
                            storeName: tenant?.name || "Cửa hàng của chúng tôi",
                            transactionId: updatedOrder.orderNumber,
                            orderDate: new Date(updatedOrder.createdAt).toLocaleString('vi-VN'),
                            paymentMethod: 'Thanh toán Online (PayOS)',
                            orderItems: updatedOrder.items,
                            subtotal: updatedOrder.totalAmount,
                            shippingFee: updatedOrder.shippingFee,
                            discountAmount: updatedOrder.discountAmount,
                            totalAmount: updatedOrder.finalAmount,
                            storeAddress: tenant?.address || "Đang cập nhật",
                            storePhone: tenant?.phone || "Đang cập nhật"
                        };
                        
                        if (updatedOrder.customerInfo.email) {
                            sendInvoiceEmail(updatedOrder.customerInfo.email, invoiceData);
                            console.log(`Invoice email sent to ${updatedOrder.customerInfo.email}`);
                        }
                    } catch (emailError) {
                        console.error("Lỗi gửi email xác nhận thanh toán PayOS:", emailError);
                    }
                } else {
                    console.log(`Order ${order.orderNumber} was already processed as paid/delivered atomically. Webhook execution skipped email.`);
                }
            } else {
                console.error(`Could not find Order or Payment for orderCode: ${orderCode}`);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("PayOS Webhook Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy danh sách tất cả payments với filters
export const getPayments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            paymentMethod = '',
            dateFrom = '',
            dateTo = '',
            sortBy = 'newest'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build filter
        let filter = { tenantId: req.tenantId };

        // Search by transaction ID or order ID
        if (search) {
            filter.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by status
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Filter by payment method
        if (paymentMethod && paymentMethod !== 'all') {
            filter.paymentMethod = paymentMethod;
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }

        // Build sort
        let sort = {};
        switch (sortBy) {
            case 'amount_asc':
                sort.amount = 1;
                break;
            case 'amount_desc':
                sort.amount = -1;
                break;
            case 'oldest':
                sort.createdAt = 1;
                break;
            case 'newest':
            default:
                sort.createdAt = -1;
                break;
        }

        // Execute query
        const payments = await Payment
            .find(filter)
            .populate('userId', 'name email')
            .populate('orderId', 'orderNumber')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        const totalPayments = await Payment.countDocuments(filter);
        const totalPages = Math.ceil(totalPayments / limitNum);

        // Get statistics
        const stats = await Payment.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalRefunded: { $sum: '$refundAmount' },
                    completedAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                '$amount',
                                0
                            ]
                        }
                    },
                    pendingAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'pending'] },
                                '$amount',
                                0
                            ]
                        }
                    },
                    failedAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'failed'] },
                                '$amount',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            payments,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalPayments,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                limit: limitNum
            },
            stats: stats[0] || {
                totalAmount: 0,
                totalRefunded: 0,
                completedAmount: 0,
                pendingAmount: 0,
                failedAmount: 0
            }
        });
    } catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách thanh toán',
            error: error.message
        });
    }
};

// Lấy chi tiết một payment
export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await Payment
            .findById(id)
            .populate('userId', 'name email')
            .populate({
                path: 'orderId',
                populate: {
                    path: 'items.productId',
                    select: 'productName price image'
                }
            });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch thanh toán'
            });
        }

        res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error('Error getting payment by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin thanh toán',
            error: error.message
        });
    }
};

// Process refund
export const processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { refundAmount, reason } = req.body;

        if (!refundAmount || refundAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền hoàn trả không hợp lệ'
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do hoàn tiền'
            });
        }

        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch thanh toán'
            });
        }

        // Process refund
        await payment.processRefund(refundAmount, reason);

        // Update order status if fully refunded
        if (payment.status === 'refunded') {
            await Order.findByIdAndUpdate(payment.orderId, {
                status: 'refunded',
                paymentStatus: 'refunded'
            });
        }

        res.json({
            success: true,
            message: 'Hoàn tiền thành công',
            payment
        });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Không thể xử lý hoàn tiền'
        });
    }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case '7d':
                dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Overall stats
        const overallStats = await Payment.aggregate([
            {
                $match: {
                    tenantId: req.tenantId,
                    createdAt: { $gte: dateFilter }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['completed', 'partially_refunded']] },
                                { $subtract: ['$amount', '$refundAmount'] },
                                0
                            ]
                        }
                    },
                    totalTransactions: { $sum: 1 },
                    successfulTransactions: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['completed', 'partially_refunded']] },
                                1,
                                0
                            ]
                        }
                    },
                    failedTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                        }
                    },
                    pendingTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
                        }
                    },
                    totalRefunded: { $sum: '$refundAmount' },
                    avgTransactionValue: {
                        $avg: {
                            $cond: [
                                { $in: ['$status', ['completed', 'partially_refunded']] },
                                '$amount',
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        // Payment method breakdown
        const paymentMethodStats = await Payment.aggregate([
            {
                $match: {
                    tenantId: req.tenantId,
                    createdAt: { $gte: dateFilter },
                    status: { $in: ['completed', 'partially_refunded'] }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    amount: { $sum: { $subtract: ['$amount', '$refundAmount'] } }
                }
            },
            { $sort: { amount: -1 } }
        ]);

        // Daily revenue
        const dailyRevenue = await Payment.getDailyRevenue(
            period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365,
            req.tenantId
        );

        // Top customers by payment
        const topCustomers = await Payment.aggregate([
            {
                $match: {
                    tenantId: req.tenantId,
                    createdAt: { $gte: dateFilter },
                    status: { $in: ['completed', 'partially_refunded'] }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalSpent: { $sum: { $subtract: ['$amount', '$refundAmount'] } },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    userId: '$_id',
                    name: '$user.name',
                    email: '$user.email',
                    totalSpent: 1,
                    transactionCount: 1
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                overview: overallStats[0] || {
                    totalRevenue: 0,
                    totalTransactions: 0,
                    successfulTransactions: 0,
                    failedTransactions: 0,
                    pendingTransactions: 0,
                    totalRefunded: 0,
                    avgTransactionValue: 0
                },
                paymentMethodBreakdown: paymentMethodStats,
                dailyRevenue,
                topCustomers,
                period
            }
        });
    } catch (error) {
        console.error('Error getting payment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thống kê thanh toán',
            error: error.message
        });
    }
};

// Update payment status (for manual processing)
export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, failureReason } = req.body;

        const validStatuses = ['pending', 'processing', 'completed', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch thanh toán'
            });
        }

        // Update payment
        payment.status = status;
        if (status === 'failed' && failureReason) {
            payment.failureReason = failureReason;
        }
        if (status === 'completed') {
            payment.processedAt = new Date();
        }

        await payment.save();

        // Update order payment status
        await Order.findByIdAndUpdate(payment.orderId, {
            paymentStatus: status === 'completed' ? 'paid' : status
        });

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thanh toán thành công',
            payment
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật trạng thái thanh toán',
            error: error.message
        });
    }
};

// Export payment data
export const exportPayments = async (req, res) => {
    try {
        const { dateFrom, dateTo, format = 'json' } = req.query;

        let filter = { tenantId: req.tenantId };
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }

        const payments = await Payment
            .find(filter)
            .populate('userId', 'name email')
            .populate('orderId', 'orderNumber')
            .sort({ createdAt: -1 });

        if (format === 'csv') {
            // Convert to CSV format
            const csv = payments.map(p => ({
                'Mã giao dịch': p.transactionId,
                'Mã đơn hàng': p.orderId?.orderNumber || '',
                'Khách hàng': p.userId?.name || '',
                'Email': p.userId?.email || '',
                'Số tiền': p.amount,
                'Tiền hoàn trả': p.refundAmount,
                'Phương thức': p.paymentMethod,
                'Trạng thái': p.status,
                'Ngày tạo': new Date(p.createdAt).toLocaleString('vi-VN')
            }));

            res.json({
                success: true,
                data: csv,
                format: 'csv'
            });
        } else {
            res.json({
                success: true,
                payments,
                format: 'json'
            });
        }
    } catch (error) {
        console.error('Error exporting payments:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xuất dữ liệu thanh toán',
            error: error.message
        });
    }
};

// Xác minh chủ động trạng thái thanh toán từ PayOS
export const verifyPayOSPayment = async (req, res) => {
    try {
        const { orderCode } = req.body;
        if (!orderCode) {
            return res.status(400).json({
                success: false,
                message: "Mã đơn hàng PayOS là bắt buộc"
            });
        }

        console.log(`Checking PayOS payment status for orderCode ${orderCode}...`);
        
        // Tìm Payment
        let payment = await Payment.findOne({ 'metadata.payosOrderCode': Number(orderCode) });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thông tin thanh toán cho mã đơn hàng này"
            });
        }

        let order = await Order.findById(payment.orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng tương ứng"
            });
        }

        // Kiểm tra xem PayOS đã được cấu hình chưa
        if (!payos) {
            return res.status(500).json({
                success: false,
                message: "PayOS chưa được cấu hình"
            });
        }

        let paymentInfo;
        try {
            paymentInfo = await payos.paymentRequests.get(orderCode);
        } catch (payosError) {
            console.error("PayOS API error for orderCode:", orderCode, payosError.message);
            return res.status(400).json({
                success: false,
                message: "Lỗi kết nối PayOS: " + payosError.message
            });
        }

        console.log("PayOS response for orderCode:", orderCode, "Status:", paymentInfo.status);

        const wasCancelled = order.status === 'cancelled';

        if (paymentInfo.status === 'PAID') {
            // Atomically update Order status to paid/delivered to prevent race conditions
            const updatedOrder = await Order.findOneAndUpdate(
                { _id: order._id, paymentStatus: { $ne: 'paid' } },
                {
                    $set: {
                        paymentStatus: 'paid',
                        status: 'delivered'
                    },
                    $push: {
                        statusHistory: {
                            status: 'delivered',
                            timestamp: new Date(),
                            note: 'Thanh toán qua PayOS thành công (Xác nhận từ client)'
                        }
                    }
                },
                { new: true }
            );

            if (updatedOrder) {
                // Cập nhật Payment
                payment.status = 'completed';
                payment.processedAt = new Date();
                if (!payment.paymentDetails) payment.paymentDetails = {};
                payment.paymentDetails.gatewayResponse = paymentInfo;
                await payment.save();

                // Gửi hóa đơn qua email (nếu có)
                try {
                    const tenant = await Tenant.findById(updatedOrder.tenantId);
                    const invoiceData = {
                        customerName: updatedOrder.customerInfo.name,
                        storeName: tenant?.name || "Cửa hàng của chúng tôi",
                        transactionId: updatedOrder.orderNumber,
                        orderDate: new Date(updatedOrder.createdAt).toLocaleString('vi-VN'),
                        paymentMethod: 'Thanh toán Online (PayOS)',
                        orderItems: updatedOrder.items,
                        subtotal: updatedOrder.totalAmount,
                        shippingFee: updatedOrder.shippingFee,
                        discountAmount: updatedOrder.discountAmount,
                        totalAmount: updatedOrder.finalAmount,
                        storeAddress: tenant?.address || "Đang cập nhật",
                        storePhone: tenant?.phone || "Đang cập nhật"
                    };
                    
                    if (updatedOrder.customerInfo.email) {
                        sendInvoiceEmail(updatedOrder.customerInfo.email, invoiceData);
                        console.log(`Invoice email sent to ${updatedOrder.customerInfo.email}`);
                    }
                } catch (emailError) {
                    console.error("Lỗi gửi email hóa đơn:", emailError);
                }
            } else {
                console.log(`Order ${order.orderNumber} was already processed as paid/delivered atomically. Client verification skipped email.`);
            }
            return res.json({
                success: true,
                status: 'PAID',
                message: 'Đơn hàng đã được thanh toán thành công',
                order: updatedOrder || order
            });
        } else if (paymentInfo.status === 'CANCELLED') {
            if (!wasCancelled) {
                // Cập nhật Payment
                payment.status = 'failed';
                payment.failureReason = 'Payment cancelled on PayOS';
                await payment.save();

                // Hoàn trả sản phẩm về kho
                for (const item of order.items) {
                    await increaseInventory(item.productId, item.quantity);
                }

                // Cập nhật Order
                order.paymentStatus = 'failed';
                order.status = 'cancelled';
                order.statusHistory.push({
                    status: 'cancelled',
                    timestamp: new Date(),
                    note: 'Giao dịch PayOS bị hủy'
                });
                await order.save();
            }
            return res.json({
                success: true,
                status: 'CANCELLED',
                message: 'Thanh toán đơn hàng đã bị hủy',
                order
            });
        } else {
            return res.json({
                success: true,
                status: paymentInfo.status,
                message: `Đơn hàng đang chờ thanh toán (Trạng thái: ${paymentInfo.status})`,
                order
            });
        }
    } catch (error) {
        console.error("Error in verifyPayOSPayment:", error);
        res.status(500).json({
            success: false,
            message: 'Không thể xác thực thanh toán PayOS',
            error: error.message
        });
    }
};