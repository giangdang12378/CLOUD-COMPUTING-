import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminHeader from "../../components/admin/AdminHeader";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Calendar,
  Mail,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const CustomerManagementPage = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
  });

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // UI states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        sortBy: sortBy,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/customers?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer detail
  const fetchCustomerDetail = async (customerId) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customer detail");
      }

      const data = await response.json();
      if (data.success) {
        setSelectedCustomer(data.customer);
        setShowCustomerDetail(true);
      }
    } catch (error) {
      console.error("Error fetching customer detail:", error);
      toast.error("Không thể tải thông tin chi tiết khách hàng");
    }
  };

  // Update customer
  const updateCustomer = async (customerId, updateData) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchCustomers();
        setShowEditModal(false);
        setEditingCustomer(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Không thể cập nhật thông tin khách hàng");
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId, customerName) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn vô hiệu hóa tài khoản của ${customerName}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchCustomers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Không thể xóa khách hàng");
    }
  };

  // Restore customer
  const restoreCustomer = async (customerId, customerName) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/restore`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchCustomers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error restoring customer:", error);
      toast.error("Không thể khôi phục khách hàng");
    }
  };

  // Effects
  useEffect(() => {
    fetchCustomers();
  }, [currentPage, statusFilter, sortBy, dateFrom, dateTo]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || searchTerm === "") {
        setCurrentPage(1);
        fetchCustomers();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Format helpers
  const formatDate = (date) => {
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (isVerified) => {
    return isVerified ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3 mr-1" />
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <UserX className="w-3 h-3 mr-1" />
        Không hoạt động
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 lg:pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Quản lý khách hàng
              </h1>
              <p className="text-gray-600 mt-2">
                Quản lý thông tin và hoạt động của khách hàng
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Tổng khách hàng
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCustomers?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Đang hoạt động
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeCustomers?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Không hoạt động
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.inactiveCustomers?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
              <option value="email_asc">Email A-Z</option>
              <option value="email_desc">Email Z-A</option>
            </select>

            {/* Date From */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Từ ngày"
            />

            {/* Date To */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Đến ngày"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Đang tải...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy khách hàng
              </h3>
              <p className="text-gray-600">
                Thử thay đổi bộ lọc để xem kết quả khác
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thống kê
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tham gia
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer, index) => (
                      <motion.tr
                        key={customer._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {customer.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name || "Chưa có tên"}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                {customer.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(customer.isVerified)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <ShoppingBag className="w-4 h-4 mr-1 text-gray-400" />
                              {customer.stats?.totalOrders || 0} đơn hàng
                            </div>
                            <div className="flex items-center mt-1">
                              <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                              {formatCurrency(customer.stats?.totalSpent || 0)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(customer.createdAt)}
                          </div>
                          {customer.stats?.lastOrderDate && (
                            <div className="text-xs text-gray-500">
                              Mua hàng cuối:{" "}
                              {formatDate(customer.stats.lastOrderDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => fetchCustomerDetail(customer._id)}
                              className="text-blue-600 hover:text-blue-700 p-1 rounded"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCustomer(customer);
                                setShowEditModal(true);
                              }}
                              className="text-green-600 hover:text-green-700 p-1 rounded"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {customer.isVerified ? (
                              <button
                                onClick={() =>
                                  deleteCustomer(customer._id, customer.name)
                                }
                                className="text-red-600 hover:text-red-700 p-1 rounded"
                                title="Vô hiệu hóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  restoreCustomer(customer._id, customer.name)
                                }
                                className="text-orange-600 hover:text-orange-700 p-1 rounded"
                                title="Khôi phục"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Hiển thị{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * 10 + 1}
                        </span>{" "}
                        -{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * 10, stats.totalCustomers)}
                        </span>{" "}
                        trong{" "}
                        <span className="font-medium">
                          {stats.totalCustomers}
                        </span>{" "}
                        kết quả
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Customer Detail Modal */}
        {/* Customer Detail Modal */}
        {showCustomerDetail && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Chi tiết khách hàng
                </h2>
                <button
                  onClick={() => setShowCustomerDetail(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Customer Info Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  {/* Customer Profile Card */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {selectedCustomer.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="ml-3 overflow-hidden">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {selectedCustomer.name || "Chưa có tên"}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {selectedCustomer.email}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Trạng thái:</span>
                        <span>
                          {getStatusBadge(selectedCustomer.isVerified)}
                        </span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ngày tham gia:</span>
                        </div>
                        <span className="text-right text-xs">
                          {formatDate(selectedCustomer.createdAt)}
                        </span>
                      </div>
                      {selectedCustomer.lastLogin && (
                        <div className="flex flex-col space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Lần cuối online:
                            </span>
                          </div>
                          <span className="text-right text-xs">
                            {formatDate(selectedCustomer.lastLogin)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Stats Card */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Thống kê đơn hàng
                    </h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Tổng đơn hàng:</span>
                        <span className="font-semibold text-lg">
                          {selectedCustomer.stats?.totalOrders || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Tổng chi tiêu:</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            selectedCustomer.stats?.totalSpent || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Trung bình/đơn:</span>
                        <span className="font-semibold">
                          {formatCurrency(
                            selectedCustomer.stats?.avgOrderValue || 0
                          )}
                        </span>
                      </div>
                      {selectedCustomer.stats?.firstOrderDate && (
                        <div className="flex flex-col space-y-1 pt-1">
                          <span className="text-gray-500">Đơn đầu tiên:</span>
                          <span className="text-xs">
                            {formatDate(selectedCustomer.stats.firstOrderDate)}
                          </span>
                        </div>
                      )}
                      {selectedCustomer.stats?.lastOrderDate && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-500">Đơn cuối:</span>
                          <span className="text-xs">
                            {formatDate(selectedCustomer.stats.lastOrderDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Status Breakdown Card */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Trạng thái đơn hàng
                    </h4>
                    <div className="space-y-2.5 text-sm">
                      {Object.entries(
                        selectedCustomer.stats?.orderStatusBreakdown || {}
                      ).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-500 capitalize">
                            {status === "pending"
                              ? "Chờ xử lý"
                              : status === "processing"
                              ? "Đang xử lý"
                              : status === "delivered"
                              ? "Đã giao"
                              : status === "cancelled"
                              ? "Đã hủy"
                              : status}
                            :
                          </span>
                          <span className="font-semibold text-lg">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Orders Section */}
                {selectedCustomer.orderHistory &&
                  selectedCustomer.orderHistory.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-3">
                        Đơn hàng gần đây
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Mã đơn
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Ngày
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Tổng tiền
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trạng thái
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedCustomer.orderHistory
                              .slice(0, 5)
                              .map((order) => (
                                <tr
                                  key={order._id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                                    #{order._id.slice(-8)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(order.createdAt)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(order.totalAmount)}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        order.status === "delivered"
                                          ? "bg-green-100 text-green-800"
                                          : order.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : order.status === "cancelled"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {order.status === "pending"
                                        ? "Chờ xử lý"
                                        : order.status === "processing"
                                        ? "Đang xử lý"
                                        : order.status === "delivered"
                                        ? "Đã giao"
                                        : order.status === "cancelled"
                                        ? "Đã hủy"
                                        : order.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && editingCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updateData = {
                    name: formData.get("name"),
                    email: formData.get("email"),
                    isVerified: formData.get("isVerified") === "true",
                  };
                  updateCustomer(editingCustomer._id, updateData);
                }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Chỉnh sửa khách hàng
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingCustomer(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên khách hàng
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingCustomer.name || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingCustomer.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        name="isVerified"
                        defaultValue={editingCustomer.isVerified}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={true}>Hoạt động</option>
                        <option value={false}>Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCustomer(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagementPage;
