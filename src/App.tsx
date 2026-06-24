/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Services from './pages/Services';
import Pricing from './pages/Pricing';
import Sustainability from './pages/Sustainability';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import Dashboard from './pages/Dashboard';
import OrderSuccess from './pages/OrderSuccess';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Shop from './pages/Shop';
import AIDesignGenerator from './pages/AIDesignGenerator';
import ProductDetail from './pages/ProductDetail';
import Customizer from './pages/Customizer';
import MyOrders from './pages/MyOrders';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';

import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="services" element={<Services />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="shop" element={<Shop />} />
              <Route path="ai-studio" element={<AIDesignGenerator />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="customize/:id" element={<Customizer />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="sustainability" element={<Sustainability />} />
              <Route path="upload" element={<Upload />} />
              <Route path="upload/:orderId" element={<Upload />} />
              <Route path="order-success/:orderId" element={<OrderSuccess />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-orders" element={<MyOrders />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="refund-policy" element={<RefundPolicy />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  </ErrorBoundary>
);
}
