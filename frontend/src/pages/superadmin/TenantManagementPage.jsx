import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Building2, Globe, Mail, Phone, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import SuperAdminHeader from "../../components/admin/SuperAdminHeader";
import { useTenantStore } from "../../store/tenantStore";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toast } from "react-hot-toast";

const TenantManagementPage = () => {
    const { tenants, isLoading, error, pagination, getTenants, updateTenantStatus } = useTenantStore();
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal state
    const [showLockModal, setShowLockModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [lockReason, setLockReason] = useState("");

    useEffect(() => {
        getTenants(1, searchTerm);
    }, [getTenants, searchTerm]);

    const handleActionClick = (tenant) => {
        if (tenant.isActive) {
            // If active, we want to lock -> show modal
            setSelectedTenant(tenant);
            setLockReason("");
            setShowLockModal(true);
        } else {
            // If locked, we want to unlock -> direct toggle
            handleUnlock(tenant._id);
        }
    };

    const handleLock = async () => {
        if (!lockReason.trim()) {
            toast.error("Vui lòng nhập lý do khóa");
            return;
        }

        try {
            await updateTenantStatus(selectedTenant._id, false, lockReason);
            toast.success(`Đã khóa cửa hàng ${selectedTenant.name}`);
            setShowLockModal(false);
            setSelectedTenant(null);
            setLockReason("");
        } catch (error) {
            toast.error("Lỗi khi khóa cửa hàng");
        }
    };

    const handleUnlock = async (id) => {
        try {
            await updateTenantStatus(id, true);
            toast.success("Đã mở khóa cửa hàng thành công");
        } catch (error) {
            toast.error("Lỗi khi mở khóa cửa hàng");
        }
    };

    if (isLoading && tenants.length === 0) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            <SuperAdminHeader />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-600">
                        Quản lý Cửa hàng (Tenants)
                    </h1>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm cửa hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white text-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cửa hàng</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin khóa</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {tenants.map((tenant) => (
                                    <tr key={tenant._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-green-50 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                                                    <div className="text-sm text-gray-500 font-mono text-[10px]">ID: {tenant._id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                                                <Mail className="h-3 w-3 text-gray-400" /> {tenant.email}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-gray-400" /> {tenant.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {!tenant.isActive ? (
                                                <div className="text-xs text-red-600 italic max-w-[200px] truncate" title={tenant.lockReason}>
                                                    Lý do: {tenant.lockReason || 'Không xác định'}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                tenant.isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                            }`}>
                                                {tenant.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleActionClick(tenant)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                                    tenant.isActive 
                                                        ? 'text-red-600 hover:bg-red-50' 
                                                        : 'text-green-600 hover:bg-green-50'
                                                }`}
                                            >
                                                {tenant.isActive ? (
                                                    <><XCircle className="h-4 w-4" /> Khóa tài khoản</>
                                                ) : (
                                                    <><CheckCircle className="h-4 w-4" /> Mở khóa cửa hàng</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Lock Reason Modal */}
            <AnimatePresence>
                {showLockModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLockModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3 text-red-600">
                                    <AlertTriangle className="h-6 w-6" />
                                    <h3 className="text-xl font-bold">Khóa tài khoản cửa hàng</h3>
                                </div>
                                <button onClick={() => setShowLockModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-4">
                                Bạn đang thực hiện khóa cửa hàng <span className="text-gray-900 font-bold">{selectedTenant?.name}</span>. 
                                Tất cả nhân viên và quản lý của cửa hàng này sẽ không thể truy cập hệ thống.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-2">Lý do khóa tài khoản:</label>
                                <textarea
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                    placeholder="Nhập lý do cụ thể..."
                                    className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLockModal(false)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleLock}
                                    disabled={isLoading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? "Đang xử lý..." : "Xác nhận khóa"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TenantManagementPage;
