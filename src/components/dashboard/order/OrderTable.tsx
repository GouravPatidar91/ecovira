
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  buyer_name: string;
  order_items: {
    id: string;
    quantity: number;
    product_name: string;
    product_unit: string;
    unit_price: number;
    total_price: number;
  }[];
  is_new?: boolean;
}

interface OrderTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: string) => void;
  onMarkAsViewed: (orderId: string) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onUpdateStatus, onMarkAsViewed }) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No order requests found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow 
                key={order.id} 
                className={order.is_new ? "bg-market-50 border-l-4 border-l-market-500" : ""}
                onClick={() => {
                  if (order.is_new) onMarkAsViewed(order.id);
                }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                    {order.is_new && (
                      <Badge className="ml-2 bg-market-600 text-white">
                        New Request
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="font-medium">{order.buyer_name || 'Unknown'}</span>
                          </div>
                          {order.shipping_address && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[150px]">
                                {order.shipping_address}
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="p-2">
                          <div className="font-medium">{order.buyer_name}</div>
                          {order.shipping_address && (
                            <div className="text-sm mt-1">
                              <strong>Delivery to:</strong><br />
                              {order.shipping_address}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                  <Badge className={`border ${getStatusBadgeColor(order.status || 'pending')}`}>
                    {order.status === 'pending' ? 'Awaiting Response' : 
                     order.status === 'processing' ? 'Accepted' :
                     order.status === 'cancelled' ? 'Declined' :
                     order.status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.status === 'pending' ? (
                    <div className="flex space-x-2">
                      <Button 
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onUpdateStatus(order.id, 'processing')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={order.status || 'pending'}
                      onValueChange={(value) => onUpdateStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Accepted</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Declined</SelectItem>
                      </SelectContent>
                    </Select>
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

export default OrderTable;
