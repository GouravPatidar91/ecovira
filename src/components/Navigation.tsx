import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CartSheet } from "@/components/CartSheet";
import {
  Home,
  Menu,
  Search,
  User,
  LogOut,
  ShoppingBag,
  MessageCircle,
  Package,
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
  const { toast } = useToast();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
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
      name: "My Orders",
      href: "/my-orders",
      icon: <Package className="h-4 w-4" />,
      requireAuth: true,
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
    <nav className="sticky top-0 z-50 bg-glass-card/80 backdrop-blur-lg border-b border-agri-100 shadow-md">
      <div className="container mx-auto h-16 flex items-center justify-between">
        <Link to="/" className="font-black text-2xl font-agri flex items-center gap-2 text-agri-700">
          <span role="img" aria-label="Sprout" className="text-agri-500">🌱</span>
          AgriChain
        </Link>
        <div className="hidden md:flex items-center gap-3">
          {navigationItems.map(
            (item, index) =>
              (!item.requireAuth || user) && (
                <Link
                  key={index}
                  to={item.href}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-agri-700 hover:bg-agri-100 font-semibold transition"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <CartSheet />
          </div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-9 h-9 rounded-full border border-agri-200 bg-agri-100 hover:bg-agri-200 shadow-soft ring-1 ring-agri-100/60">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userProfile?.avatar_url} />
                    <AvatarFallback>
                      {userProfile?.full_name?.charAt(0) || user.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/90 backdrop-blur-lg shadow-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.full_name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/my-orders")}>
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
                </DropdownMenuItem>
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
            <Link
              to="/auth"
              className="py-1 px-4 bg-agri-500 hover:bg-agri-600 text-white rounded-lg font-bold transition"
            >
              Sign In
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden border-agri-200">
                <Menu className="h-5 w-5 text-agri-500" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-glass-card w-full sm:w-64 border-r border-agri-200">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Explore our site and manage your account.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-2">
                {navigationItems.map(
                  (item, index) =>
                    (!item.requireAuth || user) && (
                      <Link
                        key={index}
                        to={item.href}
                        className="block py-2 px-3 rounded text-agri-700 hover:bg-agri-100 font-semibold"
                      >
                        {item.name}
                      </Link>
                    )
                )}
                {!user ? (
                  <Link
                    to="/auth"
                    className="block py-2 px-3 rounded text-agri-700 hover:bg-agri-100 font-semibold"
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
    </nav>
  );
};

export default NavBar;
