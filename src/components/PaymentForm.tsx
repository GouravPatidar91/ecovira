
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Check, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface PaymentFormProps {
  amount: number;
  onPaymentComplete: (paymentId: string, transactionDetails: any) => void;
  onCancel: () => void;
}

const PaymentForm = ({ amount, onPaymentComplete, onCancel }: PaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");

  const validateForm = () => {
    if (!cardholderName.trim()) {
      setError("Cardholder name is required");
      return false;
    }
    
    if (cardNumber.replace(/\s/g, "").length !== 16) {
      setError("Invalid card number (must be 16 digits)");
      return false;
    }
    
    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError("Invalid expiry date (format: MM/YY)");
      return false;
    }
    
    if (cvv.length !== 3) {
      setError("Invalid CVV (must be 3 digits)");
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Generate a transaction ID
    const txId = `tx_${Math.random().toString(36).substring(2, 15)}`;
    setTransactionId(txId);
    setIsConfirming(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setError(null);
    
    // Simulate payment processing with a mock API call
    setTimeout(() => {
      // Simulate success (95% of the time) or failure
      const isSuccess = Math.random() > 0.05;
      
      if (isSuccess) {
        setIsProcessing(false);
        setIsComplete(true);
        
        // Generate a fake payment ID and transaction details
        const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
        const transactionDetails = {
          id: transactionId,
          timestamp: new Date().toISOString(),
          cardLast4: cardNumber.replace(/\s/g, "").slice(-4),
          cardType: getCardType(cardNumber),
          amount: amount
        };
        
        // Notify parent component about successful payment
        setTimeout(() => {
          onPaymentComplete(paymentId, transactionDetails);
        }, 1500);
      } else {
        setIsProcessing(false);
        setError("Payment was declined. Please try a different payment method.");
        setIsConfirming(false);
      }
    }, 2000);
  };

  const getCardType = (number: string) => {
    // Simple card type detection
    const firstDigit = number.replace(/\s/g, "").charAt(0);
    if (firstDigit === "4") return "Visa";
    if (firstDigit === "5") return "MasterCard";
    if (firstDigit === "3") return "American Express";
    if (firstDigit === "6") return "Discover";
    return "Unknown";
  };

  const handleBackToEdit = () => {
    setIsConfirming(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Enter your card information to complete the purchase</CardDescription>
      </CardHeader>
      
      {error && (
        <CardContent className="pt-0">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      )}
      
      {isComplete ? (
        <CardContent className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Payment Successful</h3>
          <p className="text-gray-500">Your payment has been processed successfully</p>
          <div className="mt-4 bg-gray-50 p-3 rounded-md text-sm">
            <p className="text-gray-700">Transaction ID: {transactionId}</p>
            <p className="text-gray-700">Amount: ${amount.toFixed(2)}</p>
          </div>
        </CardContent>
      ) : isConfirming ? (
        <CardContent className="space-y-6">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Please confirm your payment</h3>
            <p className="text-sm text-gray-600 mb-2">You are about to make a payment of <span className="font-bold">${amount.toFixed(2)}</span></p>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Card number:</span> •••• •••• •••• {cardNumber.slice(-4)}</p>
              <p><span className="text-gray-500">Cardholder:</span> {cardholderName}</p>
              <p><span className="text-gray-500">Card type:</span> {getCardType(cardNumber)}</p>
              <p><span className="text-gray-500">Transaction ID:</span> {transactionId}</p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleConfirmPayment} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing payment...
                </>
              ) : (
                `Confirm Payment of $${amount.toFixed(2)}`
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToEdit}
              disabled={isProcessing}
            >
              Back to Edit
            </Button>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleInitialSubmit}>
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
              Review Payment
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
