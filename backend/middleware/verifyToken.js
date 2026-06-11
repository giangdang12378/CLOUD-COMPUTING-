// backend/middleware/verifyToken.js

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Tenant from "../models/tenant.model.js";

export const verifyToken = async (req, res, next) => {
	try {
		console.log('🔍 Auth middleware called for:', req.method, req.url);

		const token = req.cookies.token;

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized - no token provided"
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized - invalid token"
			});
		}

		// Fetch user from database
		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User not found"
			});
		}

		// CHECK TENANT STATUS
		// If user belongs to a tenant, check if that tenant is active
		if (user.tenantId && user.role !== 'super_admin') {
			const tenant = await Tenant.findById(user.tenantId);
			if (tenant && !tenant.isActive) {
				return res.status(403).json({
					success: false,
					message: `Tài khoản cửa hàng của bạn đã bị khóa. Lý do: ${tenant.lockReason || 'Không xác định'}`,
					isLocked: true
				});
			}
		}

		req.userId = decoded.userId;
		req.user = user;
		req.tenantId = user.tenantId;

		next();
	} catch (error) {
		console.error("❌ Token verification error:", error.message);

		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({
				success: false,
				message: "Token expired - please login again"
			});
		}

		return res.status(401).json({
			success: false,
			message: "Unauthorized - token verification failed"
		});
	}
};

export const optionalVerifyToken = async (req, res, next) => {
	try {
		const token = req.cookies.token;
		if (!token) return next();

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded) return next();

		const user = await User.findById(decoded.userId).select("-password");
		if (!user) return next();

		// Optional check for tenant status even in optionalVerifyToken
		if (user.tenantId && user.role !== 'super_admin') {
			const tenant = await Tenant.findById(user.tenantId);
			if (tenant && !tenant.isActive) {
				// We don't block access here as it's optional, but we don't set req.user either
				// Or we can just let it pass but not set tenantId
				return next();
			}
		}

		req.userId = decoded.userId;
		req.user = user;
		// Only set tenantId if they are admin/staff, so customers (even if logged in) can see all products
		if (user.role === 'tenant_admin' || user.role === 'tenant_staff') {
			req.tenantId = user.tenantId;
		}

		next();
	} catch (error) {
		next();
	}
};