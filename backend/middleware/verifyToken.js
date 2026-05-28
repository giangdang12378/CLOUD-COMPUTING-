import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const verifyToken = async (req, res, next) => {
  try {
    console.log("🔍 Auth middleware called for:", req.method, req.url);
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized - no token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, tenantId: true, isVerified: true }
    });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    if (user.tenantId && user.role !== "super_admin") {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      if (tenant && !tenant.isActive) {
        return res.status(403).json({ success: false, message: "Tenant account is locked", isLocked: true });
      }
    }
    req.userId = user.id;
    req.user = user;
    req.tenantId = user.tenantId;
    console.log("tenantId resolved:", user.tenantId);
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired - please login again" });
    }
    return res.status(401).json({ success: false, message: "Unauthorized - token verification failed" });
  }
};

export const optionalVerifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, tenantId: true }
    });
    if (!user) return next();
    req.userId = user.id;
    req.user = user;
    if (user.role === "tenant_admin" || user.role === "tenant_staff") {
      req.tenantId = user.tenantId;
    }
    next();
  } catch (error) {
    next();
  }
};
