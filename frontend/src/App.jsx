import { Navigate, Route, Routes, useLocation } from "react-router-dom";


import SignUpPage from "./pages/SignUpPage";
import RegisterStorePage from "./pages/RegisterStorePage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProductManagementPage from "./pages/admin/ProductManagementPage";
import OrderManagementPage from "./pages/admin/OrderManagementPage";
import POSPage from "./pages/admin/POSPage";
import TenantManagementPage from "./pages/superadmin/TenantManagementPage";
import GlobalUserManagementPage from "./pages/superadmin/GlobalUserManagementPage";
import StaffManagementPage from "./pages/admin/StaffManagementPage";
import LandingPage from "./pages/LandingPage";

import LoadingSpinner from "./components/LoadingSpinner";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import CustomerManagementPage from "./pages/admin/CustomerManagementPage";
import PaymentManagementPage from "./pages/admin/PaymentManagementPage";
import DiscountManagementPage from "./pages/admin/DiscountManagementPage";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

// protect admin routes
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Cho phép super_admin, tenant_admin, hoặc tenant_staff vào trang admin
  if (!["admin", "super_admin", "tenant_admin", "tenant_staff"].includes(user.role)) {
    return <Navigate to="/login" replace />; 
  }

  return children;
};

// protect super admin routes
const SuperAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (user.role !== "super_admin") {
    return <Navigate to="/admin/products" replace />;
  }

  return children;
};

// redirect authenticated users to appropriate home page based on role
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    // Redirect based on user role
    if (user.role === "super_admin") {
      return <Navigate to="/super-admin/tenants" replace />;
    } else if (user.role === "tenant_staff") {
      return <Navigate to="/admin/pos" replace />;
    } else if (user.role === "admin" || user.role === "tenant_admin") {
      return <Navigate to="/admin/products" replace />;
    } else {
      // Default redirect should be to login if role is unrecognized
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// Auth Layout with floating shapes and centering
const AuthLayout = ({ children }) => {
  const location = useLocation();

  // Custom backgrounds based on path
  let bgImage = "https://i.pinimg.com/736x/b6/c9/87/b6c9876628bae28103a09af682b045c2.jpg"; // default fallback

  if (location.pathname === "/login") {
    // Elegant high-end fashion boutique shop interior
    bgImage = "https://i.pinimg.com/736x/b6/c9/87/b6c9876628bae28103a09af682b045c2.jpg";
  } else if (location.pathname === "/register-store") {
    // Beautiful storefront/boutique with plants and clean glass window
    bgImage = "https://i.pinimg.com/736x/b6/c9/87/b6c9876628bae28103a09af682b045c2.jpg";
  } else if (location.pathname === "/signup") {
    // Cozy fashion wardrobe / boutique hanger rack
    bgImage = "https://i.pinimg.com/736x/b6/c9/87/b6c9876628bae28103a09af682b045c2.jpg";
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url('${bgImage}')` }}
      ></div>
      {/* Dark overlay for better readability of text and fields */}
      <div className="absolute inset-0 bg-black opacity-45"></div>

      {children}
    </div>
  );
};

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <>
      <Routes>
        {/* 👈 NEW: Landing Page (Public Only) */}
        <Route
          path="/"
          element={
            <RedirectAuthenticatedUser>
              <LandingPage />
            </RedirectAuthenticatedUser>
          }
        />

        {/* Auth Routes - With floating shapes and centering */}
        <Route
          path="/signup"
          element={
            <RedirectAuthenticatedUser>
              <AuthLayout>
                <SignUpPage />
              </AuthLayout>
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/register-store"
          element={
            <RedirectAuthenticatedUser>
              <AuthLayout>
                <RegisterStorePage />
              </AuthLayout>
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/login"
          element={
            <RedirectAuthenticatedUser>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/verify-email"
          element={
            <AuthLayout>
              <EmailVerificationPage />
            </AuthLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RedirectAuthenticatedUser>
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <RedirectAuthenticatedUser>
              <AuthLayout>
                <ResetPasswordPage />
              </AuthLayout>
            </RedirectAuthenticatedUser>
          }
        />

        {/* Super Admin routes */}
        <Route
          path="/super-admin/tenants"
          element={
            <SuperAdminProtectedRoute>
              <TenantManagementPage />
            </SuperAdminProtectedRoute>
          }
        />
        <Route
          path="/super-admin/users"
          element={
            <SuperAdminProtectedRoute>
              <GlobalUserManagementPage />
            </SuperAdminProtectedRoute>
          }
        />

        {/* Admin routes - Clean layout */}
        <Route
          path="/admin/products"
          element={
            <AdminProtectedRoute>
              <ProductManagementPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminProtectedRoute>
              <OrderManagementPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/pos"
          element={
            <AdminProtectedRoute>
              <POSPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminProtectedRoute>
              <CustomerManagementPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminProtectedRoute>
              <PaymentManagementPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/staffs"
          element={
            <AdminProtectedRoute>
              <StaffManagementPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/discounts"
          element={
            <AdminProtectedRoute>
              <DiscountManagementPage />
            </AdminProtectedRoute>
          }
        />

        {/* catch all routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
