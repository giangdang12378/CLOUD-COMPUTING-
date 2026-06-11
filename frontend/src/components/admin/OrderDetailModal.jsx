import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react";

const OrderDetailModal = ({ order, onClose, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status || "");
      setSelectedPaymentStatus(order.paymentStatus || "");
      setSelectedPaymentMethod(order.paymentMethod || "");
    }
  }, [order]);

  if (!order) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "processing":
        return <Package className="w-5 h-5 text-orange-600" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      shipped: "Đã gửi",
      delivered: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-orange-100 text-orange-800 border-orange-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const availableStatuses = [
    { value: "delivered", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  const paymentStatuses = [
    { value: "pending", label: "Chờ thanh toán" },
    { value: "paid", label: "Đã thanh toán" },
    { value: "failed", label: "Thất bại" },
    { value: "refunded", label: "Đã hoàn tiền" },
  ];

  const paymentMethods = [
    { value: "cod", label: "Tiền mặt" },
    { value: "bank_transfer", label: "Chuyển khoản" },
  ];

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(order._id, {
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
        paymentMethod: selectedPaymentMethod,
      }, statusNote);
      setStatusNote("");
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getImageUrl = (item) => {
    const fallback = "http://localhost:4173/placeholder-product.jpg";

    // Lấy image từ nhiều nguồn có thể
    const image = item.image || item._doc?.image || item.productId?.image;
    console.log("Image path:", image); // Debug image path

    if (!image) return fallback;

    // Nếu image đã là đường dẫn đầy đủ
    if (image.startsWith("http")) {
      return image;
    }

    // Xử lý đường dẫn image (loại bỏ / ở đầu nếu có và chuyển \ thành /)
    const cleanPath = image.replace(/\\/g, "/").replace(/^\/+/, "");
    const fullUrl = `http://localhost:4173/${cleanPath}`;
    console.log("Final image URL:", fullUrl); // Debug final URL

    return fullUrl;
  };

  // Function to get product name from various possible sources
  const getProductName = (item) => {
    // Dữ liệu có thể nằm ở item hoặc item._doc
    return (
      item.productName || item._doc?.productName || "Sản phẩm không xác định"
    );
  };

  // Function to get value from mongoose document
  const getValue = (item, field) => {
    return item[field] ?? item._doc?.[field] ?? 0;
  };

  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Chi tiết đơn hàng
            </h2>
            <p className="text-sm text-gray-600">{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status & Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thông tin đơn hàng
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-2">{getStatusText(order.status)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Ngày đặt:</span>
                    <p className="font-medium">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Phương thức thanh toán:
                    </span>
                    <p className="font-medium">
                      {order.paymentMethod === "cod"
                        ? "Thanh toán khi nhận hàng"
                        : order.paymentMethod === "bank_transfer"
                        ? "Chuyển khoản ngân hàng"
                        : order.paymentMethod === "e_wallet"
                        ? "Ví điện tử"
                        : order.paymentMethod}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Trạng thái thanh toán:
                    </span>
                    <p className="font-medium">
                      {order.paymentStatus === "pending"
                        ? "Chờ thanh toán"
                        : order.paymentStatus === "paid"
                        ? "Đã thanh toán"
                        : order.paymentStatus === "failed"
                        ? "Thất bại"
                        : order.paymentStatus === "refunded"
                        ? "Đã hoàn tiền"
                        : order.paymentStatus}
                    </p>
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <span className="text-gray-600">Dự kiến giao:</span>
                      <p className="font-medium">
                        {new Date(order.estimatedDelivery).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Sản phẩm ({order.items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => {
                    const productName = getProductName(item);

                    return (
                      <div
                        key={index}
                        className="flex items-center p-3 border border-gray-200 rounded-lg"
                      >
                        <img
                          src={getImageUrl(item)}
                          alt={productName}
                          className="w-16 h-16 object-cover rounded-lg mr-4"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {productName}
                          </h4>
                          {item.variant &&
                            (item.variant.color || item.variant.size) && (
                              <p className="text-sm text-gray-600">
                                {item.variant.color &&
                                  `Màu: ${item.variant.color}`}
                                {item.variant.color &&
                                  item.variant.size &&
                                  " - "}
                                {item.variant.size &&
                                  `Size: ${item.variant.size}`}
                              </p>
                            )}
                          <p className="text-sm text-gray-600">
                            Số lượng: {getValue(item, "quantity")}
                          </p>
                          <p className="font-medium text-gray-900">
                            {(
                              getValue(item, "price") *
                              getValue(item, "quantity")
                            ).toLocaleString("vi-VN")}
                            đ
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Lịch sử trạng thái
                  </h3>
                  <div className="space-y-3">
                    {order.statusHistory.map((history, index) => (
                      <div
                        key={index}
                        className="flex items-start p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 mr-3">
                          {getStatusIcon(history.status)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {getStatusText(history.status)}
                          </p>
                          {history.note && (
                            <p className="text-sm text-gray-600">
                              {history.note}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(history.timestamp).toLocaleString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Thông tin khách hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tên:</span>
                    <p className="font-medium">{order.customerInfo?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{order.customerInfo?.email}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Địa chỉ giao hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {order.shippingAddress?.fullName}
                  </p>
                  <p>{order.shippingAddress?.phone}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress?.address},{" "}
                    {order.shippingAddress?.ward},{" "}
                    {order.shippingAddress?.district},{" "}
                    {order.shippingAddress?.city}
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Tổng kết đơn hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span>
                      {(typeof order.totalAmount === "number"
                        ? order.totalAmount
                        : 0
                      ).toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {(typeof order.shippingFee === "number"
                        ? order.shippingFee
                        : 0
                      ).toLocaleString("vi-VN")}
                      đ
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>
                        -
                        {(typeof order.discountAmount === "number"
                          ? order.discountAmount
                          : 0
                        ).toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Tổng cộng:</span>
                      <span>
                        {typeof order.finalAmount === "number"
                          ? order.finalAmount.toLocaleString("vi-VN")
                          : "0"}
                        đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Order Panel */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 shadow-sm mt-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Cập nhật đơn hàng
                </h3>
                <div className="space-y-4 font-sans">
                  {/* Select 1: Order Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      TRẠNG THÁI ĐƠN HÀNG
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 text-sm"
                    >
                      {availableStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select 2: Payment Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      TRẠNG THÁI THANH TOÁN
                    </label>
                    <select
                      value={selectedPaymentStatus}
                      onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 text-sm"
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select 3: Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      PHƯƠNG THỨC THANH TOÁN
                    </label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 text-sm"
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Note input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      GHI CHÚ CẬP NHẬT
                    </label>
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Nhập ghi chú thay đổi..."
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows="2"
                    />
                  </div>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isUpdatingStatus ? "Đang cập nhật..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>



              {/* Notes */}
              {order.notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ghi chú
                  </h3>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
