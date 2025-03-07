
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
import Orders from "@/pages/dashboard/Orders";
import SellerVerification from "@/pages/SellerVerification";
import AdminVerification from "@/pages/dashboard/AdminVerification";
import Chats from "@/pages/Chats";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/cart";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatProvider } from "@/contexts/chat";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
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
                <Route path="/dashboard/orders" element={<Orders />} />
                <Route path="/dashboard/admin/verification" element={<AdminVerification />} />
                <Route path="/seller-verification" element={<SellerVerification />} />
                <Route path="/chats" element={<Chats />} />
              </Routes>
            </SidebarProvider>
            <Toaster />
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
