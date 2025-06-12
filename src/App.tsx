
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CartProvider } from '@/contexts/CartContext';
import Market from '@/pages/Market';
import ProductDetails from '@/pages/ProductDetails';
import OrderConfirmation from '@/pages/OrderConfirmation';
import Farmers from '@/pages/Farmers';
import Dashboard from '@/pages/dashboard';
import Products from '@/pages/dashboard/Products';
import CreateProduct from '@/pages/dashboard/CreateProduct';
import EditProduct from '@/pages/dashboard/EditProduct';
import Orders from '@/pages/dashboard/Orders';
import OrderPaymentProcess from '@/pages/OrderPaymentProcess';
import Chat from '@/pages/Chat';
import BuyerOrders from "@/pages/dashboard/BuyerOrders";
import Auth from '@/pages/Auth';
import Home from '@/pages/Home';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/market" element={<Market />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/farmers" element={<Farmers />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/payment/process" element={<OrderPaymentProcess />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/products" element={<Products />} />
            <Route path="/dashboard/products/new" element={<CreateProduct />} />
            <Route path="/dashboard/products/edit/:id" element={<EditProduct />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/dashboard/my-orders" element={<BuyerOrders />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
