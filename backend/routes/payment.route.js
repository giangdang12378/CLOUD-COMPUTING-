import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getPayments,
    getPaymentById,
    processRefund,
    getPaymentStats,
    updatePaymentStatus,
    exportPayments,
    handlePayOSWebhook,
    verifyPayOSPayment
} from '../controllers/payment.controller.js';

import { verifyRole } from '../middleware/verifyTenant.js';

const router = express.Router();

// Public routes
router.post('/webhook/payos', handlePayOSWebhook);

// Admin routes - all require authentication and admin/staff roles
router.use(verifyToken);

// Verify PayOS status (Admin/Staff)
router.post('/verify-payos', verifyRole(['admin', 'tenant_admin', 'tenant_staff', 'super_admin']), verifyPayOSPayment);

router.use(verifyRole(['tenant_admin', 'admin']));

// Get all payments with filters and pagination
router.get('/', getPayments);

// Get payment statistics
router.get('/stats', getPaymentStats);

// Export payments data
router.get('/export', exportPayments);

// Get payment by ID
router.get('/:id', getPaymentById);

// Process refund
router.post('/:id/refund', processRefund);

// Update payment status
router.put('/:id/status', updatePaymentStatus);

export default router;