// utils/helpers.js

// Format price to Vietnamese currency
export const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

// Format date to Vietnamese format
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format date to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
    } else {
        return formatDate(dateString);
    }
};

// Format order status to Vietnamese
export const formatOrderStatus = (status) => {
    const statusMap = {
        pending: 'Chờ xử lý',
        confirmed: 'Đã xác nhận',
        shipped: 'Đang giao hàng',
        delivered: 'Hoàn thành',
        cancelled: 'Đã hủy',
    };

    return statusMap[status] || 'Không xác định';
};

// Format payment status to Vietnamese
export const formatPaymentStatus = (status) => {
    const statusMap = {
        pending: 'Chờ thanh toán',
        paid: 'Đã thanh toán',
        failed: 'Thanh toán thất bại',
        refunded: 'Đã hoàn tiền',
    };

    return statusMap[status] || 'Không xác định';
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Generate random order ID for display
export const generateOrderId = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Validate email format
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone number (Vietnamese format)
export const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Calculate discount percentage
export const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    if (!originalPrice || !discountedPrice) return 0;
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// Format file size
export const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function for search
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Get order status color class
export const getOrderStatusColor = (status) => {
    const colorMap = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Get payment status color class
export const getPaymentStatusColor = (status) => {
    const colorMap = {
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
        refunded: 'bg-gray-100 text-gray-800',
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Calculate total items in cart
export const calculateCartTotal = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0;

    return cartItems.reduce((total, item) => {
        return total + (item.quantity * item.price);
    }, 0);
};

// Calculate total quantity in cart
export const calculateCartQuantity = (cartItems) => {
    if (!Array.isArray(cartItems)) return 0;

    return cartItems.reduce((total, item) => {
        return total + item.quantity;
    }, 0);
};

// Check if product is in stock
export const isInStock = (product) => {
    return product && product.inventory > 0 && product.status === 'available';
};

// Format inventory status
export const formatInventoryStatus = (inventory) => {
    if (inventory <= 0) return { text: 'Hết hàng', color: 'text-red-600' };
    if (inventory <= 5) return { text: `Còn ${inventory} sản phẩm`, color: 'text-orange-600' };
    return { text: 'Còn hàng', color: 'text-green-600' };
};

