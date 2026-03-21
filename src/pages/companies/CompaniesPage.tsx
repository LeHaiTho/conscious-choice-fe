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
import { Plus, Edit, ChevronDown, ChevronUp, Tag, Shield, ExternalLink, Globe, X, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CountryForm } from "../countries/CountriesPage";
import type { Company, CompanyMoralStatus } from "@/types";

/* ================================================================
   COMPANY DETAIL DRAWER — shows brands list, moral status, country info
   ================================================================ */

function CompanyDetailPanel({ company, onClose }: { company: Company; onClose: () => void }) {
  const [brands, setBrands] = useState<any[]>([]);
  const [moralStatuses, setMoralStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      // Fetch brands for this company
      const { data: brandList } = await supabase
        .from("brands")
        .select("id, name, logo_url, is_vietnamese, category:product_categories(name_vn), brand_moral_status(id)")
        .eq("company_id", company.id)
        .eq("is_deleted", false)
        .order("name")
        .limit(30);
      setBrands(brandList || []);

      // Fetch company moral statuses
      const { data: morals } = await supabase
        .from("company_moral_status")
        .select("*, classification:brand_classifications(id, name, code, color_code)")
        .eq("company_id", company.id)
        .eq("is_deleted", false);
      setMoralStatuses(morals || []);

      setLoading(false);
    };
    fetchAll();
  }, [company.id]);

  if (loading) {
    return (
      <div className="border rounded-xl p-6 bg-muted/30 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    );
  }

  const flaggedBrands = brands.filter((b: any) => b.brand_moral_status && b.brand_moral_status.length > 0);
  const cleanBrands = brands.filter((b: any) => !b.brand_moral_status || b.brand_moral_status.length === 0);

  return (
    <div className="border rounded-xl bg-card shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-center gap-3">
          {company.logo_url && (
            <img src={company.logo_url} alt={company.name} className="w-10 h-10 rounded-lg object-contain bg-white border" />
          )}
          <div>
            <h3 className="font-bold text-lg">{company.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {company.country && <Badge variant="outline"><Globe className="h-3 w-3 mr-1" />{company.country.name}</Badge>}
              {company.website_url && (
                <a href={company.website_url} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline text-xs">
                  <ExternalLink className="h-3 w-3" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x">
        {/* Column 1: Company Moral Status */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Shield className="h-4 w-4" /> Trạng thái công ty
          </div>
          {moralStatuses.length > 0 ? (
            <div className="space-y-2">
              {moralStatuses.map((ms) => (
                <div key={ms.id} className="rounded-lg border p-3 space-y-1 bg-red-50/50 dark:bg-red-950/10">
                  <Badge style={{ backgroundColor: ms.classification?.color_code || "#888", color: "#fff" }}>
                    {ms.classification?.name || "—"}
                  </Badge>
                  <p className="text-sm">{ms.reason_vn}</p>
                  {ms.evidence_url && (
                    <a href={ms.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Xem bằng chứng
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <Badge className="bg-emerald-100 text-emerald-700">✅ Sạch</Badge>
              <p className="text-xs text-muted-foreground mt-1">Chưa ghi nhận cảnh báo nào</p>
            </div>
          )}
          {company.description && (
            <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{company.description}</p>
          )}
        </div>

        {/* Column 2: Flagged Brands */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Tag className="h-4 w-4 text-red-500" /> Nhãn bị cảnh báo ({flaggedBrands.length})
          </div>
          {flaggedBrands.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {flaggedBrands.map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg py-1.5 px-2 bg-red-50/50 dark:bg-red-950/10 border border-red-200/50">
                  {b.logo_url ? (
                    <img src={b.logo_url} className="w-7 h-7 rounded object-contain bg-white border flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs flex-shrink-0">🏷️</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{(b as any).category?.name_vn || "—"}</p>
                  </div>
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">⚠️</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Không có nhãn hàng bị cảnh báo</p>
          )}
        </div>

        {/* Column 3: Clean Brands */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Tag className="h-4 w-4 text-emerald-500" /> Nhãn sạch ({cleanBrands.length})
          </div>
          {cleanBrands.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {cleanBrands.map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg py-1.5 px-2 hover:bg-muted/50 transition-colors">
                  {b.logo_url ? (
                    <img src={b.logo_url} className="w-7 h-7 rounded object-contain bg-white border flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs flex-shrink-0">🏷️</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{(b as any).category?.name_vn || "—"}</p>
                  </div>
                  {b.is_vietnamese && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">🇻🇳</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Chưa có nhãn hàng</p>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>Tổng cộng {brands.length} nhãn hàng thuộc công ty này</span>
        <span>{flaggedBrands.length > 0 ? `⚠️ ${flaggedBrands.length} cảnh báo` : "✅ Tất cả sạch"}</span>
      </div>
    </div>
  );
}

/* ================================================================
   TAB 1 — Companies CRUD (with status filter + detail panel)
   ================================================================ */

const columns: Column<Company>[] = [
  { key: "name", title: "Tên công ty", render: (val) => <span className="font-medium">{String(val)}</span> },
  { key: "slug", title: "Slug", render: (val) => <code className="text-xs bg-muted px-2 py-1 rounded">{String(val)}</code> },
  { key: "country", title: "Quốc gia", render: (_v, row) => <Badge variant="outline">{row.country?.name || "—"}</Badge> },
  {
    key: "is_deleted", title: "Trạng thái",
    render: (val) => <Badge variant={val ? "destructive" : "default"} className={!val ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>{val ? "Đã xoá" : "Hoạt động"}</Badge>,
  },
  { key: "created_at", title: "Ngày tạo", render: (val) => new Date(String(val)).toLocaleDateString("vi-VN") },
];

export function CompanyForm({ row, onClose, onSuccess }: { row: Company | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: row?.name || "", slug: row?.slug || "", country_id: row?.country_id || "",
    description: row?.description || "", website_url: row?.website_url || "", logo_url: row?.logo_url || "",
  });
  const [countries, setCountries] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickAddCountryOpen, setIsQuickAddCountryOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);

  const fetchCountries = () => supabase.from("countries").select("id, name").eq("is_deleted", false).order("name").then(({ data }) => { if (data) setCountries(data); });
  useEffect(() => { fetchCountries(); }, []);

  const handleEditCountry = async () => {
    if (!formData.country_id) return;
    const { data } = await supabase.from("countries").select("*").eq("id", formData.country_id).single();
    if (data) {
      setEditingCountry(data);
      setIsQuickAddCountryOpen(true);
    }
  };

  const autoSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("companies").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert(formData);
        if (error) throw error;
      }
      toast.success(row ? "Cập nhật thành công" : "Thêm mới thành công");
      onSuccess(); onClose();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Tên công ty</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: autoSlug(e.target.value) })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Quốc gia
              <div className="flex gap-1">
                {formData.country_id && (
                  <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={handleEditCountry} title="Sửa quốc gia">
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => { setEditingCountry(null); setIsQuickAddCountryOpen(true); }} title="Thêm quốc gia mới">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </Label>
            <select value={formData.country_id} onChange={(e) => setFormData({ ...formData, country_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Chọn quốc gia</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Logo URL</Label><Input value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://..." required /></div>
          <div className="space-y-2"><Label>Website</Label><Input value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." /></div>
        </div>
        <div className="space-y-2"><Label>Mô tả ngắn</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Tập đoàn đa quốc gia..." /></div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Huỷ</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            {isSubmitting ? "Đang lưu..." : row ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>

      <Dialog open={isQuickAddCountryOpen} onOpenChange={setIsQuickAddCountryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCountry ? "Chỉnh sửa quốc gia" : "Thêm quốc gia mới"}</DialogTitle></DialogHeader>
          <CountryForm 
            row={editingCountry} 
            onClose={() => setIsQuickAddCountryOpen(false)} 
            onSuccess={() => {
              fetchCountries();
              setIsQuickAddCountryOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "flagged" | "clean">("all");
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("companies")
        .select("*, country:countries(id, name, iso_code), company_moral_status(id)", { count: "exact" })
        .eq("is_deleted", false);
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("name")
        .range(range.from, range.to);

      if (error) throw error;

      let filtered = data || [];
      if (statusFilter === "flagged") {
        filtered = filtered.filter((c: any) => c.company_moral_status && c.company_moral_status.length > 0);
      } else if (statusFilter === "clean") {
        filtered = filtered.filter((c: any) => !c.company_moral_status || c.company_moral_status.length === 0);
      }

      setCompanies(filtered as Company[]);
      setTotal(statusFilter !== "all" ? filtered.length : (count || 0));
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [range, search, statusFilter]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("companies").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá"); fetchItems();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
  };

  const expandedCompany = expandedCompanyId ? companies.find(c => c.id === expandedCompanyId) : null;

  // Enhanced columns with click-to-expand
  const enhancedColumns: Column<Company>[] = [
    {
      key: "name", title: "Tên công ty",
      render: (val, row) => (
        <button
          className="flex items-center gap-2 font-medium hover:text-blue-600 transition-colors text-left"
          onClick={() => setExpandedCompanyId(expandedCompanyId === row.id ? null : row.id)}
        >
          {(row as any).logo_url && <img src={(row as any).logo_url} className="w-6 h-6 rounded object-contain bg-white border flex-shrink-0" />}
          <span>{String(val)}</span>
          {expandedCompanyId === row.id ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </button>
      ),
    },
    ...columns.slice(1),
  ];

  return (
    <div className="space-y-4">
      {/* Status Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {[
          { value: "all", label: "Tất cả" },
          { value: "flagged", label: "⚠️ Có cảnh báo" },
          { value: "clean", label: "✅ Sạch" },
        ].map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? "default" : "outline"}
            className={statusFilter === f.value ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            onClick={() => { setStatusFilter(f.value as any); onPageChange(1); }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Expanded Company Detail */}
      {expandedCompany && (
        <CompanyDetailPanel company={expandedCompany} onClose={() => setExpandedCompanyId(null)} />
      )}

      <DataTablePage title="Companies" description="Quản lý công ty / tập đoàn mẹ" columns={enhancedColumns} data={companies} isLoading={isLoading}
        getRowId={(r) => r.id} searchPlaceholder="Tìm kiếm công ty..." addLabel="Thêm công ty" 
        total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} onSearch={setSearch} onRefresh={fetchItems}
        renderForm={(row, onClose) => <CompanyForm row={row} onClose={onClose} onSuccess={fetchItems} />}
        onDelete={(row) => handleDelete(row.id)} />
    </div>
  );
}

/* ================================================================
   TAB 2 — Company Moral Status
   ================================================================ */

const moralColumns: Column<CompanyMoralStatus>[] = [
  { key: "company", title: "Công ty", render: (_v, row) => <span className="font-medium">{row.company?.name || "—"}</span> },
  { key: "classification", title: "Phân loại", render: (_v, row) => <Badge style={{ backgroundColor: row.classification?.color_code || "#888", color: "#fff" }}>{row.classification?.name || "—"}</Badge> },
  { key: "reason_vn", title: "Lý do (VN)", render: (val) => <span className="text-sm line-clamp-1 max-w-[300px] truncate" title={String(val)}>{String(val)}</span> },
  { key: "evidence_url", title: "Nguồn", render: (val) => val ? <a href={String(val)} target="_blank" className="text-blue-600 underline text-sm" rel="noreferrer">Xem</a> : <span className="text-muted-foreground text-sm">—</span> },
];

function CompanyMoralForm({ row, onClose, onSuccess }: { row: CompanyMoralStatus | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    company_id: row?.company_id || "", classification_id: row?.classification_id || "",
    reason_vn: row?.reason_vn || "", reason_en: row?.reason_en || "", evidence_url: row?.evidence_url || "",
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => { if (data) setCompanies(data); });
    supabase.from("brand_classifications").select("id, code, name").order("name").then(({ data }) => { if (data) setClassifications(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("company_moral_status").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_moral_status").insert(formData);
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
        <div className="space-y-2">
          <Label>Công ty</Label>
          <select value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
            <option value="">Chọn công ty</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
      <div className="space-y-2"><Label>Lý do (VN)</Label><Input value={formData.reason_vn} onChange={(e) => setFormData({ ...formData, reason_vn: e.target.value })} required /></div>
      <div className="space-y-2"><Label>Lý do (EN)</Label><Input value={formData.reason_en} onChange={(e) => setFormData({ ...formData, reason_en: e.target.value })} /></div>
      <div className="space-y-2"><Label>URL bằng chứng</Label><Input value={formData.evidence_url} onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })} placeholder="https://..." /></div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Huỷ</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          {isSubmitting ? "Đang lưu..." : row ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
}

function CompanyMoralTab() {
  const [items, setItems] = useState<CompanyMoralStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchMoral = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("company_moral_status")
        .select("*, company:companies(id, name), classification:brand_classifications(id, name, code, color_code)", { count: "exact" });
      
      if (search) {
        query = query.or(`reason_vn.ilike.%${search}%,reason_en.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setItems(data as CompanyMoralStatus[]);
      setTotal(count || 0);
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMoral(); }, [range, search]);

  const handleDeleteMoral = async (id: string) => {
    try {
      const { error } = await supabase.from("company_moral_status").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá"); fetchMoral();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
  };

  return (
    <DataTablePage title="Company Moral Status" description="Quản lý trạng thái tẩy chay công ty" columns={moralColumns} data={items} isLoading={isLoading}
      getRowId={(r) => r.id} searchPlaceholder="Tìm kiếm..." addLabel="Thêm trạng thái" 
      total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} onSearch={setSearch} onRefresh={fetchMoral}
      renderForm={(row, onClose) => <CompanyMoralForm row={row} onClose={onClose} onSuccess={fetchMoral} />}
      onDelete={(row) => handleDeleteMoral(row.id)} />
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function CompaniesPage() {
  return (
    <Tabs defaultValue="companies" className="space-y-4">
      <TabsList>
        <TabsTrigger value="companies">🏢 Công ty</TabsTrigger>
        <TabsTrigger value="moral">⚖️ Trạng thái tẩy chay</TabsTrigger>
      </TabsList>
      <TabsContent value="companies"><CompaniesTab /></TabsContent>
      <TabsContent value="moral"><CompanyMoralTab /></TabsContent>
    </Tabs>
  );
}
