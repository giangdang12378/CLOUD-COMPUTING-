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
      // Neu status la legacy (pending/processing/shipped), default sang delivered de user co the chon
      const legacyStatus = ["pending", "processing", "shipped"].includes(order.status);
      setSelectedStatus(legacyStatus ? "delivered" : (order.status || "delivered"));
      setSelectedPaymentStatus(order.paymentStatus || "pending");
      // Dropdown chi co cod / bank_transfer, neu don dang payos thi default sang cod (user co the doi)
      const validMethods = ["cod", "bank_transfer"];
      setSelectedPaymentMethod(validMethods.includes(order.paymentMethod) ? order.paymentMethod : "cod");
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
      pending: "Chờ thanh toán",
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
  ];

  const paymentMethods = [
    { value: "cod", label: "Tiền mặt" },
    { value: "bank_transfer", label: "Chuyển khoản" },
  ];

  // Auto-sync UI: chon tien mat -> luon set delivered/paid
  const handlePaymentMethodChange = (e) => {
    const newMethod = e.target.value;
    setSelectedPaymentMethod(newMethod);
    if (newMethod === "cod") {
      setSelectedStatus("delivered");
      setSelectedPaymentStatus("paid");
    }
  };

  // Auto-sync UI: khi user chon status -> tu dong set paymentStatus tuong ung
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    if (newStatus === "delivered") {
      setSelectedPaymentStatus("paid");
    } else if (newStatus === "cancelled") {
      setSelectedPaymentStatus("failed");
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(
        order._id,
        {
          status: selectedStatus,
          paymentStatus: selectedPaymentStatus,
          paymentMethod: selectedPaymentMethod,
        },
        statusNote
      );
      setStatusNote("");
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getImageUrl = (item) => {
    const fallback = `${import.meta.env.VITE_API_URL || ""}/placeholder-product.jpg`;
    const image = item.image || item._doc?.image || item.productId?.image;
    if (!image) return fallback;
    if (image.startsWith("http")) {
      return image;
    }
    const cleanPath = image.replace(/\\/g, "/").replace(/^\/+/, "");
    return `${import.meta.env.VITE_API_URL || ""}/${cleanPath}`;
  };

  const getProductName = (item) => {
    return (
      item.product?.productName ||
      item.productName ||
      item._doc?.productName ||
      "Sản phẩm không xác định"
    );
  };

  const getValue = (item, field) => {
    return item[field] ?? item._doc?.[field] ?? 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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
                        ? "Tiền mặt"
                        : order.paymentMethod === "bank_transfer"
                        ? "Chuyển khoản ngân hàng"
                        : order.paymentMethod === "payos"
                        ? "PayOS"
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
                        : order.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>

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
            </div>

            <div className="space-y-6">
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

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Tổng kết đơn hàng
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span>
                      {Number(order.totalAmount || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {Number(order.shippingFee || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>
                        -{Number(order.discountAmount).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Tổng cộng:</span>
                      <span>
                        {Number(order.finalAmount || 0).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 shadow-sm mt-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Cập nhật đơn hàng
                </h3>
                <div className="space-y-4 font-sans">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      TRẠNG THÁI ĐƠN HÀNG
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={handleStatusChange}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 text-sm"
                    >
                      {availableStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

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

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      PHƯƠNG THỨC THANH TOÁN
                    </label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={handlePaymentMethodChange}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 text-sm"
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    {selectedPaymentMethod === "cod" && (
                      <p className="text-xs text-blue-700 mt-1 italic">
                        Tiền mặt: đơn hàng tự động chuyển sang Hoàn thành + Đã thanh toán
                      </p>
                    )}
                  </div>

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
