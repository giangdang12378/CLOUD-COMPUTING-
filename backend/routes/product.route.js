import express from 'express';
import multer from 'multer';
import { getProducts, createProduct, deleteProduct, updateProduct } from '../controllers/product.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, getProducts);
router.post('/', verifyToken, upload.single('image'), createProduct);
router.put('/:id', verifyToken, upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

export default router;
