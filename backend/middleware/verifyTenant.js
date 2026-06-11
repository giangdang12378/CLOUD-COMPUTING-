export const verifyTenant = (req, res, next) => {
    if (!req.tenantId) {
        // Allow super_admin to bypass tenant check if they need to manage resources globally
        if (req.user && req.user.role === 'super_admin') {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: "Access Denied: You do not belong to any tenant."
        });
    }
    next();
};

export const verifyRole = (...roles) => {
    return (req, res, next) => {
        // Flatten in case an array was passed: verifyRole(['admin', 'user']) instead of verifyRole('admin', 'user')
        const allowedRoles = roles.flat();
        
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access Denied: You do not have permission to perform this action."
            });
        }
        next();
    };
};
