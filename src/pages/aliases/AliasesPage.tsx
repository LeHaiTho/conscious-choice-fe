import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { BrandAlias } from "@/types";

const columns: Column<BrandAlias>[] = [
  { key: "alias_name", title: "Alias", render: (val) => <span className="font-medium">{String(val)}</span> },
  { key: "normalized_alias", title: "Normalized", render: (val) => <code className="text-xs bg-muted px-2 py-1 rounded">{String(val)}</code> },
  { key: "brand", title: "Nhãn hàng", render: (_v, row) => row.brand?.name ? <Badge variant="outline">{row.brand.name}</Badge> : <span className="text-muted-foreground text-sm">—</span> },
  {
    key: "is_verified", title: "Đã xác minh",
    render: (val) => val ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">✓ Verified</Badge> : <Badge variant="secondary">Chưa</Badge>,
  },
  { key: "created_at", title: "Ngày tạo", render: (val) => new Date(String(val)).toLocaleDateString("vi-VN") },
];

function AliasForm({ row, onClose, onSuccess }: { row: BrandAlias | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    brand_id: row?.brand_id || "",
    alias_name: row?.alias_name || "",
    normalized_alias: row?.normalized_alias || "",
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { supabase.from("brands").select("id, name").order("name").then(({ data }) => { if (data) setBrands(data); }); }, []);

  const normalizeAlias = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("brand_aliases").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_aliases").insert(formData);
        if (error) throw error;
      }
      toast.success(row ? "Cập nhật thành công" : "Thêm mới thành công");
      onSuccess(); onClose();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nhãn hàng</Label>
        <select value={formData.brand_id} onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
          <option value="">Chọn nhãn hàng</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Tên alias</Label>
        <Input value={formData.alias_name} onChange={(e) => setFormData({ ...formData, alias_name: e.target.value, normalized_alias: normalizeAlias(e.target.value) })} required />
      </div>
      <div className="space-y-2">
        <Label>Normalized</Label>
        <Input value={formData.normalized_alias} onChange={(e) => setFormData({ ...formData, normalized_alias: e.target.value })} required />
      </div>
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

export default function AliasesPage() {
  const [aliases, setAliases] = useState<BrandAlias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("brand_aliases").select("*, brand:brands(id, name)", { count: "exact" });
      
      if (search) {
        query = query.or(`alias_name.ilike.%${search}%,normalized_alias.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("alias_name")
        .range(range.from, range.to);

      if (error) throw error;
      setAliases(data as BrandAlias[]);
      setTotal(count || 0);
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [range, search]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("brand_aliases").delete().eq("id", id);
      if (error) throw error;
      toast.success("Đã xoá"); fetchItems();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
  };

  return (
    <DataTablePage title="Brand Aliases" description="Quản lý tên thay thế cho nhãn hàng" columns={columns} data={aliases} isLoading={isLoading}
      getRowId={(r) => r.id} searchPlaceholder="Tìm alias..." addLabel="Thêm Alias" 
      total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} onSearch={setSearch} onRefresh={fetchItems}
      renderForm={(row, onClose) => <AliasForm row={row} onClose={onClose} onSuccess={fetchItems} />}
      onDelete={(row) => handleDelete(row.id)} />
  );
}
