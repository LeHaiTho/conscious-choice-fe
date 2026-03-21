import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import type { Country, CountryMoralStatus } from "@/types";

/* ================================================================
   TAB 1 — Countries CRUD
   ================================================================ */

const columns: Column<Country>[] = [
  {
    key: "iso_code",
    title: "ISO Code",
    render: (val) => (
      <Badge variant="outline" className="font-mono">
        {String(val)}
      </Badge>
    ),
  },
  {
    key: "name",
    title: "Tên (EN)",
    render: (val) => <span className="font-medium">{String(val)}</span>,
  },
  { key: "name_vn", title: "Tên (VN)" },
  {
    key: "is_deleted",
    title: "Trạng thái",
    render: (val) => (
      <Badge
        variant={val ? "destructive" : "default"}
        className={!val ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
      >
        {val ? "Đã xoá" : "Hoạt động"}
      </Badge>
    ),
  },
  {
    key: "created_at",
    title: "Ngày tạo",
    render: (val) => new Date(String(val)).toLocaleDateString("vi-VN"),
  },
];

export function CountryForm({ row, onClose, onSuccess }: { row: Country | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    iso_code: row?.iso_code || "",
    name: row?.name || "",
    name_vn: row?.name_vn || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("countries").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("countries").insert(formData);
        if (error) throw error;
      }
      toast.success(row ? "Cập nhật thành công" : "Thêm mới thành công");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>ISO Code</Label>
          <Input value={formData.iso_code} onChange={(e) => setFormData({ ...formData, iso_code: e.target.value.toUpperCase() })} maxLength={2} placeholder="VN" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tên (English)</Label>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Vietnam" required />
      </div>
      <div className="space-y-2">
        <Label>Tên (Tiếng Việt)</Label>
        <Input value={formData.name_vn} onChange={(e) => setFormData({ ...formData, name_vn: e.target.value })} placeholder="Việt Nam" required />
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

function CountriesTab() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetch = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("countries").select("*", { count: "exact" });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,name_vn.ilike.%${search}%,iso_code.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("name")
        .range(range.from, range.to);

      if (error) throw error;
      setCountries(data as Country[]);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [range, search]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("countries").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá");
      fetch();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  return (
    <DataTablePage
      title="Countries"
      description="Quản lý danh sách quốc gia trong hệ thống"
      columns={columns}
      data={countries}
      isLoading={isLoading}
      getRowId={(r) => r.id}
      searchPlaceholder="Tìm kiếm quốc gia..."
      addLabel="Thêm quốc gia"
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onSearch={setSearch}
      onRefresh={fetch}
      renderForm={(row, onClose) => <CountryForm row={row} onClose={onClose} onSuccess={fetch} />}
      onDelete={(row) => handleDelete(row.id)}
    />
  );
}

/* ================================================================
   TAB 2 — Country Moral Status (Tẩy chay)
   ================================================================ */

const moralColumns: Column<CountryMoralStatus>[] = [
  {
    key: "country",
    title: "Quốc gia",
    render: (_v, row) => <span className="font-medium">{row.country?.name || "—"}</span>,
  },
  {
    key: "classification",
    title: "Phân loại",
    render: (_v, row) => (
      <Badge style={{ backgroundColor: row.classification?.color_code || "#888", color: "#fff" }}>
        {row.classification?.name || "—"}
      </Badge>
    ),
  },
  {
    key: "reason_vn",
    title: "Lý do (VN)",
    render: (val) => <span className="text-sm line-clamp-2">{String(val)}</span>,
  },
  {
    key: "evidence_url",
    title: "Nguồn",
    render: (val) =>
      val ? (
        <a href={String(val)} target="_blank" className="text-blue-600 underline text-sm" rel="noreferrer">
          Xem
        </a>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
];

function MoralStatusForm({ row, onClose, onSuccess }: { row: CountryMoralStatus | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    country_id: row?.country_id || "",
    classification_id: row?.classification_id || "",
    reason_vn: row?.reason_vn || "",
    reason_en: row?.reason_en || "",
    evidence_url: row?.evidence_url || "",
  });
  const [countries, setCountries] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("countries").select("id, name").order("name").then(({ data }) => { if (data) setCountries(data); });
    supabase.from("brand_classifications").select("id, code, name").order("name").then(({ data }) => { if (data) setClassifications(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("country_moral_status").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("country_moral_status").insert(formData);
        if (error) throw error;
      }
      toast.success(row ? "Cập nhật thành công" : "Thêm mới thành công");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quốc gia</Label>
          <select value={formData.country_id} onChange={(e) => setFormData({ ...formData, country_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
            <option value="">Chọn quốc gia</option>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Phân loại</Label>
          <select value={formData.classification_id} onChange={(e) => setFormData({ ...formData, classification_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
            <option value="">Chọn phân loại</option>
            {classifications.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Lý do (VN)</Label>
        <Input value={formData.reason_vn} onChange={(e) => setFormData({ ...formData, reason_vn: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Lý do (EN)</Label>
        <Input value={formData.reason_en} onChange={(e) => setFormData({ ...formData, reason_en: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>URL bằng chứng</Label>
        <Input value={formData.evidence_url} onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })} placeholder="https://..." />
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

function CountryMoralTab() {
  const [items, setItems] = useState<CountryMoralStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchResource = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("country_moral_status")
        .select("*, country:countries(id, name, iso_code), classification:brand_classifications(id, name, code, color_code)", { count: "exact" });
      
      if (search) {
        // Search in the joined country name
        query = query.or(`reason_vn.ilike.%${search}%,reason_en.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setItems(data as CountryMoralStatus[]);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchResource(); }, [range, search]);

  const handleDeleteMoral = async (id: string) => {
    try {
      const { error } = await supabase.from("country_moral_status").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá");
      fetchResource();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  return (
    <DataTablePage
      title="Country Moral Status"
      description="Quản lý trạng thái tẩy chay quốc gia"
      columns={moralColumns}
      data={items}
      isLoading={isLoading}
      getRowId={(r) => r.id}
      searchPlaceholder="Tìm kiếm..."
      addLabel="Thêm trạng thái"
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onSearch={setSearch}
      onRefresh={fetchResource}
      renderForm={(row, onClose) => <MoralStatusForm row={row} onClose={onClose} onSuccess={fetchResource} />}
      onDelete={(row) => handleDeleteMoral(row.id)}
    />
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function CountriesPage() {
  return (
    <Tabs defaultValue="countries" className="space-y-4">
      <TabsList>
        <TabsTrigger value="countries">🌍 Quốc gia</TabsTrigger>
        <TabsTrigger value="moral">⚖️ Trạng thái tẩy chay</TabsTrigger>
      </TabsList>
      <TabsContent value="countries"><CountriesTab /></TabsContent>
      <TabsContent value="moral"><CountryMoralTab /></TabsContent>
    </Tabs>
  );
}
