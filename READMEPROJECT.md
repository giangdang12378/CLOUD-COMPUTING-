Mô tả tổng quan hệ thống
Hệ thống là một ứng dụng web Point-of-Sale (PoS) hoạt động theo mô hình Software-as-a-Service (SaaS), cho phép nhiều cửa hàng sử dụng chung một nền tảng để quản lý hoạt động bán hàng và vận hành cửa hàng.
Hệ thống hỗ trợ kiến trúc multi-tenant, trong đó mỗi cửa hàng được xem là một tenant riêng biệt. Dữ liệu của từng tenant được tách biệt và bảo mật với các tenant khác thông qua cơ chế tenant isolation.
Ứng dụng được xây dựng nhằm hỗ trợ các cửa hàng bán lẻ/quần áo quản lý:
bán hàng trực tiếp tại quầy (PoS)
sản phẩm
đơn hàng
thanh toán
nhân viên
khuyến mãi
báo cáo doanh thu
Ngoài ra, hệ thống còn hỗ trợ gửi email hóa đơn cho khách hàng sau khi thanh toán, hỗ trợ thanh toán chuyển khoản

Các vai trò trong hệ thống
1. Super Admin (super_admin)
Là quản trị viên của toàn bộ nền tảng SaaS.

2. Quản trị viên cửa hàng (tenant_admin)
Là chủ sở hữu của một cửa hàng cụ thể trên hệ thống.

3. Nhân viên cửa hàng (tenant_staff)
Là nhân viên được quản trị viên cửa hàng cấp tài khoản truy cập hệ thống.

Công nghệ sử dụng
Frontend
React
Tailwind CSS
JavaScript
HTML/CSS

Backend
Node.js
Express
RESTful API
JWT Authentication

Database
MongoDB
Multi-tenant database design using tenantId

Cloud & Deployment
Amazon Web Services EC2
Amazon Web Services S3
Amazon Web Services SES
Amazon Web Services IAM
Amazon Web Services CloudWatch

CÔNG NGHỆ HỖ TRỢ
Email Service (Mail hóa đơn, mail OPT)
Nodemailer
AWS SES SMTP integration
THANH TOÁN CHUYỂN KHOẢN
PayOS
Ngrok (hỗ trợ)

## Vai trò và Chức năng

| Vai trò | Chức năng | Mô tả |
| :--- | :--- | :--- |
| **Super Admin** (`super_admin`) | Quản lý cửa hàng (Tenant) | Xem danh sách cửa hàng, khóa/mở khóa cửa hàng |
| | Quản lý người dùng | Xem danh sách người dùng, khóa/mở khóa tài khoản người dùng |
| **Quản trị viên cửa hàng** (`tenant_admin`) | Đăng ký cửa hàng | Đăng ký tài khoản cửa hàng và xác thực email |
| | Bán hàng PoS | Tạo đơn hàng trực tiếp tại quầy, chọn sản phẩm, thay đổi số lượng sản phẩm trong giỏ hàng, tính tạm tính/tổng tiền, lưu đơn tạm, tìm kiếm sản phẩm, áp dụng mã giảm giá, thanh toán bằng tiền mặt hoặc chuyển khoản, nhập thông tin khách hàng, ghi chú đơn hàng, gửi email hóa đơn cho khách |
| | Quản lý nhân viên | Thêm, xóa tài khoản nhân viên cửa hàng |
| | Quản lý sản phẩm | Thêm, sửa, xóa sản phẩm, tìm kiếm và lọc sản phẩm |
| | Quản lý đơn hàng | Xem thống kê đơn hàng, tình trạng đơn hàng, chi tiết đơn hàng, tìm kiếm/lọc đơn hàng, cập nhật trạng thái đơn hàng và trạng thái thanh toán |
| | Quản lý thanh toán | Xem báo cáo doanh thu và thanh toán của cửa hàng, xuất file Excel |
| | Quản lý khuyến mãi | Thêm, sửa, xóa mã khuyến mãi |
| **Nhân viên cửa hàng** (`tenant_staff`) | Nhận tài khoản từ admin | Được quản trị viên cửa hàng cấp tài khoản truy cập hệ thống |
| | Bán hàng PoS | Tạo đơn hàng trực tiếp tại quầy, chọn sản phẩm, thay đổi số lượng sản phẩm trong giỏ hàng, tính tạm tính/tổng tiền, lưu đơn tạm, tìm kiếm sản phẩm, áp dụng mã giảm giá, thanh toán bằng tiền mặt hoặc chuyển khoản, nhập thông tin khách hàng, ghi chú đơn hàng, gửi email hóa đơn cho khách |
| | Quản lý sản phẩm | Sửa sản phẩm, tìm kiếm và lọc sản phẩm |
| | Quản lý đơn hàng | Xem thống kê đơn hàng, tình trạng đơn hàng, chi tiết đơn hàng, tìm kiếm/lọc đơn hàng, cập nhật trạng thái đơn hàng và trạng thái thanh toán |
| | Quản lý khuyến mãi | Thêm, sửa, xóa mã khuyến mãi |

---

## 🚀 Hướng dẫn Cài đặt và Khởi chạy Dự án

Sau khi clone hoặc tải dự án từ GitHub về máy tính, bạn thực hiện các bước sau để thiết lập và chạy hệ thống:

### 1. Cài đặt các gói phụ thuộc (Dependencies)

Mở Terminal/CMD tại thư mục gốc của dự án (`auth/`) và cài đặt các thư viện cần thiết:

* **Cài đặt thư viện chính cho Backend (tại thư mục gốc):**
  ```bash
  npm install
  ```

* **Cài đặt thư viện cho Frontend:**
  ```bash
  cd frontend
  npm install
  ```

* **Cài đặt các module phụ trợ của Backend:**
  ```bash
  cd ../backend
  npm install
  ```

---

### 2. Cấu hình biến môi trường (Environment Variables)

1. Tại thư mục gốc (`auth/`), sao chép file `.env.example` để tạo file `.env`:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` vừa tạo và điền các thông tin cấu hình tương ứng (thông tin file .env trong doc)
   * **Cấu hình DB & Port:**
     * `MONGO_URI`: Đường dẫn kết nối MongoDB Atlas hoặc MongoDB Local.
     * `PORT`: Cổng chạy Server Backend (mặc định là `4173`).
     * `JWT_SECRET`: Khóa bảo mật để tạo JWT Token đăng nhập.
   * **Cấu hình gửi Mail:**
     * `GMAIL_USER`: Email gửi thông báo hóa đơn và mã OTP (Ví dụ: `gmail_cua_ban@gmail.com`).
     * `GMAIL_PASS`: Mật khẩu ứng dụng (App Password) của Gmail đó.
   * **Cấu hình PayOS (Cổng thanh toán):**
     * `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`: Các khóa API lấy từ tài khoản PayOS của bạn.
   * **Cấu hình Client:**
     * `CLIENT_URL`: Địa chỉ chạy Frontend (Ví dụ: `http://localhost:5173`).

---

### 3. Khởi chạy ứng dụng

* **Chạy Server Backend:**
  Mở terminal tại thư mục gốc (`auth/`) và chạy lệnh:
  ```bash
  npm run dev
  ```

* **Chạy Frontend (React + Vite):**
  Mở một cửa sổ terminal mới, di chuyển vào thư mục `frontend/` và chạy lệnh:
  ```bash
  cd frontend
  npm run dev
  ```

Sau khi khởi chạy thành công cả Backend và Frontend, hãy truy cập vào địa chỉ `http://localhost:5173` trên trình duyệt để sử dụng ứng dụng.
