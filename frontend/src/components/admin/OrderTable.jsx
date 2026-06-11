import React from "react";
import { Eye, Edit, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";

const OrderTable = ({ orders, onViewDetails, onUpdateStatus }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "processing":
        return <Package className="w-4 h-4 text-orange-600" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-orange-100 text-orange-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (paymentStatus) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colorMap[paymentStatus] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusText = (paymentStatus) => {
    const statusMap = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thất bại",
      refunded: "Đã hoàn tiền",
    };
    return statusMap[paymentStatus] || paymentStatus;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: "processing",
      processing: "shipped",
      shipped: "delivered",
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return ["pending", "processing", "shipped"].includes(status);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có đơn hàng
        </h3>
        <p className="text-gray-600">Chưa có đơn hàng nào phù hợp với bộ lọc</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã đơn hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày đặt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thanh toán
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.items?.length || 0} sản phẩm
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.customerInfo?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.customerInfo?.email}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.shippingAddress?.phone}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  <div className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString("vi-VN")}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.finalAmount?.toLocaleString("vi-VN")}đ
                  </div>
                  {order.shippingFee > 0 && (
                    <div className="text-xs text-gray-500">
                      (+ {order.shippingFee?.toLocaleString("vi-VN")}đ ship)
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusText(order.status)}</span>
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                      order.paymentStatus
                    )}`}
                  >
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {order.paymentMethod === "cod"
                      ? "COD"
                      : order.paymentMethod === "bank_transfer"
                      ? "Chuyển khoản"
                      : order.paymentMethod === "e_wallet"
                      ? "Ví điện tử"
                      : order.paymentMethod}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(order)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onViewDetails(order)}
                      className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                      title="Chỉnh sửa đơn hàng"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
