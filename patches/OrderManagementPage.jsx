import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import OrderTable from "../../components/admin/OrderTable";
import OrderDetailModal from "../../components/admin/OrderDetailModal";
import { Package, DollarSign, TrendingUp, XCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const API_URL = `${import.meta.env.VITE_API_URL || ""}/api/orders`;

const TABS = [
  { key: "all", label: "Tất cả", color: "bg-blue-600" },
  { key: "delivered", label: "Hoàn thành", color: "bg-green-600" },
  { key: "cancelled", label: "Đã hủy", color: "bg-red-600" },
];

const OrderManagementPage = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({});

  // Filters
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const isStaff = user?.role === 'tenant_staff';

  // Build query parameters
  const buildQueryParams = (page = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      sortBy,
    });

    if (search) params.append("search", search);
    if (activeTab !== "all") params.append("status", activeTab);
    if (dateRange.start) params.append("startDate", dateRange.start);
    if (dateRange.end) params.append("endDate", dateRange.end);

    return params.toString();
  };

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams(page);
      const response = await fetch(`${API_URL}?${queryParams}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.orders) {
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        setOrders([]);
        setPagination({});
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics
  const fetchStats = async () => {
    if (isStaff) return; // Staff không có quyền xem stats
    try {
      const response = await fetch(`${API_URL}/admin/stats?period=30`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(1);
  }, [search, activeTab, sortBy, dateRange]);

  useEffect(() => {
    fetchOrders();
    if (!isStaff) fetchStats();
  }, [isStaff]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchOrders(page);
  };

  // Update order status
  const handleUpdateStatus = async (orderId, updates, note = "") => {
    try {
      const body = typeof updates === "string" ? { status: updates, note } : { ...updates, note };
      const response = await fetch(`${API_URL}/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        fetchOrders(currentPage);
        if (!isStaff) fetchStats();
        if (selectedOrder && selectedOrder._id === orderId) {
          const updatedOrder = await response.json();
          setSelectedOrder(updatedOrder.order);
        }
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  // View order details
  const handleViewDetails = async (order) => {
    try {
      const response = await fetch(`${API_URL}/${order._id}`, {
        credentials: "include",
      });
      const detailData = await response.json();
      setSelectedOrder(detailData);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  // Get status stats for display
  const getStatusCount = (status) => {
    if (!stats.statusBreakdown) return 0;
    const statusData = stats.statusBreakdown.find((s) => s._id === status);
    return statusData ? statusData.count : 0;
  };

  return (
    <>
      <AdminHeader />
      <div className="p-2 md:p-8 w-full max-w-7xl mx-auto pb-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý đơn hàng</h1>

        {/* Statistics Cards - Hidden for Staff */}
        {!isStaff && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.totalRevenue || 0).toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getStatusCount("delivered")}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Đã hủy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getStatusCount("cancelled")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow mb-6">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? `${tab.color} text-white`
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tab.label}{" "}
                {!isStaff && tab.key !== "all" && `(${getStatusCount(tab.key)})`}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, tên khách hàng, email, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="amount_desc">Giá trị cao</option>
                <option value="amount_asc">Giá trị thấp</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                title="Từ ngày"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                title="Đến ngày"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white">Đang tải...</div>
          </div>
        ) : (
          <OrderTable
            orders={orders}
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </nav>
          </div>
        )}

        {/* Pagination Info */}
        {pagination.totalOrders > 0 && (
          <div className="mt-4 text-center text-gray-300 text-sm">
            Hiển thị {orders.length} trong tổng số {pagination.totalOrders} đơn
            hàng (Trang {pagination.currentPage} / {pagination.totalPages})
          </div>
        )}

        {/* Order Detail Modal */}
        {showDetailModal && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedOrder(null);
            }}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </>
  );
};

export default OrderManagementPage;
