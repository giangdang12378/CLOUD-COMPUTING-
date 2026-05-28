import express from 'express';
import { login, logout, checkAuth, registerTenant, verifyEmail } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/login', login);
router.post('/register-tenant', registerTenant);
router.post('/verify-email', verifyEmail);
router.post('/logout', logout);
router.get('/check-auth', verifyToken, checkAuth);

export default router;
