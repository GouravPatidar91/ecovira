
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Market from "@/pages/Market";
import Auth from "@/pages/Auth";
import Farmers from "@/pages/Farmers";
import About from "@/pages/About";
import ProductDetail from "@/pages/ProductDetail";
import Payment from "@/pages/Payment";
import Dashboard from "@/pages/Dashboard";
import SellerDashboard from "@/pages/dashboard/SellerDashboard";
import Products from "@/pages/dashboard/Products";
import SellerVerification from "@/pages/SellerVerification";
import Chats from "@/pages/Chats";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/cart";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/market" element={<Market />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/about" element={<About />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/seller" element={<SellerDashboard />} />
              <Route path="/dashboard/products" element={<Products />} />
              <Route path="/dashboard/orders" element={<div>Dashboard Orders</div>} />
              <Route path="/seller-verification" element={<SellerVerification />} />
              <Route path="/chats" element={<Chats />} />
            </Routes>
          </SidebarProvider>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
