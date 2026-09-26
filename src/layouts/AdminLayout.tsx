import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import {
  SidebarProvider,
  SidebarInset,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Leaf,
  LayoutDashboard,
  Globe,
  Building2,
  Tag,
  Package,
  FileWarning,
  Link2,
  ChevronUp,
  LogOut,
  Moon,
  Sun,
  Shield,
  Users,
  Newspaper,
} from "lucide-react";
import { useState, useEffect } from "react";

const mainNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
];

const dataNavItems = [
  { title: "Countries", url: "/admin/countries", icon: Globe },
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Brands", url: "/admin/brands", icon: Tag },
  { title: "Sản phẩm", url: "/admin/products", icon: Package },
  { title: "Aliases", url: "/admin/aliases", icon: Link2 },
  { title: "Classifications", url: "/admin/classifications", icon: Shield },
];

const operationsNavItems = [
  { title: "Tin tức", url: "/admin/news", icon: Newspaper },
  { title: "Reports", url: "/admin/reports", icon: FileWarning },
  { title: "Users", url: "/admin/users", icon: Users },
];

function getBreadcrumbTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/countries": "Countries",
    "/admin/companies": "Companies",
    "/admin/brands": "Brands",
    "/admin/products": "Sản phẩm",
    "/admin/aliases": "Aliases",
    "/admin/classifications": "Classifications",
    "/admin/reports": "Reports",
    "/admin/users": "Users",
  };
  // Handle nested routes
  for (const key of Object.keys(map)) {
    if (pathname.startsWith(key) && key !== "/admin") return map[key];
  }
  return map[pathname] || "Dashboard";
}

export default function AdminLayout() {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/login");
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD";

  const breadcrumb = getBreadcrumbTitle(location.pathname);

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <NavLink to="/admin">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Leaf className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      My Little Olive
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      Admin Panel
                    </span>
                  </div>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* Main */}
          <SidebarGroup>
            <SidebarGroupLabel>Tổng quan</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : ""
                        }
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Data Management */}
          <SidebarGroup>
            <SidebarGroupLabel>Quản lý dữ liệu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dataNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : ""
                        }
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Operations */}
          <SidebarGroup>
            <SidebarGroupLabel>Vận hành</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationsNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : ""
                        }
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {profile?.full_name || "Admin"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground capitalize">
                        {profile?.role?.replace("_", " ") || "admin"}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuItem onClick={() => setIsDark(!isDark)}>
                    {isDark ? (
                      <Sun className="size-4 mr-2" />
                    ) : (
                      <Moon className="size-4 mr-2" />
                    )}
                    {isDark ? "Chế độ sáng" : "Chế độ tối"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumb}</BreadcrumbPage>
                </BreadcrumbItem>
                {location.pathname.includes("/new") && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Tạo mới</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
                {location.pathname.includes("/edit") && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Chỉnh sửa</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
