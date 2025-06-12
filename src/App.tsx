import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Account from '@/pages/Account';
import Home from '@/pages/Home';
import Market from '@/pages/Market';
import ProductDetails from '@/pages/ProductDetails';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CartProvider } from '@/contexts/CartContext';
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

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/market" element={<Market />} />
          <Route exact path="/product/:id" element={<ProductDetails />} />
          <Route exact path="/farmers" element={<Farmers />} />
          <Route exact path="/order-confirmation" element={<OrderConfirmation />} />
          <Route exact path="/payment/process" element={<OrderPaymentProcess />} />
          <Route exact path="/chat" element={<Chat />} />
          <Route
            exact
            path="/auth"
            element={
              <div className="flex justify-center items-center min-h-screen">
                <div className="w-full max-w-md">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo={`${window.location.origin}/account`}
                  />
                </div>
              </div>
            }
          />
          <Route
            path="/account"
            element={
              <CartProvider>
                <Navigation />
                <Account />
                <Footer />
              </CartProvider>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/products" element={<Products />} />
          <Route path="/dashboard/products/new" element={<CreateProduct />} />
          <Route path="/dashboard/products/edit/:id" element={<EditProduct />} />
          <Route path="/dashboard/orders" element={<Orders />} />
          <Route path="/dashboard/my-orders" element={<BuyerOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
