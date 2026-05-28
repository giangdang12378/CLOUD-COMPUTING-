import React, { useEffect, useState } from "react";
import ProductTable from "../../components/admin/ProductTable";
import ProductForm from "../../components/admin/ProductForm";
import ConfirmModal from "../../components/admin/ConfirmModal";
import AdminHeader from "../../components/admin/AdminHeader";
import { useAuthStore } from "../../store/authStore";

const API_URL = `${import.meta.env.VITE_API_URL || ""}/api/products`;

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "out_of_stock", label: "Hết hàng" },
  { key: "unavailable", label: "Ngưng sản xuất" },
];

const ProductManagementPage = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Build query parameters
  const buildQueryParams = (page = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "5", // Admin có thể dùng limit nhỏ hơn
    });

    if (search) params.append("search", search);
    if (activeTab !== "all") params.append("status", activeTab);

    return params.toString();
  };

  // Fetch products with pagination
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams(page);
      const response = await fetch(`${API_URL}?${queryParams}`, { credentials: "include" });
      const data = await response.json();

      // Handle new response format
      if (data.products) {
        setProducts(data.products);
        setPagination(data.pagination);
      } else {
        // Fallback for old response format
        setProducts(Array.isArray(data) ? data : []);
        setPagination({});
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [search, activeTab]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProducts(page);
  };

  // Thêm/sửa sản phẩm
  const handleSubmit = async (formData) => {
    try {
      const isEdit = !!editingProduct;
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `${API_URL}/${editingProduct._id}` : API_URL;
      const body = new FormData();

      console.log("Form data being sent:", formData);
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          body.append(key, value);
        }
      });

      const response = await fetch(url, {
        method,
        body,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        alert(`Lỗi: ${errorData.message || "Có lỗi xảy ra"}`);
        return;
      }

      const result = await response.json();
      console.log("API Success:", result);
      setShowForm(false);
      setEditingProduct(null);

      // Refresh current page
      fetchProducts(currentPage);
    } catch (error) {
      console.error("Submit error:", error);
      alert("Có lỗi xảy ra khi lưu sản phẩm");
    }
  };

  // Xóa sản phẩm (chuyển status)
  const handleDelete = async () => {
    console.log("DELETE CLICKED");
    console.log("productToDelete =", productToDelete);

    if (!productToDelete) return;

    try {
      console.log("DELETE URL =", `${API_URL}/${productToDelete._id}`);

      const response = await fetch(`${API_URL}/${productToDelete._id}`, {
        method: "DELETE",
        credentials: "include"
      });

      console.log("DELETE RESPONSE =", response);
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || "Không có quyền thực hiện hành động này");
        setShowConfirm(false);
        return;
      }
      setShowConfirm(false);
      setProductToDelete(null);

      // Refresh current page
      fetchProducts(currentPage);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Có lỗi xảy ra khi xóa sản phẩm");
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <AdminHeader />
      <div className="p-2 md:p-8 w-full max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý sản phẩm</h1>

        <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div className="flex gap-2 mb-2 md:mb-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`px-3 py-1 rounded font-semibold border ${
                  activeTab === tab.key
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {user?.role !== 'tenant_staff' && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => {
                  setShowForm(true);
                  setEditingProduct(null);
                }}
              >
                + Thêm sản phẩm
              </button>
            )}
            <input
              className="border px-2 py-1 rounded"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white">Đang tải...</div>
          </div>
        ) : (
          <ProductTable
            products={products}
            userRole={user?.role}
            onEdit={(product) => {
              setShowForm(true);
              setEditingProduct(product);
            }}
            onDelete={(product) => {
              setShowConfirm(true);
              setProductToDelete(product);
            }}
            onUploadImage={(product) => {
              setShowForm(true);
              setEditingProduct(product);
            }}
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
        {pagination.totalProducts > 0 && (
          <div className="mt-4 text-center text-gray-300 text-sm">
            Hiển thị {products.length} trong tổng số {pagination.totalProducts}{" "}
            sản phẩm (Trang {pagination.currentPage} / {pagination.totalPages})
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 min-w-[400px] w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <h2 className="text-lg font-bold mb-4">
                {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <ProductForm
                initialValues={editingProduct}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          open={showConfirm}
          title="Xác nhận xoá sản phẩm"
          message="Bạn có chắc chắn muốn xóa sản phẩm này không?"
          onConfirm={handleDelete}
          onCancel={() => {
            setShowConfirm(false);
            setProductToDelete(null);
          }}
        />
      </div>
    </>
  );
};

export default ProductManagementPage;
