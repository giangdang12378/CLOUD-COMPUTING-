import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminHeader from "../../components/admin/AdminHeader";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

const StaffManagementPage = () => {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staffs`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch staffs");
      
      const data = await response.json();
      if (data.success) {
        setStaffs(data.staffs);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/staffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newStaff)
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Thêm nhân viên thành công");
        setShowAddModal(false);
        setNewStaff({ name: "", email: "", password: "" });
        fetchStaffs();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Không thể thêm nhân viên");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStaffStatus = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus ? `/api/staffs/${id}` : `/api/staffs/${id}/restore`;
      const method = currentStatus ? "DELETE" : "POST";
      
      const response = await fetch(endpoint, { method, credentials: "include" });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchStaffs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const formatDate = (date) => new Date(date).toLocaleString("vi-VN");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 lg:pt-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Quản lý Nhân sự
            </h1>
            <p className="text-gray-600 mt-2">
              Thêm và quản lý tài khoản nhân viên cho cửa hàng của bạn
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Thêm Nhân viên
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : staffs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Chưa có nhân viên nào. Hãy thêm nhân viên mới!
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-500">Nhân viên</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Trạng thái</th>
                  <th className="px-6 py-4 font-medium text-gray-500">Ngày tạo</th>
                  <th className="px-6 py-4 font-medium text-gray-500 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffs.map(staff => (
                  <tr key={staff._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{staff.name}</div>
                      <div className="text-sm text-gray-500">{staff.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {staff.isVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <UserCheck className="w-3 h-3 mr-1" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <UserX className="w-3 h-3 mr-1" /> Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(staff.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {staff.isVerified ? (
                        <button
                          onClick={() => {
                            if(window.confirm(`Khóa tài khoản ${staff.name}?`)) toggleStaffStatus(staff._id, true);
                          }}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Khóa tài khoản"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleStaffStatus(staff._id, false)}
                          className="text-green-500 hover:text-green-700 p-2"
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
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Thêm Nhân viên Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhân viên</label>
                <input 
                  type="text" required
                  value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Dùng để đăng nhập)</label>
                <input 
                  type="email" required
                  value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input 
                  type="password" required minLength="6"
                  value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Đang tạo..." : "Xác nhận tạo"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
