import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Building2,
  Tag,
  Package,
  FileWarning,
  Link2,
  Barcode,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const stats = [
  {
    title: "Countries",
    value: "—",
    description: "Quốc gia đã phân loại",
    icon: Globe,
    href: "/admin/countries",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Companies",
    value: "—",
    description: "Công ty / tập đoàn",
    icon: Building2,
    href: "/admin/companies",
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Brands",
    value: "—",
    description: "Nhãn hàng quản lý",
    icon: Tag,
    href: "/admin/brands",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Products",
    value: "—",
    description: "Sản phẩm trong hệ thống",
    icon: Package,
    href: "/admin/products",
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Barcodes",
    value: "—",
    description: "Mã vạch đã liên kết",
    icon: Barcode,
    href: "/admin/barcodes",
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Reports",
    value: "—",
    description: "Báo cáo cần xử lý",
    icon: FileWarning,
    href: "/admin/reports",
    color: "from-red-500 to-orange-500",
  },
];

const quickActions = [
  { title: "Thêm Brand mới", href: "/admin/brands/new", icon: Tag },
  { title: "Thêm Company", href: "/admin/companies/new", icon: Building2 },
  { title: "Thêm Sản phẩm", href: "/admin/products/new", icon: Package },
  { title: "Quản lý Aliases", href: "/admin/aliases", icon: Link2 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tổng quan hệ thống quản trị My Little Olive
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <NavLink to={stat.href} key={stat.title} className="group">
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/50 hover:border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </CardContent>
            </Card>
          </NavLink>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Thao tác nhanh
            </CardTitle>
            <CardDescription>Các tác vụ thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((action) => (
              <NavLink
                to={action.href}
                key={action.title}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-all hover:bg-accent hover:text-accent-foreground group"
              >
                <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                <span className="flex-1">{action.title}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-500" />
              Pending Reports
            </CardTitle>
            <CardDescription>Báo cáo chờ xử lý gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-center h-32 rounded-lg border border-dashed text-muted-foreground text-sm">
                <div className="text-center">
                  <p>Kết nối Supabase để xem dữ liệu</p>
                  <Badge variant="outline" className="mt-2">
                    Cần cấu hình .env
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
