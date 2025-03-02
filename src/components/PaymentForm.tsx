
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Check } from "lucide-react";

interface PaymentFormProps {
  amount: number;
  onPaymentComplete: (paymentId: string) => void;
  onCancel: () => void;
}

const PaymentForm = ({ amount, onPaymentComplete, onCancel }: PaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      
      // Generate a fake payment ID
      const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
      
      // Notify parent component about successful payment
      setTimeout(() => {
        onPaymentComplete(paymentId);
      }, 1500);
    }, 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Enter your card information to complete the purchase</CardDescription>
      </CardHeader>
      {isComplete ? (
        <CardContent className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Payment Successful</h3>
          <p className="text-gray-500">Your payment has been processed successfully</p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholder-name">Cardholder Name</Label>
              <Input
                id="cardholder-name"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <div className="relative">
                <Input
                  id="card-number"
                  value={cardNumber}
                  onChange={(e) => {
                    // Only allow digits and format with spaces every 4 digits
                    const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                    setCardNumber(value);
                  }}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  required
                />
                <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  value={expiryDate}
                  onChange={(e) => {
                    // Format as MM/YY
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 2) {
                      setExpiryDate(value);
                    } else {
                      setExpiryDate(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
                    }
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cvv">Security Code (CVV)</Label>
                <Input
                  id="cvv"
                  type="password" 
                  value={cvv}
                  onChange={(e) => {
                    // Only allow up to 3 digits
                    const value = e.target.value.replace(/\D/g, '');
                    setCvv(value.slice(0, 3));
                  }}
                  placeholder="123"
                  maxLength={3}
                  required
                />
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-xl font-bold">${amount.toFixed(2)}</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full" 
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
};

export default PaymentForm;
