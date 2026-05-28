import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, Users, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";

const SuperAdminHeader = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const superAdminNavItems = [
        {
            name: "Quản lý Cửa hàng",
            path: "/super-admin/tenants",
            icon: Building2,
        },
        {
            name: "Quản lý tài khoản",
            path: "/super-admin/users",
            icon: Users,
        }
    ];

    return (
        <>
            <header className="w-full bg-white shadow fixed top-0 left-0 right-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center space-x-2">
                                <Shield className="w-8 h-8 text-green-700" />
                                <div className="text-xl font-bold text-green-700">
                                    Super Admin
                                </div>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex space-x-1">
                            {superAdminNavItems.map((item) => {
                                const isActive = location.pathname.includes(item.path);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                            isActive
                                                ? "text-green-700 bg-green-50"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        }`}
                                    >
                                        <item.icon className={`h-4 w-4 mr-2 ${isActive ? "text-green-700" : "text-gray-400"}`} />
                                        {item.name}
                                        
                                        {/* Active Indicator */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="superAdminNavIndicator"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700 rounded-t-full"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Logout Button */}
                        <div className="flex items-center ml-4">
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            {/* Spacer để tránh content bị che */}
            <div className="h-16 lg:h-14"></div>
            <div className="lg:hidden h-16"></div>
        </>
    );
};

export default SuperAdminHeader;

