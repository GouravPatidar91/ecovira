
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/CartSheet";
import {
  Home,
  Menu,
  Search,
  User,
  LogOut,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { toast } = useToast();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      clearCart();
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // User profile data from Supabase profile
  const userProfile = user ? {
    avatar_url: undefined, // Will be populated from user metadata
    full_name: undefined,
    email: user.email
  } : null;

  const navigationItems = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="h-4 w-4" />,
      requireAuth: false,
    },
    {
      name: "Market",
      href: "/market",
      icon: <ShoppingBag className="h-4 w-4" />,
      requireAuth: false,
    },
    {
      name: "Farmers",
      href: "/farmers",
      icon: <User className="h-4 w-4" />,
      requireAuth: false,
    },
    {
      name: "Dashboard",
      href: "/dashboard/products",
      icon: <User className="h-4 w-4" />,
      requireAuth: true,
    },
    {
      name: "Messages",
      href: "/chats",
      icon: <MessageCircle className="h-4 w-4" />,
      requireAuth: true,
    },
  ];

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl text-gray-800">
          EcoVira
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {navigationItems.map(
            (item, index) =>
              (!item.requireAuth || user) && (
                <Link
                  key={index}
                  to={item.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center space-x-2"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <CartSheet />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-8 h-8 rounded-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback>{userProfile?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.full_name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/products")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/chats")}>Messages</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:block">
              <Link
                to="/auth"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Sign In
              </Link>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Explore our site and manage your account.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                {navigationItems.map(
                  (item, index) =>
                    (!item.requireAuth || user) && (
                      <Link
                        key={index}
                        to={item.href}
                        className="block py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                      >
                        {item.name}
                      </Link>
                    )
                )}
                {!user ? (
                  <Link
                    to="/auth"
                    className="block py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                ) : (
                  <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
