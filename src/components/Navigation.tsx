
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { title: "Market", href: "/market" },
    { title: "About", href: "/about" },
    { title: "Farmers", href: "/farmers" },
    { title: "Contact", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-semibold text-market-600">
              FarmFresh
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="text-gray-600 hover:text-market-600 transition-colors duration-200"
              >
                {item.title}
              </a>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-market-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                0
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  {isOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-4">
                  {menuItems.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      className="text-lg text-gray-600 hover:text-market-600 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
