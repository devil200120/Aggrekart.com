import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
// Add this import with the other imports in App.jsx
import SupplierRegisterPage from './pages/auth/SupplierRegisterPage'
import ProfilePage from './pages/ProfilePage'
import WishlistPage from './pages/WishlistPage'
import HomePage from './pages/Homepage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyPhonePage from './pages/auth/VerifyPhonePage'
import SettingsPage from './pages/SettingsPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import SupplierOrdersPage from './pages/supplier/SupplierOrdersPage'
import EditProductPage from './pages/supplier/EditProductPage'




// Fix the import path for WhatsAppRegister - it's in pages/auth, not components/auth

// 

// CORRECT:
import WhatsAppRegister from './pages/auth/WhatsAppRegister'

// Supplier Pages
import SupplierDashboardPage from './pages/supplier/SupplierDashboardPage'
import SupplierProductsPage from './pages/supplier/SupplierProductsPage'
import AddProductPage from './pages/supplier/AddProductPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSuppliersPage from './pages/admin/AdminSuppliersPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

// Payment Pages - NEW IMPORTS
import PaymentProcessingPage from './pages/payment/PaymentProcessingPage'
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage'
import PaymentFailedPage from './pages/payment/PaymentFailedPage'

// Styles
import './styles/variables.css'
import './styles/global.css'
import './styles/components.css'

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="app">
              <Navbar />
              
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/auth/supplier-register" element={<SupplierRegisterPage />} />
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/products/:productId" element={<ProductDetailPage />} />
                  <Route path="/auth/register" element={<RegisterPage />} />
                  <Route path="/auth/verify-phone" element={<VerifyPhonePage />} />
<Route path="/auth/whatsapp-register" element={<WhatsAppRegister />} />
                  <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Protected Routes - Customer Only */}
                  <Route 
                    path="/cart" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CartPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/checkout" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CheckoutPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
  path="/orders/:orderId" 
  element={
    <ProtectedRoute allowedRoles={['customer']}>
      <OrderDetailPage />
    </ProtectedRoute>
  } 
/>
                  
                  <Route 
                    path="/orders" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <OrdersPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/order-confirmation/:orderId" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <OrderConfirmationPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Payment Routes - NEW PAYMENT ROUTES */}
                  <Route 
                    path="/payment/processing/:orderId" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <PaymentProcessingPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/payment/success/:orderId" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <PaymentSuccessPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/payment/failed/:orderId" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <PaymentFailedPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected Routes - Supplier Only */}
                  <Route 
                    path="/supplier/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['supplier']}>
                        <SupplierDashboardPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/supplier/products" 
                    element={
                      <ProtectedRoute allowedRoles={['supplier']}>
                        <SupplierProductsPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/supplier/products/add" 
                    element={
                      <ProtectedRoute allowedRoles={['supplier']}>
                        <AddProductPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/supplier/products/:productId/edit" 
                    element={
                      <ProtectedRoute allowedRoles={['supplier']}>
                        <EditProductPage />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/supplier/orders" 
                    element={
                      <ProtectedRoute allowedRoles={['supplier']}>
                        <SupplierOrdersPage />
                      </ProtectedRoute>
                    } 
                  />
                  

                  {/* Protected Routes - Admin Only */}
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/users" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminUsersPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/suppliers" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminSuppliersPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/orders" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminOrdersPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/products" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminProductsPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/reports" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminReportsPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/settings" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminSettingsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected Routes - General */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <div style={{ padding: '2rem' }}>
                          <h1>Dashboard</h1>
                          <p>Welcome to your dashboard!</p>
                        </div>
                      </ProtectedRoute>
                    } 
                  />

                  {/* 404 Route */}
                  <Route 
                    path="*" 
                    element={
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '4rem 2rem',
                        minHeight: '60vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}>
                        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
                        <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
                        <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
                          The page you're looking for doesn't exist.
                        </p>
                        <div>
                          <a href="/" className="btn btn-primary">
                            Go Home
                          </a>
                        </div>
                      </div>
                    } 
                  />
                  // Find the section with other routes and add these 4 missing routes:

                  {/* Missing Routes - Add these before the 404 route */}
                  <Route 
  path="/profile" 
  element={
    <ProtectedRoute allowedRoles={['customer']}>
      <ProfilePage />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/wishlist" 
  element={
    <ProtectedRoute allowedRoles={['customer']}>
      <WishlistPage />
    </ProtectedRoute>
  } 
/>
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <div style={{ padding: '2rem' }}>
                          <h1>Settings</h1>
                          <p>Settings page coming soon!</p>
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  
                  
                  
                  
                </Routes>
              </main>

              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: 'green',
                      secondary: 'black',
                    },
                  },
                  error: {
                    duration: 5000,
                  },
                }}
              />

              {/* React Query DevTools - Only in development */}
              {import.meta.env.MODE === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App
