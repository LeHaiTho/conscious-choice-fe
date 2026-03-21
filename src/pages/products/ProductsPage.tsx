import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, RefreshCcw, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BrandForm } from "../brands/BrandsPage";
import { usePagination } from "@/hooks/use-pagination";
import type { Product, Barcode, ProductCategory, PendingProduct } from "@/types";

/* ================================================================
   TAB 1 — Products
   ================================================================ */

const productColumns: Column<Product>[] = [
  {
    key: "name",
    title: "Tên sản phẩm",
    render: (val) => <span className="font-medium">{String(val)}</span>,
  },
  {
    key: "brand",
    title: "Nhãn hàng",
    render: (_v, row) =>
      row.brand?.name ? (
        <Badge variant="outline">{row.brand.name}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    key: "source",
    title: "Nguồn",
    render: (val) => (
      <Badge
        variant="secondary"
        className={
          val === "openfoodfacts"
            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            : ""
        }
      >
        {String(val || "local")}
      </Badge>
    ),
  },
  {
    key: "is_deleted",
    title: "Trạng thái",
    render: (val) => (
      <Badge
        variant={val ? "destructive" : "default"}
        className={
          !val
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : ""
        }
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

export function ProductForm({
  row,
  onClose,
  onSuccess,
}: {
  row: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: row?.name || "",
    brand_id: row?.brand_id || "",
    description: row?.description || "",
    image_url: row?.image_url || "",
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickAddBrandOpen, setIsQuickAddBrandOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const fetchBrands = () => supabase.from("brands").select("id, name").order("name").then(({ data }) => { if (data) setBrands(data); });
  useEffect(() => { fetchBrands(); }, []);

  const handleEditBrand = async () => {
    if (!formData.brand_id) return;
    const { data } = await supabase.from("brands").select("*").eq("id", formData.brand_id).single();
    if (data) {
      setEditingBrand(data);
      setIsQuickAddBrandOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("products").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(formData);
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
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên sản phẩm</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Coca-Cola 330ml"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand_id" className="flex items-center justify-between">
            Nhãn hàng
            <div className="flex gap-1">
              {formData.brand_id && (
                <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={handleEditBrand} title="Sửa nhãn hàng">
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => { setEditingBrand(null); setIsQuickAddBrandOpen(true); }} title="Thêm nhãn hàng mới">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </Label>
          <select
            id="brand_id"
            value={formData.brand_id}
            onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Chọn nhãn hàng</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả sản phẩm..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            {isSubmitting ? "Đang lưu..." : row ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>

      <Dialog open={isQuickAddBrandOpen} onOpenChange={setIsQuickAddBrandOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingBrand ? "Chỉnh sửa nhãn hàng" : "Thêm nhãn hàng mới"}</DialogTitle></DialogHeader>
          <BrandForm 
            row={editingBrand} 
            onClose={() => setIsQuickAddBrandOpen(false)} 
            onSuccess={() => {
              fetchBrands();
              setIsQuickAddBrandOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*, brand:brands(id, name)", { count: "exact" })
        .eq("is_deleted", false);
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setProducts(data as Product[]);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [range, search]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("products").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá");
      fetchItems();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  return (
    <DataTablePage
      title="Sản phẩm"
      description="Quản lý sản phẩm trong hệ thống"
      columns={productColumns}
      data={products}
      isLoading={isLoading}
      getRowId={(r) => r.id}
      searchPlaceholder="Tìm kiếm sản phẩm..."
      addLabel="Thêm sản phẩm"
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onSearch={setSearch}
      onRefresh={fetchItems}
      renderForm={(row, onClose) => <ProductForm row={row} onClose={onClose} onSuccess={fetchItems} />}
      onDelete={(row) => handleDelete(row.id)}
    />
  );
}

/* ================================================================
   TAB 2 — Barcodes
   ================================================================ */

const barcodeColumns: Column<Barcode>[] = [
  {
    key: "barcode_value",
    title: "Barcode",
    render: (val) => <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{String(val)}</code>,
  },
  {
    key: "product",
    title: "Sản phẩm",
    render: (_v, row) =>
      row.product?.name ? (
        <span className="font-medium">{row.product.name}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    key: "is_verified",
    title: "Đã xác minh",
    render: (val) =>
      val ? (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          ✓ Verified
        </Badge>
      ) : (
        <Badge variant="secondary">Chưa</Badge>
      ),
  },
  {
    key: "created_at",
    title: "Ngày tạo",
    render: (val) => new Date(String(val)).toLocaleDateString("vi-VN"),
  },
];

function BarcodeForm({
  row,
  onClose,
  onSuccess,
}: {
  row: Barcode | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    barcode_value: row?.barcode_value || "",
    product_id: row?.product_id || "",
    is_verified: row?.is_verified || false,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setProducts(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase
          .from("barcodes")
          .update({ product_id: formData.product_id, is_verified: formData.is_verified })
          .eq("barcode_value", row.barcode_value);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("barcodes").insert(formData);
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
      <div className="space-y-2">
        <Label htmlFor="barcode_value">Mã barcode</Label>
        <Input
          id="barcode_value"
          value={formData.barcode_value}
          onChange={(e) => setFormData({ ...formData, barcode_value: e.target.value })}
          placeholder="8936027220239"
          required
          disabled={!!row}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product_id">Sản phẩm</Label>
        <select
          id="product_id"
          value={formData.product_id}
          onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">Chọn sản phẩm</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Huỷ
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          {isSubmitting ? "Đang lưu..." : row ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
}

function BarcodesTab() {
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("barcodes")
        .select("*, product:products(id, name)", { count: "exact" });
      
      if (search) {
        query = query.ilike("barcode_value", `%${search}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setBarcodes(data as Barcode[]);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [range, search]);

  const handleDelete = async (bv: string) => {
    try {
      const { error } = await supabase.from("barcodes").update({ is_deleted: true }).eq("barcode_value", bv);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá");
      fetchItems();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  return (
    <DataTablePage
      title="Barcodes"
      description="Quản lý mã vạch liên kết sản phẩm"
      columns={barcodeColumns}
      data={barcodes}
      isLoading={isLoading}
      getRowId={(r) => r.barcode_value}
      searchPlaceholder="Tìm kiếm barcode..."
      addLabel="Thêm barcode"
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onSearch={setSearch}
      onRefresh={fetchItems}
      renderForm={(row, onClose) => <BarcodeForm row={row} onClose={onClose} onSuccess={fetchItems} />}
      onDelete={(row) => handleDelete(row.barcode_value)}
    />
  );
}

/* ================================================================
   TAB 3 — Categories
   ================================================================ */

const categoryColumns: Column<ProductCategory>[] = [
  {
    key: "icon_url",
    title: "",
    className: "w-[50px]",
    render: (val) => (val ? <span className="text-2xl">{String(val)}</span> : <span>📦</span>),
  },
  { key: "name", title: "Tên (EN)", render: (val) => <span className="font-medium">{String(val)}</span> },
  { key: "name_vn", title: "Tên (VN)" },
  {
    key: "slug",
    title: "Slug",
    render: (val) => <code className="text-xs bg-muted px-2 py-1 rounded">{String(val)}</code>,
  },
  { key: "sort_order", title: "Thứ tự" },
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
];

export function CategoryForm({
  row,
  onClose,
  onSuccess,
}: {
  row: ProductCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    slug: row?.slug || "",
    name: row?.name || "",
    name_vn: row?.name_vn || "",
    icon_url: row?.icon_url || "",
    sort_order: row?.sort_order || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (row) {
        const { error } = await supabase.from("product_categories").update(formData).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_categories").insert(formData);
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
          <Label>Tên (EN)</Label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value, slug: autoSlug(e.target.value) })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Tên (VN)</Label>
          <Input
            value={formData.name_vn}
            onChange={(e) => setFormData({ ...formData, name_vn: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Thứ tự sắp xếp</Label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
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

function CategoriesTab() {
  const [cats, setCats] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("product_categories").select("*", { count: "exact" });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,name_vn.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("sort_order")
        .range(range.from, range.to);

      if (error) throw error;
      setCats(data as ProductCategory[]);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [range, search]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("product_categories").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã đánh dấu xoá");
      fetchItems();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  return (
    <DataTablePage
      title="Danh mục sản phẩm"
      description="Quản lý phân loại danh mục"
      columns={categoryColumns}
      data={cats}
      isLoading={isLoading}
      getRowId={(r) => r.id}
      searchPlaceholder="Tìm danh mục..."
      addLabel="Thêm danh mục"
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onSearch={setSearch}
      onRefresh={fetchItems}
      renderForm={(row, onClose) => <CategoryForm row={row} onClose={onClose} onSuccess={fetchItems} />}
      onDelete={(row) => handleDelete(row.id)}
    />
  );
}

/* ================================================================
   TAB 4 — Pending Products (Kiểm duyệt)
   ================================================================ */

const pendingColumns: Column<PendingProduct>[] = [
  {
    key: "barcode",
    title: "Barcode",
    render: (val) => <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{String(val)}</code>,
  },
  {
    key: "product_name",
    title: "Tên SP",
    render: (val) => <span className="font-medium">{String(val)}</span>,
  },
  {
    key: "brand_name",
    title: "Brand",
    render: (val) => <Badge variant="outline">{String(val)}</Badge>,
  },
  {
    key: "status",
    title: "Trạng thái",
    render: (val) => {
      const s = String(val);
      const colors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        auto_matched: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        needs_review: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };
      return <Badge className={colors[s] || ""}>{s}</Badge>;
    },
  },
  {
    key: "created_at",
    title: "Ngày gửi",
    render: (val) => new Date(String(val)).toLocaleDateString("vi-VN"),
  },
];

function PendingReviewForm({ 
  item, 
  onClose, 
  onSuccess 
}: { 
  item: PendingProduct; 
  onClose: () => void; 
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    product_name: item.product_name || "",
    brand_id: item.brand_id || "",
    brand_name: item.brand_name || "",
    barcode: item.barcode || "",
    image_url: item.image_url || "",
    description: (item.metadata as any)?.description || "",
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickAddBrandOpen, setIsQuickAddBrandOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);

  const fetchBrands = () => supabase.from("brands").select("id, name").order("name").then(({ data }) => { if (data) setBrands(data); });
  useEffect(() => { fetchBrands(); }, []);

  const handleEditBrand = async () => {
    if (!formData.brand_id) return;
    const { data } = await supabase.from("brands").select("*").eq("id", formData.brand_id).single();
    if (data) {
      setEditingBrand(data);
      setIsQuickAddBrandOpen(true);
    }
  };

  const handleAction = async (status: "approved" | "rejected") => {
    setIsSubmitting(true);
    try {
      // 1. Update pending product
      const { error: updateError } = await supabase
        .from("pending_products")
        .update({ 
          status,
          product_name: formData.product_name,
          brand_id: formData.brand_id || null,
          brand_name: formData.brand_name,
          barcode: formData.barcode,
          image_url: formData.image_url,
          metadata: { ...((item.metadata as object) || {}), description: formData.description },
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      // 2. If approved, ensure the product and barcode exist
      // Note: The DB trigger trg_promote_pending_product should handle this,
      // but we can also do it manually if needed. 
      // Based on user request, let's assume the status update is enough for the trigger.

      toast.success(status === "approved" ? "Đã duyệt và tạo sản phẩm" : "Đã từ chối sản phẩm");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tên sản phẩm</Label>
          <Input value={formData.product_name} onChange={(e) => setFormData({ ...formData, product_name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Barcode</Label>
          <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          Nhãn hàng (Link tới DB)
          <div className="flex gap-1">
            {formData.brand_id && (
              <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={handleEditBrand} title="Sửa nhãn hàng">
                <Edit className="h-3 w-3" />
              </Button>
            )}
            <Button type="button" variant="ghost" size="icon" className="h-4 w-4" onClick={() => { setEditingBrand(null); setIsQuickAddBrandOpen(true); }} title="Thêm nhãn hàng mới">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </Label>
        <select
          value={formData.brand_id}
          onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Chọn nhãn hàng...</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <p className="text-xs text-muted-foreground italic mt-1">Gợi ý từ người dùng: {formData.brand_name}</p>
      </div>

        <div className="space-y-2">
          <Label>Mô tả sản phẩm</Label>
          <Textarea 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            placeholder="Nhập mô tả sản phẩm (Thành phần, đặc điểm...)"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label>URL Ảnh</Label>
          <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
        </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            disabled={isSubmitting} 
            onClick={() => handleAction("rejected")}
          >
            ✗ Từ chối
          </Button>
          <Button 
            disabled={isSubmitting} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleAction("approved")}
          >
            ✓ Duyệt & Tạo SP
          </Button>
        </div>
      </div>

      <Dialog open={isQuickAddBrandOpen} onOpenChange={setIsQuickAddBrandOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingBrand ? "Chỉnh sửa nhãn hàng" : "Thêm nhãn hàng mới"}</DialogTitle></DialogHeader>
          <BrandForm 
            row={editingBrand} 
            onClose={() => setIsQuickAddBrandOpen(false)} 
            onSuccess={() => {
              fetchBrands();
              setIsQuickAddBrandOpen(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PendingTab() {
  const [items, setItems] = useState<PendingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<PendingProduct | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("pending_products")
        .select("*, brand:brands(id, name)", { count: "exact" })
        .in("status", ["pending", "needs_review", "auto_matched"]); // Only show unhandled ones
      
      if (search) {
        query = query.or(`product_name.ilike.%${search}%,barcode.ilike.%${search}%,brand_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setItems(data as PendingProduct[]);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [range, search]);

  const handleRowClick = (item: PendingProduct) => {
    setSelectedItem(item);
    setIsReviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kiểm duyệt sản phẩm</h1>
          <p className="text-muted-foreground text-sm">Nhấp vào một dòng để bắt đầu kiểm duyệt</p>
        </div>
        <Badge variant="secondary">{total} sản phẩm chờ</Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm barcode, tên SP..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchItems}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {pendingColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={pendingColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={pendingColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Không có sản phẩm chờ duyệt
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr 
                  key={item.id} 
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  {pendingColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render
                        ? col.render((item as unknown as Record<string, unknown>)[col.key], item)
                        : String((item as unknown as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Trước</Button>
        <span className="text-sm px-2">Trang {page} / {Math.ceil(total / pageSize) || 1}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= Math.ceil(total / pageSize)}>Sau</Button>
      </div>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kiểm duyệt sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedItem && (
              <PendingReviewForm 
                item={selectedItem} 
                onClose={() => setIsReviewOpen(false)} 
                onSuccess={fetchItems} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   MAIN PAGE — Tabs wrapper
   ================================================================ */

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">🛒 Sản phẩm</TabsTrigger>
          <TabsTrigger value="barcodes">📊 Barcodes</TabsTrigger>
          <TabsTrigger value="categories">📂 Danh mục</TabsTrigger>
          <TabsTrigger value="pending">⏳ Kiểm duyệt</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="barcodes">
          <BarcodesTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="pending">
          <PendingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
