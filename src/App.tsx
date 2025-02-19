
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Market from "@/pages/Market";
import Farmers from "@/pages/Farmers";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import SellerVerification from "@/pages/SellerVerification";
import Products from "@/pages/dashboard/Products";
import Orders from "@/pages/dashboard/Orders";
import Inventory from "@/pages/dashboard/Inventory";
import ProductForm from "@/pages/dashboard/ProductForm";
import AdminVerification from "@/pages/dashboard/AdminVerification";
import AdminRoute from "@/components/AdminRoute";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/market" element={<Market />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/seller-verification" element={<SellerVerification />} />
        <Route path="/dashboard/products" element={<Products />} />
        <Route path="/dashboard/orders" element={<Orders />} />
        <Route path="/dashboard/inventory" element={<Inventory />} />
        <Route path="/dashboard/products/new" element={<ProductForm />} />
        <Route path="/dashboard/products/:id" element={<ProductForm />} />
        <Route 
          path="/dashboard/verifications" 
          element={
            <AdminRoute>
              <AdminVerification />
            </AdminRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
