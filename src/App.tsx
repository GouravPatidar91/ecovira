
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatProvider } from "./contexts/ChatContext";
import { Toaster } from "./components/ui/toaster"; // Using relative path instead of alias
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

import About from "@/pages/About";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Market from "@/pages/Market";
import Farmers from "@/pages/Farmers";
import NotFound from "@/pages/NotFound";
import Payment from "@/pages/Payment";
import OrderPaymentProcess from "@/pages/OrderPaymentProcess";
import Products from "@/pages/dashboard/Products";
import Orders from "@/pages/dashboard/Orders";
import ProductForm from "@/pages/dashboard/ProductForm";
import DashboardLayout from "@/components/DashboardLayout";
import AdminVerification from "@/pages/dashboard/AdminVerification";
import SellerVerification from "@/pages/SellerVerification";
import Inventory from "@/pages/dashboard/Inventory";
import AdminRoute from "@/components/AdminRoute";
import FarmerRoute from "@/components/FarmerRoute";
import ChatList from "@/pages/ChatList";
import Chat from "@/pages/Chat";
import BuyerOrders from "@/pages/BuyerOrders";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            <BrowserRouter>
              <div className="min-h-screen">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/market" element={<Market />} />
                  <Route path="/farmers" element={<Farmers />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route path="/order-payment" element={<OrderPaymentProcess />} />
                  <Route path="/chats" element={<ChatList />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/my-orders" element={<BuyerOrders />} />

                  <Route path="/seller-verification" element={<SellerVerification />} />

                  {/* Protected routes for verified farmers only */}
                  <Route path="/dashboard" element={
                    <FarmerRoute>
                      <DashboardLayout>
                        <Outlet />
                      </DashboardLayout>
                    </FarmerRoute>
                  }>
                    <Route path="products" element={<Products />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/:id" element={<ProductForm />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route
                      path="admin-verification"
                      element={
                        <AdminRoute>
                          <AdminVerification />
                        </AdminRoute>
                      }
                    />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster />
            </BrowserRouter>
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
