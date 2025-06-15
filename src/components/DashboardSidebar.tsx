
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Package, List, ShoppingCart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  {
    title: "Products",
    path: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Orders",
    path: "/dashboard/orders",
    icon: List,
  },
  {
    title: "Inventory",
    path: "/dashboard/inventory",
    icon: ShoppingCart,
  },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarContent>
        <aside
          className="
            h-full
            px-2 py-4
            rounded-2xl 
            border border-market-700/60
            shadow-xl
            bg-white/10 backdrop-blur-md
            md:bg-market-800/70
            md:backdrop-blur-xl
            transition-colors
            flex flex-col
            min-h-0
            "
        >
          <SidebarGroup>
            <SidebarGroupLabel className="text-xl font-bold text-market-200 pb-2 tracking-wide">
              Dashboard
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={location.pathname.startsWith(item.path)}
                      onClick={() => navigate(item.path)}
                      className={`
                        flex items-center gap-3 px-3 py-2
                        rounded-lg 
                        text-sm font-medium
                        transition
                        ${location.pathname.startsWith(item.path)
                          ? "bg-market-600/90 text-white shadow"
                          : "hover:bg-market-700/40 hover:text-white text-market-200"
                        }
                        `}
                    >
                      <item.icon className="mr-2 h-5 w-5 opacity-80" />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </aside>
      </SidebarContent>
    </Sidebar>
  );
}

export default DashboardSidebar;
