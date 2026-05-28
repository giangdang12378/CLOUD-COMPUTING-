import express from 'express';
import { checkInventory, processOrder, cancelOrder } from '../controllers/inventory.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Kiểm tra inventory trước khi đặt hàng
router.post('/check', verifyToken, checkInventory);

// Xử lý đơn hàng (giảm inventory)
router.post('/process-order', verifyToken, processOrder);

// Hủy đơn hàng (tăng inventory)
router.post('/cancel-order', verifyToken, cancelOrder);

export default router;