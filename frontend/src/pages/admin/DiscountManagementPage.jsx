import React, { useEffect, useState } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:4173/api/discounts";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang hoạt động" },
  { key: "inactive", label: "Đã ngưng" },
];

const DiscountManagementPage = () => {
  const { user } = useAuthStore();
  const [discounts, setDiscounts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [formValues, setFormValues] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderValue: 0,
    maxDiscountAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    usageLimit: "",
    isActive: true,
  });

  const buildQueryParams = (page = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
    });

    if (search) params.append("search", search);
    if (activeTab === "active") params.append("isActive", "true");
    if (activeTab === "inactive") params.append("isActive", "false");
    if (filterType) params.append("discountType", filterType);

    return params.toString();
  };

  const fetchDiscounts = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams(page);
      const response = await fetch(`${API_URL}?${queryParams}`, { credentials: "include" });
      const data = await response.json();

      if (data.discounts) {
        setDiscounts(data.discounts);
        setPagination(data.pagination);
      } else {
        setDiscounts([]);
        setPagination({});
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error("Không thể tải danh sách khuyến mãi");
      setDiscounts([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchDiscounts(1);
  }, [search, activeTab, filterType]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchDiscounts(page);
  };

  const openAddModal = () => {
    setEditingDiscount(null);
    setFormValues({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderValue: 0,
      maxDiscountAmount: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      usageLimit: "",
      isActive: true,
    });
    setShowForm(true);
  };

  const openEditModal = (discount) => {
    setEditingDiscount(discount);
    setFormValues({
      code: discount.code,
      description: discount.description || "",
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      minOrderValue: discount.minOrderValue,
      maxDiscountAmount: discount.maxDiscountAmount !== null ? discount.maxDiscountAmount.toString() : "",
      startDate: discount.startDate ? discount.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
      endDate: discount.endDate ? discount.endDate.split("T")[0] : "",
      usageLimit: discount.usageLimit !== null ? discount.usageLimit.toString() : "",
      isActive: discount.isActive,
    });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formValues.code) {
      toast.error("Vui lòng nhập mã khuyến mãi");
      return;
    }

    if (formValues.discountValue <= 0) {
      toast.error("Giá trị giảm giá phải lớn hơn 0");
      return;
    }

    // Prepare payload
    const payload = {
      ...formValues,
      code: formValues.code.trim().toUpperCase(),
      discountValue: Number(formValues.discountValue),
      minOrderValue: Number(formValues.minOrderValue || 0),
      maxDiscountAmount: formValues.maxDiscountAmount ? Number(formValues.maxDiscountAmount) : null,
      usageLimit: formValues.usageLimit ? Number(formValues.usageLimit) : null,
      endDate: formValues.endDate ? formValues.endDate : null
    };

    try {
      const isEdit = !!editingDiscount;
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `${API_URL}/${editingDiscount._id}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEdit ? "Cập nhật mã khuyến mãi thành công!" : "Tạo mã khuyến mãi thành công!");
        setShowForm(false);
        setEditingDiscount(null);
        fetchDiscounts(currentPage);
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Submit discount error:", error);
      toast.error("Có lỗi xảy ra khi lưu mã khuyến mãi");
    }
  };

  const toggleDiscountStatus = async (discount) => {
    try {
      const response = await fetch(`${API_URL}/${discount._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !discount.isActive }),
        credentials: "include"
      });

      if (response.ok) {
        toast.success(discount.isActive ? "Đã ngưng hoạt động mã!" : "Đã kích hoạt hoạt động mã!");
        fetchDiscounts(currentPage);
      } else {
        toast.error("Lỗi khi thay đổi trạng thái mã");
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Lỗi hệ thống");
    }
  };

  const handleDeleteDiscount = async (discount) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa mã khuyến mãi "${discount.code}" không?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/${discount._id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        toast.success("Xóa mã khuyến mãi thành công!");
        fetchDiscounts(currentPage);
      } else {
        const data = await response.json();
        toast.error(data.message || "Lỗi khi xóa mã khuyến mãi");
      }
    } catch (error) {
      console.error("Delete discount error:", error);
      toast.error("Lỗi hệ thống khi xóa mã");
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="p-2 md:p-8 w-full max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Quản lý khuyến mãi</h1>

        <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          {/* Active Tab Filters */}
          <div className="flex gap-2 mb-2 md:mb-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`px-3 py-1 rounded font-semibold border ${
                  activeTab === tab.key
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {user?.role !== 'tenant_staff' && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
                onClick={openAddModal}
              >
                + Thêm khuyến mãi
              </button>
            )}
            <input
              className="border px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Tìm kiếm mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List Content Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white">Đang tải...</div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white border rounded shadow text-sm md:text-base">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 md:px-4 py-2 border">Mã khuyến mãi</th>
                  <th className="px-2 md:px-4 py-2 border">Mô tả</th>
                  <th className="px-2 md:px-4 py-2 border hidden sm:table-cell">Mức giảm</th>
                  <th className="px-2 md:px-4 py-2 border hidden sm:table-cell">Đơn tối thiểu</th>
                  <th className="px-2 md:px-4 py-2 border hidden sm:table-cell">Đã dùng / Giới hạn</th>
                  <th className="px-2 md:px-4 py-2 border">Trạng thái</th>
                  <th className="px-2 md:px-4 py-2 border">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {discounts && discounts.length > 0 ? (
                  discounts.map((discount) => (
                    <tr key={discount._id} className="hover:bg-gray-50 text-gray-800">
                      <td className="px-2 md:px-4 py-2 border font-bold text-blue-600">
                        {discount.code}
                      </td>
                      <td className="px-2 md:px-4 py-2 border">
                        {discount.description || "Không có mô tả"}
                      </td>
                      <td className="px-2 md:px-4 py-2 border hidden sm:table-cell font-semibold">
                        {discount.discountType === "percentage" ? (
                          <span className="text-green-600">Giảm {discount.discountValue}%</span>
                        ) : (
                          <span className="text-emerald-600">Giảm {discount.discountValue?.toLocaleString()}đ</span>
                        )}
                        {discount.discountType === "percentage" && discount.maxDiscountAmount && (
                          <div className="text-[10px] text-gray-400 font-medium">Tối đa {discount.maxDiscountAmount?.toLocaleString()}đ</div>
                        )}
                      </td>
                      <td className="px-2 md:px-4 py-2 border hidden sm:table-cell font-semibold text-gray-700">
                        {discount.minOrderValue > 0 ? `${discount.minOrderValue?.toLocaleString()}đ` : "Không yêu cầu"}
                      </td>
                      <td className="px-2 md:px-4 py-2 border hidden sm:table-cell text-gray-600">
                        {discount.usageCount} / {discount.usageLimit !== null ? discount.usageLimit : "∞"}
                      </td>
                      <td className="px-2 md:px-4 py-2 border">
                        <span 
                          onClick={() => toggleDiscountStatus(discount)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                            discount.isActive 
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {discount.isActive ? "Đang chạy" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="px-2 md:px-4 py-2 border space-x-2">
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold"
                          onClick={() => openEditModal(discount)}
                        >
                          Sửa
                        </button>
                        {user?.role !== 'tenant_staff' && (
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold"
                            onClick={() => handleDeleteDiscount(discount)}
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500 font-medium">
                      Không có mã khuyến mãi nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Info */}
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

        {pagination.totalDiscounts > 0 && (
          <div className="mt-4 text-center text-gray-300 text-sm">
            Hiển thị {discounts.length} trong tổng số {pagination.totalDiscounts}{" "}
            mã khuyến mãi (Trang {pagination.currentPage} / {pagination.totalPages})
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto text-gray-800">
              
              <h2 className="text-lg font-bold mb-4 border-b pb-2">
                {editingDiscount ? "Sửa mã khuyến mãi" : "Thêm mã khuyến mãi mới"}
              </h2>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Code & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">MÃ CODE *</label>
                    <input
                      type="text"
                      name="code"
                      required
                      placeholder="Ví dụ: SALE10"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 uppercase text-sm font-bold"
                      value={formValues.code}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái</label>
                    <select
                      name="isActive"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                      value={formValues.isActive.toString()}
                      onChange={(e) => setFormValues(prev => ({ ...prev, isActive: e.target.value === "true" }))}
                    >
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Tạm ngưng</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">MÔ TẢ CHIẾN DỊCH</label>
                  <textarea
                    name="description"
                    rows="2"
                    placeholder="Giảm 10% cho hóa đơn từ 500k..."
                    className="border px-2 py-1 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                    value={formValues.description}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">LOẠI GIẢM GIÁ</label>
                    <select
                      name="discountType"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                      value={formValues.discountType}
                      onChange={handleFormChange}
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">MỨC GIẢM GIÁ *</label>
                    <input
                      type="number"
                      name="discountValue"
                      required
                      min="1"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                      value={formValues.discountValue}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đơn hàng tối thiểu (đ)</label>
                    <input
                      type="number"
                      name="minOrderValue"
                      min="0"
                      placeholder="Không yêu cầu = 0"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                      value={formValues.minOrderValue}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Giảm tối đa (đ) - Cho %</label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      min="0"
                      placeholder="Không giới hạn = để trống"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                      value={formValues.maxDiscountAmount}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                {/* Start Date & End Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ngày bắt đầu</label>
                    <input
                      type="date"
                      name="startDate"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                      value={formValues.startDate}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ngày kết thúc</label>
                    <input
                      type="date"
                      name="endDate"
                      placeholder="Vô thời hạn = để trống"
                      className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                      value={formValues.endDate}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giới hạn số lần sử dụng tối đa</label>
                  <input
                    type="number"
                    name="usageLimit"
                    min="1"
                    placeholder="Không giới hạn = để trống"
                    className="border px-2 py-1.5 rounded w-full bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                    value={formValues.usageLimit}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDiscount(null);
                    }}
                    className="flex-1 py-2 text-center text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 rounded text-sm transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm transition-all shadow"
                  >
                    Lưu lại
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default DiscountManagementPage;
