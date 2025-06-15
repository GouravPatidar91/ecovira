import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Package, Calendar, MapPin, CreditCard } from "lucide-react";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import PayOrderButton from "@/components/orders/PayOrderButton";
import { motion } from "framer-motion";
import UrbanOrderCard from "@/components/UrbanOrderCard";

const MyOrders = () => {
  const { user } = useAuth();
  const { orders, isLoading, refetch } = useBuyerOrders();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600">You need to be signed in to view your orders.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const shouldShowPayButton = (order: any) => {
    return order.status === 'processing' && order.payment_status === 'pending';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-market-900 to-market-800 transition-colors duration-300">
      <Navigation />
      <div className="container mx-auto px-3 py-8">
        <div className="mb-8">
          <motion.h1
            className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
          >
            My Orders
          </motion.h1>
          <p className="text-market-200 text-base">
            View your order history and track your purchases
          </p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-28">
            <motion.div
              className="rounded-full bg-gradient-to-tr from-market-700 via-zinc-700 to-zinc-900 shadow-lg p-5"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.95, ease: "linear" }}
            >
              <Loader2 className="h-10 w-10 animate-none text-market-300" />
            </motion.div>
            <span className="ml-3 text-market-300 text-lg font-medium animate-pulse">Loading your orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            className="max-w-xl mx-auto mt-20"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <UrbanOrderCard>
              <CardContent className="py-14">
                <div className="text-center">
                  <Package className="h-14 w-14 text-market-400 mx-auto mb-4 animate-fade-in" />
                  <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
                  <p className="text-market-200">When you place orders, they'll appear here.</p>
                </div>
              </CardContent>
            </UrbanOrderCard>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } }
            }}
          >
            {orders.map((order) => (
              <motion.div
                key={order.id}
                variants={{
                  hidden: { y: 40, opacity: 0, scale: 0.98 },
                  visible: {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.42, type: "spring", damping: 20, stiffness: 205 }
                  }
                }}
              >
                <UrbanOrderCard>
                  <CardHeader className="bg-transparent border-b border-market-400/15">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                      <div>
                        <CardTitle className="text-lg text-market-100 font-bold">Order #{order.id.slice(0, 8)}</CardTitle>
                        <div className="flex items-center text-sm text-market-300 mt-1 gap-1.5">
                          <Calendar className="h-4 w-4 mr-1 text-market-300" />
                          {format(new Date(order.created_at), 'PPP')}
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-bold uppercase tracking-wide text-xs drop-shadow shadow-market-900 transition-all ${
                            {
                              'pending': 'bg-yellow-500/15 text-yellow-200 border border-yellow-300/40 shadow-yellow-400/10 animate-pulse',
                              'processing': 'bg-blue-500/10 text-blue-200 border border-blue-200/30 animate-fade-in',
                              'shipped': 'bg-purple-500/10 text-purple-200 border border-purple-200/30',
                              'delivered': 'bg-green-500/10 text-green-200 border border-green-200/20 animate-fade-in',
                              'cancelled': 'bg-red-400/10 text-red-200 border border-red-200/15'
                            }[order.status.toLowerCase()] || 'bg-zinc-700/20 text-zinc-200'
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs uppercase border transition-all ${
                            {
                              'pending': 'bg-yellow-500/15 text-yellow-200 border-yellow-300/40',
                              'paid': 'bg-green-400/10 text-green-200 border border-green-200/20 animate-fade-in',
                              'failed': 'bg-red-500/15 text-red-200 border-red-200/15'
                            }[order.payment_status.toLowerCase()] || 'bg-zinc-700/10 text-zinc-200'
                          }`}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {order.payment_status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-3">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Order Items */}
                      <div className="lg:col-span-2">
                        <h4 className="font-medium text-market-100 mb-4">Items Ordered</h4>
                        <div className="space-y-3">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-white">{item.product_name}</p>
                                <p className="text-xs text-market-300">
                                  Sold by: {item.seller_name}
                                </p>
                                <p className="text-xs text-market-300">
                                  Quantity: {item.quantity} {item.product_unit}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-market-100">${item.total_price.toFixed(2)}</p>
                                <p className="text-xs text-market-300">
                                  ${item.unit_price.toFixed(2)} per {item.product_unit}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Order Summary */}
                      <div className="border-l border-market-400/25 pl-6">
                        <h4 className="font-medium text-market-100 mb-3">Order Summary</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-market-300">Total Amount:</span>
                            <span className="font-semibold text-white">${order.total_amount.toFixed(2)}</span>
                          </div>
                          {shouldShowPayButton(order) && (
                            <div className="pt-2">
                              <PayOrderButton
                                orderId={order.id}
                                totalAmount={order.total_amount}
                                shippingAddress={order.shipping_address || ''}
                                orderItems={order.order_items || []}
                                orderDate={order.created_at}
                                onPaymentComplete={() => refetch()}
                              />
                            </div>
                          )}
                          <Separator className="bg-market-400/20" />
                          <div>
                            <div className="flex items-start gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-market-300 mt-0.5" />
                              <span className="text-xs font-medium text-market-100">Shipping Address:</span>
                            </div>
                            <p className="text-xs text-market-200 ml-6">
                              {order.shipping_address || 'No address provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </UrbanOrderCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
