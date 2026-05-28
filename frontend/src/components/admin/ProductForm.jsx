import React, { useState } from "react";

const defaultValues = {
  productName: "",
  price: "",
  inventory: "",
  status: "available",
  category: "Khác",
  description: "",
  variant: [],
  image: null,
};

const ProductForm = ({ initialValues = {}, onSubmit, onCancel }) => {
  // Fix: Đảm bảo initialValues không null và có variant property
  const safeInitialValues = initialValues || {};
  const initialVariant = Array.isArray(safeInitialValues.variant)
    ? safeInitialValues.variant
    : [];

  const [form, setForm] = useState({
    ...defaultValues,
    ...safeInitialValues,
    variant: initialVariant,
  });
  const [imageFile, setImageFile] = useState(null);

  // Variant handlers
  const handleVariantChange = (idx, field, value) => {
    setForm((prev) => {
      const newVariants = [...prev.variant];
      newVariants[idx][field] = value;
      return { ...prev, variant: newVariants };
    });
  };

  const handleAddVariant = () => {
    setForm((prev) => ({
      ...prev,
      variant: [...prev.variant, { color: "", size: "" }],
    }));
  };

  const handleRemoveVariant = (idx) => {
    setForm((prev) => ({
      ...prev,
      variant: prev.variant.filter((_, i) => i !== idx),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "status" && value === "unavailable") {
      const confirmLock = window.confirm(
        "Bạn có chắc muốn chuyển sang 'Ngưng sản xuất'? Sau khi xác nhận, trạng thái này sẽ bị khóa vĩnh viễn."
      );
      if (!confirmLock) return; // nếu hủy thì không đổi
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      const data = { ...form };
      if (imageFile) data.image = imageFile;
      // Gửi variant là JSON string nếu backend yêu cầu
      data.variant = JSON.stringify(data.variant);
      onSubmit(data);
    }
  };

  return (
    <div className="h-[80vh] flex flex-col">
      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Row 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Tên sản phẩm</label>
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Giá</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Row 2: Category, Inventory & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Danh mục</label>
              <select
                name="category"
                value={form.category || "Khác"}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Áo">Áo</option>
                <option value="Quần">Quần</option>
                <option value="Áo khoác">Áo khoác</option>
                <option value="Váy">Váy</option>
                <option value="Phụ kiện">Phụ kiện</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Kho</label>
              <input
                name="inventory"
                type="number"
                value={form.inventory}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Trạng thái  {form.status === "unavailable" && (
    <span className="text-red-500 text-sm">(Đã khóa)</span>
  )}</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={form.status === "unavailable"} 
              >
                <option value="available">Khả dụng</option>
                <option value="unavailable">Ngưng sản xuất</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-1">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          {/* Variants Section - Compact */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-medium">
                Biến thể (Màu sắc - Kích thước)
              </label>
              <button
                type="button"
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                onClick={handleAddVariant}
              >
                + Thêm
              </button>
            </div>

            {/* Variants List - Fixed height with scroll */}
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {form.variant.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  Chưa có biến thể nào. Nhấn "Thêm" để thêm biến thể.
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {form.variant.map((v, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-gray-50 p-2 rounded"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Màu sắc"
                          value={v.color || ""}
                          onChange={(e) =>
                            handleVariantChange(idx, "color", e.target.value)
                          }
                          className="border px-2 py-1 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Kích cỡ"
                          value={v.size || ""}
                          onChange={(e) =>
                            handleVariantChange(idx, "size", e.target.value)
                          }
                          className="border px-2 py-1 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                        onClick={() => handleRemoveVariant(idx)}
                        title="Xóa biến thể"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-medium mb-1">Ảnh sản phẩm</label>
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="border-t bg-white pt-4 mt-4 flex-shrink-0">
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
