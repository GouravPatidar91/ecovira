
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShoppingCart, Minus, Plus, Loader2, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CartSheet() {
  const { state: { items, loading }, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity > 0) {
      await updateQuantity(itemId, newQuantity);
    } else {
      await removeFromCart(itemId);
    }
  };

  const notifySellers = async (orderId: string, orderItems: any[]) => {
    try {
      // Group items by seller
      const sellerGroups: { [sellerId: string]: any[] } = {};
      
      for (const item of orderItems) {
        // Get product details to find seller
        const { data: product } = await supabase
          .from('products')
          .select('seller_id, name')
          .eq('id', item.product_id)
          .single();
          
        if (product && product.seller_id) {
          if (!sellerGroups[product.seller_id]) {
            sellerGroups[product.seller_id] = [];
          }
          sellerGroups[product.seller_id].push({
            ...item,
            product_name: product.name
          });
        }
      }
      
      // Create notifications for each seller
      for (const sellerId of Object.keys(sellerGroups)) {
        const sellerItems = sellerGroups[sellerId];
        const itemNames = sellerItems.map(item => `${item.quantity}x ${item.product_name}`).join(', ');
        
        // Insert notification record (you could create a notifications table)
        // For now, we'll just log it and rely on the real-time subscription
        console.log(`Notifying seller ${sellerId} about order ${orderId} with items: ${itemNames}`);
        
        // The seller dashboard will pick up the new order through real-time subscription
        // and show it in their orders list automatically
      }
    } catch (error) {
      console.error('Error notifying sellers:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      toast({
        title: "Missing Address",
        description: "Please provide a shipping address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Starting order placement process");
      
      // 1. Check if user is authenticated
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Authentication error");
      }
      
      if (!data || !data.session) {
        console.error("No active session found");
        toast({
          title: "Authentication Required",
          description: "Please login to complete your order",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      const session = data.session;
      console.log("User authenticated successfully:", session.user.id);

      // 2. Validate cart items
      if (items.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Your cart is empty. Please add items before checking out.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("Placing order with items:", items);
      console.log("Shipping address:", shippingAddress);

      // 3. Generate UUID on client side to avoid any RLS issues
      const newOrderId = crypto.randomUUID();
      console.log("Generated order ID:", newOrderId);

      // 4. Use the create_order RPC function to bypass RLS completely
      const { data: orderResult, error: orderError } = await supabase.rpc(
        'create_order',
        { 
          p_buyer_id: session.user.id,
          p_total_amount: totalAmount,
          p_shipping_address: shippingAddress,
          p_order_id: newOrderId
        }
      );

      if (orderError) {
        console.error('Order creation error via RPC:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      console.log("Order created successfully with ID:", orderResult || newOrderId);
      const finalOrderId = orderResult || newOrderId;
      
      // 5. Create order items using the new RPC function to avoid RLS recursion
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));
      
      console.log("Creating order items via RPC:", orderItems);
      
      const { error: itemsError } = await supabase.rpc(
        'create_order_items',
        {
          p_order_id: finalOrderId,
          p_items: orderItems
        }
      );

      if (itemsError) {
        console.error('Order items creation error via RPC:', itemsError);
        throw new Error(`Failed to add items to your order: ${itemsError.message}`);
      }

      // 6. Notify sellers about the new order
      await notifySellers(finalOrderId, orderItems);

      // 7. Order created successfully
      console.log("Order completed successfully");
      await clearCart();
      setIsCheckoutDialogOpen(false);
      setSheetOpen(false);
      
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been sent to the sellers for approval. You'll be notified once they respond.",
      });
      
      // Navigate to a confirmation page instead of payment
      navigate(`/order-confirmation?orderId=${finalOrderId}`);
      
    } catch (error) {
      console.error('Order placement error:', error);
      toast({
        title: "Order Processing Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-market-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            Shopping Cart
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Cart
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <ShoppingCart className="h-8 w-8 mb-2" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4">
                <div className="relative h-16 w-16 rounded-md overflow-hidden">
                  <img
                    src={item.image || "https://via.placeholder.com/64"}
                    alt={item.name}
                    className="object-cover h-full w-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    ${item.price} per {item.unit}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-red-500 hover:text-red-600 mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              
              <Button 
                className="w-full mt-4"
                onClick={() => setIsCheckoutDialogOpen(true)}
                disabled={items.length === 0}
              >
                Request Order
              </Button>
            </div>
          </div>
        )}
      </SheetContent>

      <AlertDialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request your order</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide your shipping address to request your order. The sellers will review your request and either accept or decline it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shipping">Shipping Address</Label>
              <Input
                id="shipping"
                placeholder="Enter your shipping address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-gray-500">
              Total amount: ${totalAmount.toFixed(2)} (payment will be arranged after seller approval)
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePlaceOrder}
              disabled={isProcessing || !shippingAddress.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Send Order Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
