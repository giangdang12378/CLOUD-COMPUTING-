# ECOMMERCE SYSTEM

## 1. Mục đích

Chuyển toàn bộ chức năng gửi email xác thực, quên mật khẩu, chào mừng... từ Mailtrap sang Gmail SMTP sử dụng Nodemailer trong Node.js.

---

## 2. Các thay đổi chính

### a. Thay đổi cấu hình gửi mail

- **File:** `backend/mailtrap/mailtrap.config.js`
- **Trước:** Sử dụng MailtrapClient với token Mailtrap.
- **Sau:** Sử dụng Nodemailer với transporter Gmail SMTP, lấy thông tin từ biến môi trường.

```js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sender = {
  email: process.env.GMAIL_USER,
  name: "Admin",
};
```

### b. Thay đổi logic gửi mail

- **File:** `backend/mailtrap/emails.js`
- **Trước:** Dùng `mailtrapClient.send` để gửi mail.
- **Sau:** Dùng `transporter.sendMail` của Nodemailer.

Ví dụ:

```js
await transporter.sendMail({
  from: `${sender.name} <${sender.email}>`,
  to: email,
  subject: "Verify your email",
  html: VERIFICATION_EMAIL_TEMPLATE.replace(
    "{verificationCode}",
    verificationToken
  ),
});
```

### c. Giữ nguyên các template email

- **File:** `backend/mailtrap/emailTemplates.js`
- Không cần thay đổi, chỉ thay đổi cách truyền dữ liệu vào template.

### d. Thêm Nodemailer vào dependencies

- **File:** `backend/package.json`
- Đã thêm:

```json
"nodemailer": "^6.9.8"
```

---

## 3. Cấu hình biến môi trường

- **File:** `backend/.env`
- Thêm:

```
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_app_password
```

> **Lưu ý:**
>
> - Nên dùng App Password thay vì mật khẩu Gmail thông thường (bảo mật hơn).
> - Hướng dẫn tạo App Password: https://myaccount.google.com/apppasswords

---

## 4. Cài đặt và chạy lại backend

```bash
cd backend
npm install
npm run dev
```

---

## 5. Test chức năng gửi mail

- Đăng ký, quên mật khẩu, xác thực... sẽ gửi mail qua Gmail SMTP.
- Nếu có lỗi, kiểm tra lại biến môi trường và quyền truy cập Gmail.

---

## 6. Lưu ý bảo mật

- Không commit file `.env` lên GitHub.
- Không chia sẻ App Password công khai.

---

## 7. Lý do chuyển đổi

- Mailtrap hết lượt miễn phí hoặc bị giới hạn.
- Gmail SMTP miễn phí, dễ tích hợp, phù hợp cho phát triển và test.

---

**Nếu cần chuyển sang dịch vụ khác (SendGrid, Resend, Mailgun...), chỉ cần thay đổi cấu hình transporter tương tự.**
