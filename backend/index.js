import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

import { verifyTenant } from './middleware/verifyTenant.js';

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import orderRoutes from "./routes/order.route.js";
import customerRoutes from "./routes/customer.route.js";
import paymentRoutes from "./routes/payment.route.js";
import tenantRoutes from "./routes/tenant.route.js";
import userRoutes from "./routes/user.route.js";
import staffRoutes from "./routes/staff.route.js";
import discountRoutes from "./routes/discount.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4173;

// Để sử dụng __dirname trong ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo biến cho thư mục gốc của project
const projectRoot = path.resolve(__dirname, '..');

// Xác định các thư mục có thể chứa uploads
const uploadsInBackend = path.join(__dirname, 'uploads');
const uploadsInRoot = path.join(projectRoot, 'uploads');
const uploadsInCwd = path.join(process.cwd(), 'uploads');

console.log('🔍 Checking uploads locations:');
console.log(' - Backend uploads:', uploadsInBackend, fs.existsSync(uploadsInBackend) ? '✅ Exists' : '❌ Not found');
console.log(' - Root uploads:', uploadsInRoot, fs.existsSync(uploadsInRoot) ? '✅ Exists' : '❌ Not found');
console.log(' - CWD uploads:', uploadsInCwd, fs.existsSync(uploadsInCwd) ? '✅ Exists' : '❌ Not found');

// Xác định thư mục uploads thực tế để sử dụng, ưu tiên thư mục đang chứa files
let actualUploadsDir = null;

if (fs.existsSync(uploadsInCwd) && fs.readdirSync(uploadsInCwd).length > 0) {
    actualUploadsDir = uploadsInCwd;
} else if (fs.existsSync(uploadsInRoot) && fs.readdirSync(uploadsInRoot).length > 0) {
    actualUploadsDir = uploadsInRoot;
} else if (fs.existsSync(uploadsInBackend) && fs.readdirSync(uploadsInBackend).length > 0) {
    actualUploadsDir = uploadsInBackend;
} else {
    // Nếu không thư mục nào có files, ưu tiên thư mục hiện tại
    actualUploadsDir = fs.existsSync(uploadsInCwd) ? uploadsInCwd :
        (fs.existsSync(uploadsInRoot) ? uploadsInRoot :
            (fs.existsSync(uploadsInBackend) ? uploadsInBackend : uploadsInCwd));
}

// Tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(actualUploadsDir)) {
    fs.mkdirSync(actualUploadsDir, { recursive: true });
    console.log('✅ Created uploads directory:', actualUploadsDir);
}

// Tạo thư mục public
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Created public directory:', publicDir);
}

// Tạo placeholder image SVG
const placeholderPath = path.join(publicDir, 'placeholder-product.jpg');
if (!fs.existsSync(placeholderPath)) {
    try {
        const svgContent = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  <text x="150" y="140" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle">No Image</text>
  <text x="150" y="170" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle">Available</text>
</svg>`;
        fs.writeFileSync(placeholderPath, svgContent);
        console.log('✅ Created placeholder image');
    } catch (error) {
        console.log('⚠️  Could not create placeholder image:', error.message);
    }
}

console.log('📁 Using uploads directory:', actualUploadsDir);
console.log('📁 Uploads directory exists:', fs.existsSync(actualUploadsDir));
console.log('📁 Public directory:', publicDir);
console.log('📁 Public directory exists:', fs.existsSync(publicDir));

// Security middleware
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
}));

// CORS configuration
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===== THÊM ROUTE MỚI: direct-image để truy cập hình ảnh trực tiếp =====
app.get('/direct-image/:filename', (req, res) => {
    const filename = req.params.filename;
    console.log('🔍 Direct image request for:', filename);

    // Tìm file ở tất cả các vị trí có thể
    const possiblePaths = [
        path.join(uploadsInCwd, filename),
        path.join(uploadsInRoot, filename),
        path.join(uploadsInBackend, filename),
        path.join(process.cwd(), 'uploads', filename),
        path.join(__dirname, 'uploads', filename)
    ];

    // Tìm đường dẫn đầu tiên tồn tại
    for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            console.log('✅ File found at:', p);
            console.log('✅ Sending file directly');
            return res.sendFile(p);
        }
    }

    console.log('❌ File not found in any location:', filename);
    return res.redirect('/placeholder-product.jpg');
});

// QUAN TRỌNG: Cấu hình static files để phục vụ từ TẤT CẢ các vị trí có thể
app.use('/uploads', (req, res, next) => {
    console.log('🖼️  Static file request:', req.url);

    if (!req.url || req.url === '/') {
        return next();
    }

    const filename = req.url.startsWith('/') ? req.url.substring(1) : req.url;

    // Kiểm tra tất cả các vị trí có thể chứa file
    const possiblePaths = [
        path.join(uploadsInCwd, filename),
        path.join(uploadsInRoot, filename),
        path.join(uploadsInBackend, filename),
        path.join(process.cwd(), 'uploads', filename),
        path.join(__dirname, 'uploads', filename)
    ];

    // Tìm và phục vụ file từ vị trí đầu tiên tìm thấy
    for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            console.log('✅ File found at:', p);
            return res.sendFile(p);
        }
    }

    console.log('❌ File not found in any location:', filename);
    next();
}, express.static(actualUploadsDir, {
    maxAge: '1d',
    etag: false
}));

// Cấu hình phụ để phục vụ từ tất cả các thư mục uploads có thể có
if (fs.existsSync(uploadsInBackend) && actualUploadsDir !== uploadsInBackend) {
    app.use('/uploads', express.static(uploadsInBackend));
}

if (fs.existsSync(uploadsInRoot) && actualUploadsDir !== uploadsInRoot) {
    app.use('/uploads', express.static(uploadsInRoot));
}

if (fs.existsSync(uploadsInCwd) && actualUploadsDir !== uploadsInCwd) {
    app.use('/uploads', express.static(uploadsInCwd));
}

// Middleware để xử lý đường dẫn image trực tiếp (không có tiền tố /uploads)
app.get(/^\/image-.*/, (req, res) => {
    console.log('🔄 Redirecting image request to direct-image:', req.path);
    // Chuyển hướng đến direct-image endpoint thay vì /uploads
    const filename = req.path.substring(1); // Bỏ dấu / ở đầu
    res.redirect(`/direct-image/${filename}`);
});

// Phục vụ static files từ public directory
app.use(express.static(publicDir, {
    maxAge: '1d'
}));

// Placeholder endpoint với SVG động
app.get('/placeholder-product.jpg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  <text x="150" y="140" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle">No Image</text>
  <text x="150" y="170" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle">Available</text>
</svg>`);
});

// Logging middleware cho API requests
app.use('/api', (req, res, next) => {
    console.log(`🔗 API Request: ${req.method} ${req.url}`);
    console.log('🍪 Cookies:', Object.keys(req.cookies || {}).length > 0 ? 'Present' : 'None');
    console.log('🔑 Headers Auth:', req.headers.authorization ? 'Present' : 'None');
    next();
});

// API Routes
// Tenant middleware: skip auth routes so registration/login remain public
app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/auth')) return next();
    return verifyTenant(req, res, next);
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/staffs", staffRoutes);
app.use("/api/discounts", discountRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uploadsDir: actualUploadsDir,
        publicDir: publicDir,
        uploadsExists: fs.existsSync(actualUploadsDir),
        publicExists: fs.existsSync(publicDir)
    });
});

// Debug endpoint để list files trong uploads
app.get('/api/debug/uploads', (req, res) => {
    try {
        const files = fs.existsSync(actualUploadsDir) ? fs.readdirSync(actualUploadsDir) : [];
        res.json({
            uploadsDir: actualUploadsDir,
            files: files.map(file => ({
                name: file,
                url: `http://localhost:${PORT}/uploads/${file}`,
                directUrl: `http://localhost:${PORT}/direct-image/${file}`,
                exists: fs.existsSync(path.join(actualUploadsDir, file))
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint để kiểm tra tất cả vị trí uploads
app.get('/api/debug/all-uploads', (req, res) => {
    try {
        const backendFiles = fs.existsSync(uploadsInBackend) ? fs.readdirSync(uploadsInBackend) : [];
        const rootFiles = fs.existsSync(uploadsInRoot) ? fs.readdirSync(uploadsInRoot) : [];
        const cwdFiles = fs.existsSync(uploadsInCwd) ? fs.readdirSync(uploadsInCwd) : [];

        res.json({
            backendUploads: {
                path: uploadsInBackend,
                exists: fs.existsSync(uploadsInBackend),
                files: backendFiles.map(file => ({
                    name: file,
                    url: `http://localhost:${PORT}/uploads/${file}`,
                    directUrl: `http://localhost:${PORT}/direct-image/${file}`,
                    exists: fs.existsSync(path.join(uploadsInBackend, file))
                }))
            },
            rootUploads: {
                path: uploadsInRoot,
                exists: fs.existsSync(uploadsInRoot),
                files: rootFiles.map(file => ({
                    name: file,
                    url: `http://localhost:${PORT}/uploads/${file}`,
                    directUrl: `http://localhost:${PORT}/direct-image/${file}`,
                    exists: fs.existsSync(path.join(uploadsInRoot, file))
                }))
            },
            cwdUploads: {
                path: uploadsInCwd,
                exists: fs.existsSync(uploadsInCwd),
                files: cwdFiles.map(file => ({
                    name: file,
                    url: `http://localhost:${PORT}/uploads/${file}`,
                    directUrl: `http://localhost:${PORT}/direct-image/${file}`,
                    exists: fs.existsSync(path.join(uploadsInCwd, file))
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint để kiểm tra chi tiết về một file cụ thể
app.get('/api/debug/check-image/:filename', (req, res) => {
    const filename = req.params.filename;
    const possiblePaths = [
        { name: 'uploadsInBackend', path: path.join(uploadsInBackend, filename) },
        { name: 'uploadsInRoot', path: path.join(uploadsInRoot, filename) },
        { name: 'uploadsInCwd', path: path.join(uploadsInCwd, filename) },
        { name: 'process.cwd/uploads', path: path.join(process.cwd(), 'uploads', filename) },
        { name: '__dirname/uploads', path: path.join(__dirname, 'uploads', filename) }
    ];

    const results = possiblePaths.map(p => ({
        location: p.name,
        path: p.path,
        exists: fs.existsSync(p.path),
        isFile: fs.existsSync(p.path) && fs.statSync(p.path).isFile(),
        size: fs.existsSync(p.path) && fs.statSync(p.path).isFile() ? fs.statSync(p.path).size : null
    }));

    res.json({
        filename,
        imageUrl: `/uploads/${filename}`,
        directImageUrl: `/direct-image/${filename}`,
        possibleLocations: results,
        checkUrls: {
            normal: `http://localhost:${PORT}/uploads/${filename}`,
            direct: `http://localhost:${PORT}/direct-image/${filename}`,
            debug: `http://localhost:${PORT}/debug-image/${filename}`
        }
    });
});

// Middleware đặc biệt để phục vụ hình ảnh debug
app.get('/debug-image/:filename', (req, res) => {
    const filename = req.params.filename;
    const possiblePaths = [
        path.join(uploadsInCwd, filename),
        path.join(uploadsInRoot, filename),
        path.join(uploadsInBackend, filename),
        path.join(process.cwd(), 'uploads', filename),
        path.join(__dirname, 'uploads', filename)
    ];

    // Tìm đường dẫn đầu tiên tồn tại
    for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            console.log('✅ File found at:', p);
            return res.sendFile(p);
        }
    }

    // Trả về placeholder image
    console.log('❌ File not found in any location, using placeholder');
    res.redirect('/placeholder-product.jpg');
});

// Production static files
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

// Middleware cho việc xử lý ảnh không tìm thấy - đặt SAU tất cả các routes khác
app.use((req, res, next) => {
    if (req.path.startsWith('/uploads/')) {
        console.log('❌ Image not found:', req.path);
        return res.redirect('/placeholder-product.jpg');
    }
    next();
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('❌ Global error:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

app.listen(PORT, () => {
    console.log('🚀 Server running on port:', PORT);
    console.log('📊 Connected to AWS RDS via Prisma ORM');
    console.log('🔑 Tenant Middleware active');
    console.log(" Uploads directory accessible at: http://localhost:" + PORT + "/uploads");
    console.log(" Placeholder image accessible at: http://localhost:" + PORT + "/placeholder-product.jpg");
    console.log(" Health check available at: http://localhost:" + PORT + "/api/health");
    console.log(" Debug uploads list at: http://localhost:" + PORT + "/api/debug/uploads");

    // Test uploads directory
    if (fs.existsSync(actualUploadsDir)) {
        const files = fs.readdirSync(actualUploadsDir);
        console.log("📋 Files in uploads directory:", files.length ? files : 'No files');
    }
});