// 1. Import các thư viện cần thiết
import { create } from "zustand"; // import hàm create từ thư viện zustand để tạo store quản lý trạng thái toàn cục
import axios from "axios"; // import axios để thực hiện các request HTTP

// 2. Xác định URL API dựa vào môi trường (development hay production)
// Nếu đang ở môi trường phát triển (development), API_URL sẽ là "http://localhost:4173/api/auth"
// Ngược lại (production), API_URL sẽ là "/api/auth"
const API_URL = import.meta.env.MODE === "development" ? "http://localhost:4173/api/auth" : "/api/auth";

// 3. Thiết lập axios để luôn gửi cookie khi thực hiện request (hữu ích cho xác thực phiên đăng nhập)
axios.defaults.withCredentials = true;

// 4. Tạo store zustand để quản lý trạng thái xác thực (authentication)
export const useAuthStore = create((set) => ({
	// Khởi tạo các state mặc định
	user: null, // Lưu thông tin người dùng sau khi đăng nhập/thực hiện các thao tác xác thực
	isAuthenticated: false, // Trạng thái đã xác thực hay chưa
	error: null, // Lưu thông báo lỗi nếu có
	isLoading: false, // Trạng thái đang loading (đang thực hiện request)
	isCheckingAuth: true, // Trạng thái đang kiểm tra xác thực ban đầu
	message: null, // Lưu các thông báo thành công (ví dụ: gửi email thành công)

	// Hàm đăng ký tài khoản mới (nhân viên/khách hàng)
	signup: async (email, password, name) => {
		set({ isLoading: true, error: null }); // Đặt trạng thái loading và xóa lỗi cũ
		try {
			// Gửi request POST tới endpoint /signup với dữ liệu
			const response = await axios.post(`${API_URL}/signup`, { email, password, name });
			// Nếu thành công, cập nhật user, đặt isAuthenticated = true, tắt loading
			set({ user: response.data.user, isAuthenticated: true, isLoading: false });
		} catch (error) {
			// Nếu có lỗi, cập nhật error với thông báo từ server hoặc thông báo mặc định, tắt loading
			set({ error: error.response.data.message || "Error signing up", isLoading: false });
			throw error; // Ném lỗi ra ngoài để component có thể xử lý tiếp
		}
	},

	// Hàm đăng ký Cửa hàng mới (SaaS)
	registerTenant: async (storeName, name, email, password, phone, address) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/register-tenant`, {
				storeName, name, email, password, phone, address
			});
			// Do NOT set isAuthenticated because the backend doesn't return a JWT token for registerTenant.
			// The user must explicitly log in afterwards.
			set({ isLoading: false });
		} catch (error) {
			set({ error: error.response?.data?.message || "Error registering store", isLoading: false });
			throw error;
		}
	},

	// Hàm đăng nhập
	login: async (email, password) => {
		set({ isLoading: true, error: null }); // Đặt trạng thái loading và xóa lỗi cũ
		try {
			// Gửi request POST tới endpoint /login với email và password
			const response = await axios.post(`${API_URL}/login`, { email, password });
			// Nếu thành công, cập nhật trạng thái xác thực, user, xóa lỗi, tắt loading
			set({
				isAuthenticated: true,
				user: response.data.user,
				error: null,
				isLoading: false,
			});
			return response.data; // Trả về dữ liệu để component có thể xử lý routing
		} catch (error) {
			// Nếu có lỗi, cập nhật error với thông báo từ server hoặc thông báo mặc định, tắt loading
			set({ error: error.response?.data?.message || "Error logging in", isLoading: false });
			throw error; // Ném lỗi ra ngoài
		}
	},

	// Hàm đăng xuất
	logout: async () => {
		set({ isLoading: true, error: null }); // Đặt trạng thái loading và xóa lỗi cũ
		try {
			// Gửi request POST tới endpoint /logout để đăng xuất
			await axios.post(`${API_URL}/logout`);
			// Nếu thành công, xóa user, đặt isAuthenticated = false, xóa lỗi, tắt loading
			set({ user: null, isAuthenticated: false, error: null, isLoading: false });
		} catch (error) {
			// Nếu có lỗi, cập nhật error với thông báo mặc định, tắt loading
			set({ error: "Error logging out", isLoading: false });
			throw error; // Ném lỗi ra ngoài
		}
	},

	// Hàm xác thực email (thường dùng sau khi đăng ký)
	verifyEmail: async (code) => {
		set({ isLoading: true, error: null }); // Đặt trạng thái loading và xóa lỗi cũ
		try {
			// Gửi request POST tới endpoint /verify-email với mã xác thực (code)
			const response = await axios.post(`${API_URL}/verify-email`, { code });
			// Nếu thành công, cập nhật user, đặt isAuthenticated = true, tắt loading
			set({ user: response.data.user, isAuthenticated: true, isLoading: false });
			return response.data; // Trả về dữ liệu từ server (có thể chứa thông tin bổ sung)
		} catch (error) {
			// Nếu có lỗi, cập nhật error với thông báo từ server hoặc thông báo mặc định, tắt loading
			set({ error: error.response.data.message || "Error verifying email", isLoading: false });
			throw error; // Ném lỗi ra ngoài
		}
	},

	// Hàm kiểm tra trạng thái xác thực (thường dùng khi load lại trang)
	checkAuth: async () => {
		set({ isCheckingAuth: true, error: null }); // Đặt trạng thái đang kiểm tra xác thực, xóa lỗi cũ
		try {
			// Gửi request GET tới endpoint /check-auth để kiểm tra trạng thái đăng nhập
			const response = await axios.get(`${API_URL}/check-auth`);
			// Nếu thành công, cập nhật user, đặt isAuthenticated = true, tắt trạng thái kiểm tra
			set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
		} catch (error) {
			// Nếu có lỗi (ví dụ: chưa đăng nhập), đặt error = null, tắt trạng thái kiểm tra, đặt isAuthenticated = false
			set({ error: null, isCheckingAuth: false, isAuthenticated: false });
		}
	},

	// Hàm gửi email quên mật khẩu
	forgotPassword: async (email) => {
		set({ isLoading: true, error: null }); // Đặt trạng thái loading và xóa lỗi cũ
		try {
			// Gửi request POST tới endpoint /forgot-password với email
			const response = await axios.post(`${API_URL}/forgot-password`, { email });
			// Nếu thành công, cập nhật message với thông báo từ server, tắt loading
			set({ message: response.data.message, isLoading: false });
		} catch (error) {
			// Nếu có lỗi, cập nhật error với thông báo từ server hoặc thông báo mặc định, tắt loading
			set({
				isLoading: false,
				error: error.response.data.message || "Error sending reset password email",
			});
			throw error; // Ném lỗi ra ngoài
		}
	},

	// Hàm đặt lại mật khẩu mới
	resetPassword: async (token, password) => {
		set({ isLoading: true, error: null }); // Đặt trạng thái loading và xóa lỗi cũ
		try {
			// Gửi request POST tới endpoint /reset-password/:token với mật khẩu mới
			const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
			// Nếu thành công, cập nhật message với thông báo từ server, tắt loading
			set({ message: response.data.message, isLoading: false });
		} catch (error) {
			// Nếu có lỗi, cập nhật error với thông báo từ server hoặc thông báo mặc định, tắt loading
			set({
				isLoading: false,
				error: error.response.data.message || "Error resetting password",
			});
			throw error; // Ném lỗi ra ngoài
		}
	},
}));
