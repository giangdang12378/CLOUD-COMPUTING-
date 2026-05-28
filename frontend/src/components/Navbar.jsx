import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  LogOut,
  ShoppingBag,
  User,
  Package,
  History,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowDropdown(false);
  };

  return (
    <nav className="bg-gray-900/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingBag className="h-8 w-8 text-green-400" />
            <span className="text-xl font-bold text-white">StyleZone </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Trang chủ
            </Link>
            {isAuthenticated && ["admin", "super_admin", "tenant_admin"].includes(user?.role) && (
              <Link
                to={user?.role === "super_admin" ? "/super-admin/tenants" : "/admin/products"}
                className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-1"
              >
                <Shield className="h-4 w-4" />
                {user?.role === "super_admin" ? "Hệ thống SaaS" : "Quản trị"}
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 bg-gray-800 px-3 py-2 rounded-lg"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:block">
                    {user?.name || user?.email}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2"
                    >
                      {/* User Info */}
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              ["admin", "super_admin", "tenant_admin"].includes(user?.role)
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {["admin", "super_admin", "tenant_admin"].includes(user?.role)
                              ? (user?.role === "super_admin" ? "Super Admin" : "Quản trị viên")
                              : "Nhân viên"}
                          </span>
                        </div>
                        {user?.role === "tenant_admin" && user?.tenantId && (
                          <div className="mt-2 text-xs text-gray-400 break-all cursor-pointer hover:text-blue-300 transition-colors" title="Copy Store ID" onClick={() => navigator.clipboard.writeText(user.tenantId)}>
                            Store ID: <span className="font-mono text-blue-300">{user.tenantId}</span>
                          </div>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        {/* Admin Panel Link */}
                        {["admin", "super_admin", "tenant_admin"].includes(user?.role) && (
                          <>
                            <Link
                              to={user?.role === "super_admin" ? "/super-admin/tenants" : "/admin/products"}
                              className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <Shield className="h-4 w-4 mr-3" />
                              {user?.role === "super_admin" ? "Quản lý Hệ thống SaaS" : "Quản trị Cửa hàng"}
                            </Link>
                            {user?.role !== "super_admin" && (
                              <>
                                <Link
                                  to="/admin/products"
                                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  <Package className="h-4 w-4 mr-3" />
                                  Quản lý sản phẩm
                                </Link>
                                <Link
                                  to="/admin/orders"
                                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  <History className="h-4 w-4 mr-3" />
                                  Quản lý đơn hàng
                                </Link>
                              </>
                            )}
                          </>
                        )}

                        {/* Divider */}
                        <div className="border-t border-gray-700 my-1"></div>

                        {/* Logout */}
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register-store"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-700">
            <Link
              to="/"
              className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200"
            >
              Trang chủ
            </Link>
            {isAuthenticated && ["admin", "super_admin", "tenant_admin"].includes(user?.role) && (
              <Link
                to={user?.role === "super_admin" ? "/super-admin/tenants" : "/admin/products"}
                className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                {user?.role === "super_admin" ? "Hệ thống SaaS" : "Quản trị hệ thống"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
