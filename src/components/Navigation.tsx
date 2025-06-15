
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CartSheet } from "@/components/CartSheet";
import {
  Home,
  Menu,
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
import { motion } from "framer-motion";

const motionVariants = {
  hidden: { y: -30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 22, duration: 0.8 } }
};

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

  const userProfile = user ? {
    avatar_url: undefined,
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionVariants}
      className="bg-gradient-to-r from-zinc-800 via-slate-900 to-zinc-700 border-b border-zinc-700 shadow-lg sticky top-0 z-50 backdrop-blur-lg"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-black text-2xl text-white tracking-widest urban-gradient-text">
          AgriChain
        </Link>
        <div className="hidden md:flex items-center space-x-4">
          {navigationItems.map(
            (item, index) =>
              (!item.requireAuth || user) && (
                <Link
                  key={index}
                  to={item.href}
                  className="text-gray-200 hover:text-market-300 transition-colors duration-200 flex items-center space-x-2 px-3 py-2 rounded-xl urban-menu font-semibold hover-scale"
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
                    <AvatarFallback>
                      {userProfile?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-900 text-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{userProfile?.full_name || user.email}</p>
                    <p className="text-xs leading-none text-zinc-400">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem className="hover:bg-market-700" onClick={() => navigate("/my-orders")}>
                  <Package className="mr-2 h-4 w-4" />
                  My Orders
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-market-700" onClick={() => navigate("/dashboard/products")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-market-700" onClick={() => navigate("/chats")}>Messages</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem className="hover:bg-destructive text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:block">
              <Link
                to="/auth"
                className="text-market-300 font-bold px-4 py-2 rounded-xl hover:bg-market-500 hover:text-white transition"
              >
                Sign In
              </Link>
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-zinc-900 border-zinc-700">
                <Menu className="h-4 w-4 text-market-300" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-64 bg-zinc-900 text-white urban-menu">
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
                        className="block py-2 px-3 rounded hover:bg-market-700 font-semibold"
                      >
                        {item.name}
                      </Link>
                    )
                )}
                {!user ? (
                  <Link
                    to="/auth"
                    className="block py-2 px-3 font-bold rounded hover:bg-market-600"
                  >
                    Sign In
                  </Link>
                ) : (
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.div>
  );
};

export default NavBar;
