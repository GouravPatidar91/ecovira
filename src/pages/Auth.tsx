import Navigation from "@/components/Navigation";
import AuthForm from "@/components/AuthForm";
import { CartProvider } from "@/contexts/cart";

const Auth = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <AuthForm />
        </div>
      </div>
    </CartProvider>
  );
};

export default Auth;
