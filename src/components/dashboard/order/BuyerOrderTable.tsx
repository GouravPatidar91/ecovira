
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  MapPin
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface OrderItem {
  id: string;
  quantity: number;
  product_name: string;
  product_unit: string;
  unit_price: number;
  total_price: number;
}

interface BuyerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  order_items: OrderItem[];
}

interface BuyerOrderTableProps {
  orders: BuyerOrder[];
}

const BuyerOrderTable: React.FC<BuyerOrderTableProps> = ({ orders }) => {
  const navigate = useNavigate();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handlePayNow = (orderId: string) => {
    navigate(`/payment/process?orderId=${orderId}`);
  };

  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Details</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {order.shipping_address && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[120px]">
                                {order.shipping_address}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <strong>Delivery Address:</strong><br />
                              {order.shipping_address}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <span className="font-medium">{item.quantity}x</span> {item.product_name}
                        <span className="text-gray-500 ml-1">({item.product_unit})</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-lg">${order.total_amount?.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <Badge className={`border flex items-center gap-1 w-fit ${getStatusBadgeColor(order.status || 'pending')}`}>
                    {getStatusIcon(order.status || 'pending')}
                    {order.status === 'pending' ? 'Awaiting Seller' : 
                     order.status === 'processing' ? 'Accepted' :
                     order.status === 'completed' ? 'Completed' :
                     order.status === 'cancelled' ? 'Declined' :
                     'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`border flex items-center gap-1 w-fit ${getPaymentStatusBadgeColor(order.payment_status || 'pending')}`}>
                    <CreditCard className="h-3 w-3" />
                    {order.payment_status === 'pending' ? 'Pending' :
                     order.payment_status === 'paid' ? 'Paid' :
                     order.payment_status === 'failed' ? 'Failed' :
                     'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.status === 'processing' && order.payment_status === 'pending' && (
                    <Button 
                      size="sm"
                      className="bg-market-600 hover:bg-market-700"
                      onClick={() => handlePayNow(order.id)}
                    >
                      Pay Now
                    </Button>
                  )}
                  {order.status === 'pending' && (
                    <span className="text-sm text-gray-500">Waiting for seller response</span>
                  )}
                  {order.status === 'cancelled' && (
                    <span className="text-sm text-red-600">Order declined</span>
                  )}
                  {order.status === 'completed' && (
                    <span className="text-sm text-green-600">Order complete</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BuyerOrderTable;
