import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { usePagination } from "@/hooks/use-pagination";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface AdminProfile {
  id: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  admin: { label: "Admin", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  content_editor: { label: "Editor", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  content_reviewer: { label: "Reviewer", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

const columns: Column<AdminProfile>[] = [
  {
    key: "full_name",
    title: "Người dùng",
    render: (val) => {
      const name = String(val || "Anonymous");
      const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      );
    },
  },
  {
    key: "role",
    title: "Vai trò",
    render: (val) => {
      const config = roleConfig[String(val)];
      return config ? <Badge className={config.className}>{config.label}</Badge> : <Badge variant="secondary">{String(val)}</Badge>;
    },
  },
  {
    key: "is_active",
    title: "Trạng thái",
    render: (val) => (
      <Badge variant={val ? "default" : "destructive"} className={val ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>
        {val ? "Hoạt động" : "Vô hiệu"}
      </Badge>
    ),
  },
  { key: "created_at", title: "Ngày tạo", render: (val) => new Date(String(val)).toLocaleDateString("vi-VN") },
];

export default function UsersPage() {
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("admin_profiles").select("*", { count: "exact" });
      if (search) {
        query = query.ilike("full_name", `%${search}%`);
      }
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setUsers(data as AdminProfile[]);
      setTotal(count || 0);
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [range, search]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("admin_profiles").update({ is_active: false }).eq("id", id);
      if (error) throw error;
      toast.success("Đã vô hiệu hoá"); fetchItems();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
  };

  return (
    <DataTablePage title="Users" description="Quản lý tài khoản admin — Chỉ Super Admin" columns={columns} data={users} isLoading={isLoading}
      getRowId={(row) => row.id} searchPlaceholder="Tìm kiếm user..." addLabel="Thêm user" 
      total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} onSearch={setSearch} onRefresh={fetchItems}
      onDelete={(row) => handleDelete(row.id)} />
  );
}
