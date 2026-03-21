import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { BrandClassification } from "@/types";

const columns: Column<BrandClassification>[] = [
  { key: "code", title: "Code", render: (val) => <Badge variant="outline" className="font-mono">{String(val)}</Badge> },
  { key: "name", title: "Tên phân loại", render: (val) => <span className="font-medium">{String(val)}</span> },
  { key: "description", title: "Mô tả", render: (val) => <span className="text-sm text-muted-foreground line-clamp-2">{String(val || "—")}</span> },
  {
    key: "color_code", title: "Màu",
    render: (val) => val ? (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: String(val) }} />
        <code className="text-xs">{String(val)}</code>
      </div>
    ) : <span className="text-muted-foreground text-sm">—</span>,
  },
  {
    key: "is_deleted", title: "Trạng thái",
    render: (val) => <Badge variant={val ? "destructive" : "default"} className={!val ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>{val ? "Đã xoá" : "Hoạt động"}</Badge>,
  },
];

function ClassificationForm({ row, onClose, onSuccess }: { row: BrandClassification | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    code: row?.code || "", name: row?.name || "", description: row?.description || "", color_code: row?.color_code || "#000000",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("brand_classifications").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_classifications").insert(formData);
        if (error) throw error;
      }
      toast.success(row ? "Cập nhật thành công" : "Thêm mới thành công");
      onSuccess(); onClose();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Code</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="boycott" required /></div>
        <div className="space-y-2"><Label>Màu</Label><Input type="color" value={formData.color_code} onChange={(e) => setFormData({ ...formData, color_code: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Tên phân loại</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
      <div className="space-y-2"><Label>Mô tả</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Huỷ</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          {isSubmitting ? "Đang lưu..." : row ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
}

import { usePagination } from "@/hooks/use-pagination";

export default function ClassificationsPage() {
  const [items, setItems] = useState<BrandClassification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("brand_classifications").select("*", { count: "exact" });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("code")
        .range(range.from, range.to);

      if (error) throw error;
      setItems(data as BrandClassification[]);
      setTotal(count || 0);
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [range, search]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("brand_classifications").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá"); fetchItems();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
  };

  return (
    <DataTablePage title="Classifications" description="Quản lý các phân loại tẩy chay (boycott, support, ...)" columns={columns} data={items} isLoading={isLoading}
      getRowId={(r) => r.id} searchPlaceholder="Tìm kiếm..." addLabel="Thêm phân loại" 
      total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} onSearch={setSearch} onRefresh={fetchItems}
      renderForm={(row, onClose) => <ClassificationForm row={row} onClose={onClose} onSuccess={fetchItems} />}
      onDelete={(row) => handleDelete(row.id)} />
  );
}
