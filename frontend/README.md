# Frontend React + Vite

## 1. Mô tả dự án

Đây là phần frontend của hệ thống xác thực người dùng, sử dụng React và Vite để phát triển giao diện người dùng hiện đại, kết nối với backend Node.js/Express.

---

## 2. Cách hoạt động

- Giao diện cho phép người dùng đăng ký, đăng nhập, xác thực email, quên mật khẩu, đổi mật khẩu...
- Gửi các request HTTP (REST API) tới backend để thực hiện các chức năng xác thực, quản lý tài khoản.
- Sử dụng fetch/axios để giao tiếp với backend.
- Hiển thị thông báo, lỗi, trạng thái xác thực cho người dùng.

---

## 3. Kết nối với backend

- Frontend chạy ở: `http://localhost:5173`
- Backend chạy ở: `http://localhost:4173`
- Các request API sẽ gọi tới backend qua các endpoint, ví dụ:
  - Đăng ký: `POST http://localhost:4173/api/auth/signup`
  - Đăng nhập: `POST http://localhost:4173/api/auth/login`
  - Xác thực email, quên mật khẩu, v.v. cũng qua các endpoint tương tự.
- **Cách frontend kết nối API:**
  - Sử dụng thư viện `axios` để gửi request từ frontend tới backend.
  - URL backend được cấu hình trong file `src/store/authStore.js`:
    ```js
    const API_URL =
      import.meta.env.MODE === "development"
        ? "http://localhost:4173/api/auth"
        : "/api/auth";
    ```
    - Khi chạy dev: gọi trực tiếp tới backend local.
    - Khi build production: gọi tới cùng domain (thường dùng reverse proxy hoặc deploy chung).
  - Tất cả các hàm như `signup`, `login`, `logout`, `verifyEmail`, ... đều gọi API qua axios với URL này.
  - Để gửi cookie (token xác thực), có dòng sau:
    ```js
    axios.defaults.withCredentials = true;
    ```
- **Lưu ý:**
  - Backend phải bật CORS cho phép origin `http://localhost:5173` và credentials.
  - Nếu backend đổi port hoặc domain, cần sửa lại URL API trong code frontend hoặc dùng biến môi trường Vite (`.env`).
  - Khi deploy production, nên cấu hình reverse proxy (Nginx, Vercel, Netlify, v.v.) để frontend và backend cùng domain hoặc proxy API.

---

## 4. Quản lý state với Zustand

### a. Zustand là gì?

- Zustand là một thư viện quản lý state (trạng thái) toàn cục cho React, đơn giản, nhẹ, dễ dùng hơn Redux.
- Cho phép lưu trữ, cập nhật, chia sẻ state giữa các component mà không cần truyền props qua nhiều cấp.

### b. Nhiệm vụ của Zustand trong dự án này

- **Quản lý trạng thái xác thực người dùng:**
  - Lưu thông tin user, trạng thái đăng nhập (`isAuthenticated`), lỗi (`error`), trạng thái loading (`isLoading`), thông báo (`message`), v.v.
- **Chứa các hàm thao tác với API xác thực:**
  - `signup`, `login`, `logout`, `verifyEmail`, `checkAuth`, `forgotPassword`, `resetPassword`.
  - Các hàm này gọi API backend, cập nhật state tương ứng khi thành công/thất bại.
- **Quản lý trạng thái loading, error, message:**
  - Khi thực hiện các thao tác bất đồng bộ (gọi API), Zustand giúp cập nhật trạng thái loading, error, message để hiển thị cho người dùng.
- **Dễ dàng sử dụng ở mọi component:**
  - Chỉ cần gọi hook `useAuthStore` là có thể truy cập hoặc cập nhật state xác thực ở bất kỳ đâu trong app.

### c. Cách hoạt động

- Tất cả logic xác thực được định nghĩa trong file `src/store/authStore.js`.
- Khi component cần đăng nhập, đăng ký, xác thực... chỉ cần gọi các hàm từ hook `useAuthStore`.
- Khi state thay đổi (ví dụ đăng nhập thành công), toàn bộ các component sử dụng state này sẽ tự động cập nhật.

### d. Ví dụ sử dụng Zustand trong component

```js
import { useAuthStore } from "../store/authStore";

function LoginForm() {
  const { login, isLoading, error } = useAuthStore();
  // ...
  const handleLogin = async () => {
    try {
      await login(email, password);
      // chuyển trang hoặc hiển thị thông báo thành công
    } catch (e) {
      // lỗi đã được cập nhật trong state error
    }
  };
  // ...
}
```

### e. Trạng thái được quản lý bởi Zustand

- `user`: Thông tin người dùng hiện tại
- `isAuthenticated`: Đã đăng nhập hay chưa
- `error`: Lỗi xác thực hoặc lỗi API
- `isLoading`: Đang thực hiện thao tác bất đồng bộ
- `isCheckingAuth`: Đang kiểm tra trạng thái đăng nhập khi load lại trang
- `message`: Thông báo thành công hoặc trạng thái khác

### f. Lợi ích khi dùng Zustand

- Đơn giản, dễ dùng, không cần boilerplate như Redux
- Dễ dàng mở rộng, bảo trì
- Truy cập state ở bất kỳ đâu trong app mà không cần truyền props

---

## 5. Cấu hình & phát triển

### Cài đặt dependencies

```bash
npm install
```

### Chạy development server

```bash
npm run dev
```

- Truy cập giao diện tại: [http://localhost:5173](http://localhost:5173)

### Build production

```bash
npm run build
```

---

## 6. Cấu trúc thư mục chính

- `src/` : Chứa toàn bộ mã nguồn React (component, page, store, hooks...)
- `public/` : Tài nguyên tĩnh
- `vite.config.js` : Cấu hình Vite
- `tailwind.config.js` : Cấu hình Tailwind CSS (nếu dùng)

---

## 7. Lưu ý khi phát triển

- Đảm bảo backend luôn chạy song song khi phát triển frontend.
- Nếu gặp lỗi CORS, kiểm tra lại cấu hình backend.
- Có thể cấu hình biến môi trường cho URL backend bằng `.env` (xem tài liệu Vite về biến môi trường).
- Khi deploy production, nên cấu hình reverse proxy hoặc sửa lại URL API cho phù hợp môi trường thực tế.

---

## 8. Tham khảo

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Tailwind CSS](https://tailwindcss.com/) (nếu dùng)

---

**Nếu cần hướng dẫn chi tiết về cấu trúc code hoặc tích hợp API cụ thể, hãy xem trong thư mục `src/` hoặc liên hệ người phát triển.**

---

## 1. Giải thích sâu về cách Zustand hoạt động

### a. Store trong Zustand là gì?

- Store là nơi lưu trữ toàn bộ state và các hàm thao tác với state (giống như một “trung tâm điều phối”).
- Bạn định nghĩa store một lần, sau đó có thể truy cập hoặc cập nhật state từ bất kỳ component nào.

### b. Cách tạo store với Zustand

Ví dụ (trích từ `src/store/authStore.js`):

```js
import { create } from "zustand";
import axios from "axios";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: "Lỗi đăng nhập", isLoading: false });
    }
  },

  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### c. Cách sử dụng store trong component

Bạn chỉ cần import hook và lấy state/hàm cần dùng:

```js
import { useAuthStore } from "../store/authStore";

function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return <div>Bạn chưa đăng nhập!</div>;

  return (
    <div>
      <h2>Xin chào, {user.name}</h2>
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}
```

- Khi bạn gọi `logout()`, state `user` và `isAuthenticated` sẽ được cập nhật, component tự động render lại.

### d. Ưu điểm của Zustand

- **Không cần Provider**: Không cần bọc app bằng Provider như Redux hay Context.
- **Truy cập state ở bất kỳ đâu**: Chỉ cần gọi hook.
- **Tự động cập nhật**: Component tự render lại khi state thay đổi.
- **Hàm bất đồng bộ**: Có thể định nghĩa các hàm async trực tiếp trong store.

---

## 2. Ví dụ thực tế: Đăng nhập và hiển thị thông tin người dùng

### a. Định nghĩa store (authStore.js)

```js
import { create } from "zustand";
import axios from "axios";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: "Lỗi đăng nhập", isLoading: false });
    }
  },

  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### b. Sử dụng trong component (LoginForm.jsx)

```js
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        Đăng nhập
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}
```

### c. Sử dụng state ở component khác (Profile.jsx)

```js
import { useAuthStore } from "../store/authStore";

function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return <div>Bạn chưa đăng nhập!</div>;

  return (
    <div>
      <h2>Xin chào, {user.name}</h2>
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}
```

---

## 3. Tổng kết

- **Zustand** giúp bạn quản lý state xác thực (và các state khác) một cách tập trung, đơn giản, hiệu quả.
- Chỉ cần import hook là có thể truy cập hoặc cập nhật state ở bất kỳ đâu trong app.
- Khi state thay đổi, các component liên quan sẽ tự động cập nhật giao diện.

