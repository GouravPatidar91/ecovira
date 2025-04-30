
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, ShoppingBag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

export function CartSheet() {
  const { items, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative" onClick={() => setIsOpen(true)}>
          <ShoppingBag className="h-5 w-5" />
          <span className="ml-2">Cart</span>
          {items.length > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] md:w-[500px] lg:w-[600px]">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {loading ? (
            <div className="text-center py-4">Loading cart...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-4">Your cart is empty.</div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_100px] gap-4 py-4">
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} / {item.unit}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product_id)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div>{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="mt-4">
          <Separator />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xl font-bold">Total</p>
            <p className="text-xl font-bold">{formatCurrency(calculateTotal())}</p>
          </div>
          <Button className="w-full mt-4">
            Checkout
          </Button>
          <Button variant="outline" className="w-full mt-2" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
