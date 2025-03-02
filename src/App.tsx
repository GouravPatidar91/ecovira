
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Market from "./pages/Market";
import Products from "./pages/dashboard/Products";
import ProductForm from "./pages/dashboard/ProductForm";
import AdminRoute from "./components/AdminRoute";
import AdminVerification from "./pages/dashboard/AdminVerification";
import SellerVerification from "./pages/SellerVerification";
import NotFound from "./pages/NotFound";
import Orders from "./pages/dashboard/Orders";
import About from "./pages/About";
import Inventory from "./pages/dashboard/Inventory";
import Farmers from "./pages/Farmers";
import Payment from "./pages/Payment";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import { ChatProvider } from "./contexts/ChatContext";

function App() {
  return (
    <ChatProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/market" element={<Market />} />
          <Route path="/about" element={<About />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chats" element={<ChatList />} />
          <Route path="/seller-verification" element={<SellerVerification />} />
          <Route path="/dashboard/products" element={<Products />} />
          <Route path="/dashboard/products/new" element={<ProductForm />} />
          <Route path="/dashboard/products/:id" element={<ProductForm />} />
          <Route path="/dashboard/orders" element={<Orders />} />
          <Route path="/dashboard/inventory" element={<Inventory />} />
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
      </Router>
    </ChatProvider>
  );
}

export default App;
