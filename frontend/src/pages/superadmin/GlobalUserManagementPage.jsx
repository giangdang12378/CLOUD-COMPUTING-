import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SuperAdminHeader from "../../components/admin/SuperAdminHeader";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const GlobalUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Lock Modal State
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lockReason, setLockReason] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
        sortBy: sortBy,
      });

      const response = await fetch(`/api/users?${params}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLockModal = (user) => {
    if (user.role === "super_admin") {
      toast.error("Không thể vô hiệu hóa tài khoản Super Admin");
      return;
    }
    setSelectedUser(user);
    setLockReason("");
    setIsLockModalOpen(true);
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockReason }),
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setIsLockModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không thể vô hiệu hóa người dùng");
    }
  };

  const restoreUser = async (userId, userName) => {
    try {
      const response = await fetch(`/api/users/${userId}/restore`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không thể khôi phục người dùng");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, statusFilter, roleFilter, sortBy]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || searchTerm === "") {
        setCurrentPage(1);
        fetchUsers();
      }
    }, 500);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const formatDate = (date) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "super_admin":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Super Admin</span>;
      case "tenant_admin":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">Store Admin</span>;
      case "tenant_staff":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Staff</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">Customer</span>;
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3 mr-1" /> Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <UserX className="w-3 h-3 mr-1" /> Vô hiệu hóa
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <SuperAdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            Quản lý Tài khoản 
          </h1>
          <p className="text-gray-600 mt-2">
            Quản trị và cấp quyền tất cả người dùng trên hệ thống SaaS
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng tài khoản</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vô hiệu hóa</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactiveUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-gray-900 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            >
              <option value="all">Tất cả Chức vụ</option>
              <option value="super_admin">Super Admin</option>
              <option value="tenant_admin">Store Admin</option>
              <option value="tenant_staff">Staff</option>
              <option value="user">Customer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Vô hiệu hóa</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-green-600 rounded-full border-t-transparent"></div></div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Không có người dùng nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                  <tr>
                    <th className="px-6 py-4">Tài khoản</th>
                    <th className="px-6 py-4">Chức vụ</th>
                    <th className="px-6 py-4">Lý do khóa</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-900 text-sm">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{user.name || "N/A"}</div>
                        <div className="text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role || 'user')}</td>
                      <td className="px-6 py-4 max-w-xs truncate text-gray-500">
                        {!user.isActive ? (user.lockReason || "Không có lý do") : "---"}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(user.isActive)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {user.isActive ? (
                          <button
                            onClick={() => handleOpenLockModal(user)}
                            className="text-red-600 hover:text-red-800 p-2"
                            title="Khóa tài khoản"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreUser(user._id, user.name)}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Mở khóa tài khoản"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 text-gray-500">
            <span>Trang {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lock Reason Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserX className="text-red-600 w-6 h-6" />
              Khóa tài khoản người dùng
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn đang thực hiện khóa tài khoản của <strong>{selectedUser?.name || selectedUser?.email}</strong>. 
              Vui lòng nhập lý do khóa tài khoản này.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">Lý do khóa</label>
              <textarea
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
                placeholder="Ví dụ: Vi phạm chính sách cộng đồng, Spam..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLockModalOpen(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={deleteUser}
                disabled={!lockReason.trim()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                Xác nhận khóa
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GlobalUserManagementPage;
