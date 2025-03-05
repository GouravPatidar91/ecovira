import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "@/pages/Index";
import Market from "@/pages/Market";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Farmers from "@/pages/Farmers";
import About from "@/pages/About";
import ProductDetail from "@/pages/ProductDetail";
import Payment from "@/pages/Payment";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Products from "@/pages/Products";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/contexts/cart";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/market" element={<Market />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/orders" element={<Orders />} />
          <Route path="/dashboard/products" element={<Products />} />
          <Route path="/dashboard/messages" element={<Messages />} />
          <Route path="/dashboard/settings" element={<Settings />} />
        </Routes>
        <Toaster />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
