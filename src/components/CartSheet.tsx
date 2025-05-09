
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

      // 3. Create the order first
      const orderData = {
        buyer_id: session.user.id,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: 'pending',
        payment_status: 'pending'
      };
      
      console.log("Creating order with data:", orderData);
      
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

      if (orderError) {
        console.error('Order creation error details:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      if (!newOrder || !newOrder.id) {
        console.error('Order created but no ID returned');
        throw new Error("Order processing error: No order ID returned");
      }
      
      console.log("Order created successfully with ID:", newOrder.id);
      
      // 4. Prepare and insert order items
      const orderItems = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));
      
      console.log("Creating order items:", orderItems);
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items insertion error:', itemsError);
        
        // Clean up the order if items couldn't be added
        await supabase.from('orders').delete().eq('id', newOrder.id);
        
        throw new Error(`Failed to add items to your order: ${itemsError.message}`);
      }

      // 5. Order created successfully
      console.log("Order completed successfully");
      await clearCart();
      setIsCheckoutDialogOpen(false);
      setSheetOpen(false);
      
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been sent to sellers for approval",
      });
      
      // Instead of redirecting to the market page, let's take them to the payment processing page
      navigate(`/payment?address=${encodeURIComponent(shippingAddress)}`);
      
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
                Place Order
              </Button>
            </div>
          </div>
        )}
      </SheetContent>

      <AlertDialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete your order</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide your shipping address to place your order. The sellers will review your order and confirm availability.
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
                'Place Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
