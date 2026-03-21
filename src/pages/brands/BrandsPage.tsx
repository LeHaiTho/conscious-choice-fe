import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/use-pagination";
import { Plus, Edit, ChevronDown, ChevronUp, Building2, Package, Shield, ExternalLink, X, Filter, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyForm } from "../companies/CompaniesPage";
import type { Brand, BrandMoralStatus } from "@/types";

/* ================================================================
   BRAND DETAIL DRAWER — shows products, company, moral status inline
   ================================================================ */

function BrandDetailPanel({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [moralStatuses, setMoralStatuses] = useState<any[]>([]);
  const [companyMoralStatuses, setCompanyMoralStatuses] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      // Fetch products for this brand
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, image_url, source, created_at")
        .eq("brand_id", brand.id)
        .eq("is_deleted", false)
        .order("name")
        .limit(20);
      setProducts(prods || []);

      // Fetch moral statuses (brand level)
      const { data: morals } = await supabase
        .from("brand_moral_status")
        .select("*, classification:brand_classifications(id, name, code, color_code)")
        .eq("brand_id", brand.id)
        .eq("is_deleted", false);
      setMoralStatuses(morals || []);

      // Fetch parent company & company-level moral status
      if (brand.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("*, country:countries(name, iso_code)")
          .eq("id", brand.company_id)
          .single();
        setCompany(comp);

        const { data: cMorals } = await supabase
          .from("company_moral_status")
          .select("*, classification:brand_classifications(id, name, code, color_code)")
          .eq("company_id", brand.company_id)
          .eq("is_deleted", false);
        setCompanyMoralStatuses(cMorals || []);
      }
      setLoading(false);
    };
    fetchAll();
  }, [brand.id]);

  if (loading) {
    return (
      <div className="border rounded-xl p-6 bg-muted/30 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <div className="flex items-center gap-3">
          {brand.logo_url && (
            <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 rounded-lg object-contain bg-white border" />
          )}
          <div>
            <h3 className="font-bold text-lg">{brand.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {brand.is_vietnamese && <Badge className="bg-emerald-100 text-emerald-700 text-xs">🇻🇳 Việt Nam</Badge>}
              {brand.category && <Badge variant="secondary" className="text-xs">{brand.category.name_vn}</Badge>}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x">
        {/* Column 1: Company Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Building2 className="h-4 w-4" /> Công ty sở hữu
          </div>
          {company ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {company.logo_url && <img src={company.logo_url} className="w-8 h-8 rounded object-contain bg-white border" />}
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-xs text-muted-foreground">{company.country?.name || "—"}</p>
                </div>
              </div>
              {company.website_url && (
                <a href={company.website_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" /> {company.website_url}
                </a>
              )}
              {company.description && <p className="text-xs text-muted-foreground">{company.description}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Chưa liên kết công ty</p>
          )}
        </div>

        {/* Column 2: Moral Status */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Shield className="h-4 w-4" /> Trạng thái đạo đức
          </div>
          {(moralStatuses.length > 0 || companyMoralStatuses.length > 0) ? (
            <div className="space-y-3">
              {/* Brand Statuses */}
              {moralStatuses.map((ms) => (
                <div key={ms.id} className="rounded-lg border p-3 bg-muted/30 border-l-4 border-l-red-500 shadow-sm transition-all hover:bg-muted/40 group">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge style={{ backgroundColor: ms.classification?.color_code || "#888", color: "#fff" }} className="text-[10px] px-2">
                      {ms.classification?.name || "—"}
                    </Badge>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 flex items-center gap-1 group-hover:text-red-500 transition-colors">
                      <Tag className="h-2.5 w-2.5" /> Nhãn hàng
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-tight">{ms.reason_vn}</p>
                  {ms.evidence_url && (
                    <a href={ms.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline mt-2 inline-flex">
                      <ExternalLink className="h-3 w-3" /> Nguồn tin
                    </a>
                  )}
                </div>
              ))}

              {/* Company Statuses */}
              {companyMoralStatuses.map((ms) => (
                <div key={ms.id} className="rounded-lg border p-3 bg-amber-50/20 border-l-4 border-l-amber-500 shadow-sm transition-all hover:bg-amber-50/40 group dark:bg-amber-950/10 dark:border-l-amber-600">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge style={{ backgroundColor: ms.classification?.color_code || "#888", color: "#fff" }} className="text-[10px] px-2">
                      {ms.classification?.name || "—"}
                    </Badge>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                      <Building2 className="h-2.5 w-2.5" /> Công ty mẹ
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-tight italic">{ms.reason_vn}</p>
                  {ms.evidence_url && (
                    <a href={ms.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline mt-2 inline-flex">
                      <ExternalLink className="h-3 w-3" /> Nguồn tin
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
        </div>

        {/* Column 3: Products */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <Package className="h-4 w-4" /> Sản phẩm ({products.length})
            </div>
          </div>
          {products.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg py-1.5 px-2 hover:bg-muted/50 transition-colors">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-contain bg-white border flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs flex-shrink-0">📦</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.source || "Manual"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Chưa có sản phẩm</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   TAB 1 — Brands CRUD (with status filter + detail panel)
   ================================================================ */

const columns: Column<Brand>[] = [
  { key: "name", title: "Tên nhãn hàng", render: (val) => <span className="font-medium">{String(val)}</span> },
  { key: "slug", title: "Slug", render: (val) => <code className="text-xs bg-muted px-2 py-1 rounded">{String(val)}</code> },
  { key: "company", title: "Công ty mẹ", render: (_v, row) => row.company?.name ? <Badge variant="outline">{row.company.name}</Badge> : <span className="text-muted-foreground text-sm">—</span> },
  { key: "is_vietnamese", title: "Việt Nam", render: (val) => val ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">🇻🇳 VN</Badge> : <span className="text-muted-foreground text-sm">—</span> },
  { key: "category", title: "Danh mục", render: (_v, row) => row.category?.name_vn ? <Badge variant="secondary">{row.category.name_vn}</Badge> : <span className="text-muted-foreground text-sm">—</span> },
  { key: "is_deleted", title: "Trạng thái", render: (val) => <Badge variant={val ? "destructive" : "default"} className={!val ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>{val ? "Đã xoá" : "Hoạt động"}</Badge> },
  { key: "created_at", title: "Ngày tạo", render: (val) => new Date(String(val)).toLocaleDateString("vi-VN") },
];

export function BrandForm({ row, onClose, onSuccess }: { row: Brand | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: row?.name || "", slug: row?.slug || "", company_id: row?.company_id || "",
    category_id: (row as any)?.category_id || "",
    logo_url: row?.logo_url || "", is_vietnamese: row?.is_vietnamese || false,
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickAddCompanyOpen, setIsQuickAddCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const fetchCompanies = () => supabase.from("companies").select("id, name").order("name").then(({ data }) => { if (data) setCompanies(data); });
  const fetchCategories = () => supabase.from("product_categories").select("id, name_vn").is("is_deleted", false).order("name_vn").then(({ data }) => { if (data) setCategories(data); });
  
  useEffect(() => { 
    fetchCompanies(); 
    fetchCategories();
  }, []);

  const handleEditCompany = async () => {
    if (!formData.company_id) return;
    const { data } = await supabase.from("companies").select("*").eq("id", formData.company_id).single();
    if (data) {
      setEditingCompany(data);
      setIsQuickAddCompanyOpen(true);
    }
  };

  const autoSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = { 
        ...formData, 
        company_id: formData.company_id || null,
        category_id: formData.category_id || null 
      };
      let finalBrandId = row?.id;
      if (row) {
        const { error } = await supabase.from("brands").update(submitData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("brands").insert(submitData).select("id").single();
        if (error) throw error;
        finalBrandId = data.id;

        // Auto-create alias for the main name
        const normalized = autoSlug(formData.name);
        await supabase.from("brand_aliases").upsert({
          brand_id: finalBrandId,
          alias_name: formData.name,
          normalized_alias: normalized,
          is_verified: true
        }, { onConflict: "normalized_alias" });
      }
      toast.success(row ? "Cập nhật thành công" : "Thêm mới thành công");
      onSuccess(); onClose();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2"><Label>Tên nhãn hàng</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: autoSlug(e.target.value) })} required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required /></div>
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Công ty mẹ
              <div className="flex gap-1">
                {formData.company_id && (
                  <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={handleEditCompany} title="Sửa công ty">
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => { setEditingCompany(null); setIsQuickAddCompanyOpen(true); }} title="Thêm công ty mới">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </Label>
            <select value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Không có</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo URL</Label>
          <Input 
            value={formData.logo_url} 
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} 
            placeholder="https://..." 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Danh mục sản phẩm</Label>
          <select 
            value={formData.category_id} 
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_vn}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="is_vietnamese" checked={formData.is_vietnamese} onCheckedChange={(c) => setFormData({ ...formData, is_vietnamese: !!c })} />
          <Label htmlFor="is_vietnamese" className="text-sm font-normal">Thương hiệu Việt Nam 🇻🇳</Label>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Huỷ</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            {isSubmitting ? "Đang lưu..." : row ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>

      <Dialog open={isQuickAddCompanyOpen} onOpenChange={setIsQuickAddCompanyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCompany ? "Chỉnh sửa công ty" : "Thêm công ty mới"}</DialogTitle></DialogHeader>
          <CompanyForm 
            row={editingCompany} 
            onClose={() => setIsQuickAddCompanyOpen(false)} 
            onSuccess={() => {
              fetchCompanies();
              setIsQuickAddCompanyOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function BrandsTab() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "vn" | "foreign" | "flagged" | "clean">("all");
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("brands")
        .select("*, company:companies(id, name, slug, company_moral_status(id)), category:product_categories(id, name_vn), brand_moral_status(id)", { count: "exact" })
        .eq("is_deleted", false);
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (statusFilter === "vn") query = query.eq("is_vietnamese", true);
      if (statusFilter === "foreign") query = query.eq("is_vietnamese", false);

      const { data, error, count } = await query
        .order("name")
        .range(range.from, range.to);

      if (error) throw error;

      let filtered = data || [];
      // Client-side filter for flagged/clean (based on moral_status join)
      if (statusFilter === "flagged") {
        filtered = filtered.filter((b: any) => 
          (b.brand_moral_status && b.brand_moral_status.length > 0) || 
          (b.company?.company_moral_status && b.company.company_moral_status.length > 0)
        );
      } else if (statusFilter === "clean") {
        filtered = filtered.filter((b: any) => 
          (!b.brand_moral_status || b.brand_moral_status.length === 0) && 
          (!b.company?.company_moral_status || b.company.company_moral_status.length === 0)
        );
      }

      setBrands(filtered as Brand[]);
      setTotal(statusFilter === "flagged" || statusFilter === "clean" ? filtered.length : (count || 0));
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [range, search, statusFilter]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("brands").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá"); fetchItems();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
  };

  const expandedBrand = expandedBrandId ? brands.find(b => b.id === expandedBrandId) : null;

  // Enhanced columns with click-to-expand
  const enhancedColumns: Column<Brand>[] = [
    {
      key: "name", title: "Tên nhãn hàng",
      render: (val, row) => (
        <button
          className="flex items-center gap-2 font-medium hover:text-emerald-600 transition-colors text-left"
          onClick={() => setExpandedBrandId(expandedBrandId === row.id ? null : row.id)}
        >
          {row.logo_url && <img src={row.logo_url} className="w-6 h-6 rounded object-contain bg-white border flex-shrink-0" />}
          <span>{String(val)}</span>
          {expandedBrandId === row.id ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </button>
      ),
    },
    ...columns.slice(1), // reuse the rest
  ];

  return (
    <div className="space-y-4">
      {/* Status Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {[
          { value: "all", label: "Tất cả" },
          { value: "vn", label: "🇻🇳 Việt Nam" },
          { value: "foreign", label: "🌍 Nước ngoài" },
          { value: "flagged", label: "⚠️ Có cảnh báo" },
          { value: "clean", label: "✅ Sạch" },
        ].map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? "default" : "outline"}
            className={statusFilter === f.value ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
            onClick={() => { setStatusFilter(f.value as any); onPageChange(1); }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Expanded Brand Detail */}
      {expandedBrand && (
        <BrandDetailPanel brand={expandedBrand} onClose={() => setExpandedBrandId(null)} />
      )}

      <DataTablePage title="Brands" description="Quản lý nhãn hàng" columns={enhancedColumns} data={brands} isLoading={isLoading}
        getRowId={(r) => r.id} searchPlaceholder="Tìm kiếm nhãn hàng..." addLabel="Thêm Brand" 
        total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} onSearch={setSearch} onRefresh={fetchItems}
        renderForm={(row, onClose) => <BrandForm row={row} onClose={onClose} onSuccess={fetchItems} />}
        onDelete={(row) => handleDelete(row.id)} />
    </div>
  );
}

/* ================================================================
   TAB 2 — Brand Moral Status
   ================================================================ */

const moralColumns: Column<BrandMoralStatus>[] = [
  { key: "brand", title: "Nhãn hàng", render: (_v, row) => <span className="font-medium">{row.brand?.name || "—"}</span> },
  { key: "classification", title: "Phân loại", render: (_v, row) => <Badge style={{ backgroundColor: row.classification?.color_code || "#888", color: "#fff" }}>{row.classification?.name || "—"}</Badge> },
  { key: "reason_vn", title: "Lý do (VN)", render: (val) => <span className="text-sm line-clamp-2">{String(val)}</span> },
  { key: "evidence_url", title: "Nguồn", render: (val) => val ? <a href={String(val)} target="_blank" className="text-blue-600 underline text-sm" rel="noreferrer">Xem</a> : <span className="text-muted-foreground text-sm">—</span> },
];

export function BrandMoralForm({ row, onClose, onSuccess }: { row: BrandMoralStatus | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    brand_id: row?.brand_id || "", classification_id: row?.classification_id || "",
    reason_vn: row?.reason_vn || "", reason_en: row?.reason_en || "", evidence_url: row?.evidence_url || "",
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("brands").select("id, name").eq("is_deleted", false).order("name").then(({ data }) => { if (data) setBrands(data); });
    supabase.from("brand_classifications").select("id, code, name").eq("is_deleted", false).order("name").then(({ data }) => { if (data) setClassifications(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("brand_moral_status").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_moral_status").insert(formData);
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
          <Label>Nhãn hàng</Label>
          <select value={formData.brand_id} onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
            <option value="">Chọn nhãn hàng</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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

function BrandMoralTab() {
  const [items, setItems] = useState<BrandMoralStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchMoral = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("brand_moral_status")
        .select("*, brand:brands(id, name), classification:brand_classifications(id, name, code, color_code)", { count: "exact" })
        .eq("is_deleted", false);
      
      if (search) {
        query = query.or(`reason_vn.ilike.%${search}%,reason_en.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setItems(data as BrandMoralStatus[]);
      setTotal(count || 0);
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMoral(); }, [range, search]);

  const handleDeleteMoral = async (id: string) => {
    try {
      const { error } = await supabase.from("brand_moral_status").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá"); fetchMoral();
    } catch (error: any) { toast.error(`Lỗi: ${error.message}`); }
  };

  return (
    <DataTablePage title="Brand Moral Status" description="Quản lý trạng thái tẩy chay nhãn hàng" columns={moralColumns} data={items} isLoading={isLoading}
      getRowId={(r) => r.id} searchPlaceholder="Tìm kiếm..." addLabel="Thêm trạng thái" 
      total={total} page={page} pageSize={pageSize} onPageChange={onPageChange} onSearch={setSearch} onRefresh={fetchMoral}
      renderForm={(row, onClose) => <BrandMoralForm row={row} onClose={onClose} onSuccess={fetchMoral} />}
      onDelete={(row) => handleDeleteMoral(row.id)} />
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function BrandsPage() {
  return (
    <Tabs defaultValue="brands" className="space-y-4">
      <TabsList>
        <TabsTrigger value="brands">🏷️ Nhãn hàng</TabsTrigger>
        <TabsTrigger value="moral">⚖️ Trạng thái tẩy chay</TabsTrigger>
      </TabsList>
      <TabsContent value="brands"><BrandsTab /></TabsContent>
      <TabsContent value="moral"><BrandMoralTab /></TabsContent>
    </Tabs>
  );
}
