import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminHeader from "../../components/admin/AdminHeader";
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  RotateCcw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Wallet,
  Building,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PaymentManagementPage = () => {
  // State management
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalRefunded: 0,
    completedAmount: 0,
    pendingAmount: 0,
    failedAmount: 0,
  });
  const [paymentStats, setPaymentStats] = useState(null);

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statsPeriod, setStatsPeriod] = useState("30d");

  // UI states
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        paymentMethod: paymentMethodFilter,
        sortBy: sortBy,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/payments?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment statistics
  const fetchPaymentStats = async () => {
    try {
      const response = await fetch(
        `/api/payments/stats?period=${statsPeriod}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment stats");
      }

      const data = await response.json();
      if (data.success) {
        setPaymentStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    }
  };

  // Fetch payment detail
  const fetchPaymentDetail = async (paymentId) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payment detail");
      }

      const data = await response.json();
      if (data.success) {
        setSelectedPayment(data.payment);
        setShowPaymentDetail(true);
      }
    } catch (error) {
      console.error("Error fetching payment detail:", error);
      toast.error("Không thể tải thông tin chi tiết thanh toán");
    }
  };

  // Process refund
  const processRefund = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) {
      toast.error("Vui lòng nhập đầy đủ thông tin hoàn tiền");
      return;
    }

    try {
      const response = await fetch(
        `/api/payments/${selectedPayment._id}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            refundAmount: parseFloat(refundAmount),
            reason: refundReason,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowRefundModal(false);
        setRefundAmount("");
        setRefundReason("");
        fetchPayments();
        fetchPaymentStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Không thể xử lý hoàn tiền");
    }
  };

  // Export payments
  const exportPayments = async (format = "csv") => {
    try {
      const params = new URLSearchParams({
        format,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/payments/export?${params}`, {
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        if (format === "csv") {
          // Convert JSON to CSV
          const csvData = data.data;
          const headers = Object.keys(csvData[0]);
          const csvContent = [
            headers.join(","),
            ...csvData.map((row) =>
              headers
                .map((header) => {
                  const value = row[header];
                  // Escape values containing commas or quotes
                  if (
                    typeof value === "string" &&
                    (value.includes(",") || value.includes('"'))
                  ) {
                    return `"${value.replace(/"/g, '""')}"`;
                  }
                  return value;
                })
                .join(",")
            ),
          ].join("\n");

          // Create blob and download
          const blob = new Blob(["\ufeff" + csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);

          const today = new Date().toISOString().split("T")[0];
          link.setAttribute("href", url);
          link.setAttribute("download", `payments_export_${today}.csv`);
          link.style.visibility = "hidden";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success("Xuất dữ liệu thành công!");
        } else {
          // For JSON format
          const blob = new Blob([JSON.stringify(data.payments, null, 2)], {
            type: "application/json",
          });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);

          const today = new Date().toISOString().split("T")[0];
          link.setAttribute("href", url);
          link.setAttribute("download", `payments_export_${today}.json`);
          link.style.visibility = "hidden";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success("Xuất dữ liệu thành công!");
        }
      }
    } catch (error) {
      console.error("Error exporting payments:", error);
      toast.error("Không thể xuất dữ liệu");
    }
  };

  // Effects
  useEffect(() => {
    fetchPayments();
  }, [
    currentPage,
    statusFilter,
    paymentMethodFilter,
    sortBy,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchPaymentStats();
  }, [statsPeriod]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || searchTerm === "") {
        setCurrentPage(1);
        fetchPayments();
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Chờ xử lý" },
      processing: { color: "bg-blue-100 text-blue-800", label: "Đang xử lý" },
      completed: { color: "bg-green-100 text-green-800", label: "Hoàn thành" },
      failed: { color: "bg-red-100 text-red-800", label: "Thất bại" },
      refunded: {
        color: "bg-purple-100 text-purple-800",
        label: "Đã hoàn tiền",
      },
      partially_refunded: {
        color: "bg-orange-100 text-orange-800",
        label: "Hoàn tiền một phần",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "credit_card":
      case "debit_card":
        return <CreditCard className="w-4 h-4" />;
      case "e_wallet":
        return <Wallet className="w-4 h-4" />;
      case "bank_transfer":
        return <Building className="w-4 h-4" />;
      case "cod":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      credit_card: "Thẻ tín dụng",
      debit_card: "Thẻ ghi nợ",
      e_wallet: "Ví điện tử",
      bank_transfer: "Chuyển khoản",
      cod: "Thanh toán khi nhận hàng",
    };
    return labels[method] || method;
  };

  // Chart colors
  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 lg:pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-600" />
                Quản lý thanh toán
              </h1>
              <p className="text-gray-600 mt-2">
                Theo dõi và quản lý các giao dịch thanh toán
              </p>
            </div>
            <button
              onClick={() => exportPayments("csv")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Tổng giao dịch
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
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
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.completedAmount)}
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
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang chờ</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Thất bại</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.failedAmount)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <RotateCcw className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hoàn tiền</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRefunded)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        {paymentStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Daily Revenue Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Doanh thu theo ngày
                </h3>
                <select
                  value={statsPeriod}
                  onChange={(e) => setStatsPeriod(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="7d">7 ngày</option>
                  <option value="30d">30 ngày</option>
                  <option value="90d">90 ngày</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={paymentStats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="_id.day"
                    tickFormatter={(value, index) => {
                      const item = paymentStats.dailyRevenue[index];
                      if (item) {
                        return `${item._id.day}/${item._id.month}`;
                      }
                      return value;
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return `${data._id.day}/${data._id.month}/${data._id.year}`;
                      }
                      return label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Phương thức thanh toán
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentStats.paymentMethodBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, amount }) =>
                      `${getPaymentMethodLabel(_id)}: ${formatCurrency(amount)}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {paymentStats.paymentMethodBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm mã giao dịch..."
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
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
              <option value="partially_refunded">Hoàn tiền một phần</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="credit_card">Thẻ tín dụng</option>
              <option value="debit_card">Thẻ ghi nợ</option>
              <option value="e_wallet">Ví điện tử</option>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="cod">COD</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="amount_asc">Số tiền tăng dần</option>
              <option value="amount_desc">Số tiền giảm dần</option>
            </select>

            {/* Date From */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Date To */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Đang tải...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy giao dịch
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
                        Mã giao dịch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phương thức
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment, index) => (
                      <motion.tr
                        key={payment._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {payment.transactionId}
                          </div>
                          <div className="text-xs text-gray-500">
                            Đơn hàng: {payment.orderId?.orderNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.userId?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.userId?.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <span className="mr-2">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </span>
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                          {payment.refundAmount > 0 && (
                            <div className="text-xs text-red-600">
                              Hoàn: {formatCurrency(payment.refundAmount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => fetchPaymentDetail(payment._id)}
                              className="text-blue-600 hover:text-blue-700 p-1 rounded"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {payment.status === "completed" &&
                              payment.refundAmount < payment.amount && (
                                <button
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setShowRefundModal(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-700 p-1 rounded"
                                  title="Hoàn tiền"
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
                          {Math.min(
                            currentPage * 10,
                            payments.length + (currentPage - 1) * 10
                          )}
                        </span>{" "}
                        trong{" "}
                        <span className="font-medium">
                          {stats.totalAmount > 0 ? "nhiều" : "0"}
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

        {/* Payment Detail Modal */}
        {showPaymentDetail && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Chi tiết giao dịch
                </h2>
                <button
                  onClick={() => setShowPaymentDetail(false)}
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

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Info */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Thông tin giao dịch
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mã giao dịch:</span>
                        <span className="font-mono">
                          {selectedPayment.transactionId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mã đơn hàng:</span>
                        <span>
                          {selectedPayment.orderId?.orderNumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phương thức:</span>
                        <span>
                          {getPaymentMethodLabel(selectedPayment.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedPayment.amount)}
                        </span>
                      </div>
                      {selectedPayment.refundAmount > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Hoàn tiền:</span>
                            <span className="text-red-600">
                              {formatCurrency(selectedPayment.refundAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Lý do hoàn tiền:
                            </span>
                            <span>{selectedPayment.refundReason}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trạng thái:</span>
                        {getStatusBadge(selectedPayment.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Thời gian tạo:</span>
                        <span>{formatDate(selectedPayment.createdAt)}</span>
                      </div>
                      {selectedPayment.processedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">
                            Thời gian xử lý:
                          </span>
                          <span>{formatDate(selectedPayment.processedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Thông tin khách hàng
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tên:</span>
                        <span>{selectedPayment.userId?.name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{selectedPayment.userId?.email || "N/A"}</span>
                      </div>
                      {selectedPayment.description && (
                        <div>
                          <span className="text-gray-500">Mô tả:</span>
                          <p className="mt-1">{selectedPayment.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                {selectedPayment.orderId?.items && (
                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Sản phẩm trong đơn hàng
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Sản phẩm
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Số lượng
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Đơn giá
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Thành tiền
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedPayment.orderId.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm">
                                {item.productId?.productName || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {formatCurrency(item.price * item.quantity)}
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

        {/* Refund Modal */}
        {showRefundModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Hoàn tiền giao dịch
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền hoàn trả (tối đa:{" "}
                      {formatCurrency(
                        selectedPayment.amount - selectedPayment.refundAmount
                      )}
                      )
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={
                        selectedPayment.amount - selectedPayment.refundAmount
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lý do hoàn tiền
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập lý do hoàn tiền..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRefundModal(false);
                      setRefundAmount("");
                      setRefundReason("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={processRefund}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                  >
                    Xác nhận hoàn tiền
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagementPage;


