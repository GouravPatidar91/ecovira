
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Market from "@/pages/Market";
import Auth from "@/pages/Auth";
import Farmers from "@/pages/Farmers";
import About from "@/pages/About";
import ProductDetail from "@/pages/ProductDetail";
import Payment from "@/pages/Payment";
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
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
        <Toaster />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
