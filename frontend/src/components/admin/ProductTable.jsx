import React from 'react';

const statusMap = {
  available: 'Khả dụng',
  unavailable: 'Ngưng sản xuất',
  out_of_stock: 'Hết hàng',
};

const ProductTable = ({ products, onEdit, onDelete, onUploadImage, userRole }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full bg-white border rounded shadow text-sm md:text-base">
        <thead>
          <tr>
            <th className="px-2 md:px-4 py-2 border">Ảnh</th>
            <th className="px-2 md:px-4 py-2 border">Tên sản phẩm</th>
            <th className="px-2 md:px-4 py-2 border hidden sm:table-cell">Danh mục</th>
            <th className="px-2 md:px-4 py-2 border hidden sm:table-cell">
              Giá
            </th>
            <th className="px-2 md:px-4 py-2 border hidden sm:table-cell">
              Kho
            </th>
            <th className="px-2 md:px-4 py-2 border">Trạng thái</th>
            <th className="px-2 md:px-4 py-2 border">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {products && products.length > 0 ? (
            products.map((product) => (
              <tr key={product._id}>
                <td className="px-2 md:px-4 py-2 border">
                  {product.image ? (
                    // <img src={`http://localhost:4173/${product.image.replace(/\\/g, '/')}`} alt={product.productName} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
                    <img
                      src={`http://localhost:4173${product.image}`}
                      alt={product.productName}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 flex items-center justify-center">
                      Ảnh
                    </div>
                  )}
                </td>
                <td className="px-2 md:px-4 py-2 border">
                  {product.productName}
                </td>
                <td className="px-2 md:px-4 py-2 border hidden sm:table-cell">
                  <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                    {product.category || 'Khác'}
                  </span>
                </td>
                <td className="px-2 md:px-4 py-2 border hidden sm:table-cell">
                  {product.price?.toLocaleString()}đ
                </td>
                <td className="px-2 md:px-4 py-2 border hidden sm:table-cell">
                  {product.inventory}
                </td>
                <td className="px-2 md:px-4 py-2 border">
                  {statusMap[product.status] || product.status}
                </td>
                <td className="px-2 md:px-4 py-2 border space-x-2">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded"
                    onClick={() => onEdit(product)}
                  >
                    Sửa
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => onUploadImage(product)}
                  >
                    Upload ảnh
                  </button>
                  {userRole !== 'tenant_staff' && (
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => onDelete(product)}
                    >
                      Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-4">
                Không có sản phẩm nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
