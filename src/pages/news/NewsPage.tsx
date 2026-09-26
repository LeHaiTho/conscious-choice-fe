import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePagination } from "@/hooks/use-pagination";

const NEWS_CATEGORIES = ["Thông báo", "Tẩy chay", "Hàng Việt", "Sự kiện", "Mẹo tiêu dùng", "Khác"];

interface NewsRow {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  images: string[] | null;
  facebook_url: string | null;
  category: string | null;
  is_pinned: boolean;
  is_published: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}

async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("news-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from("news-images").getPublicUrl(path).data.publicUrl;
}

const columns: Column<NewsRow>[] = [
  {
    key: "image_url",
    title: "Ảnh",
    render: (val) =>
      val ? (
        <img src={String(val)} alt="" className="w-14 h-14 rounded-lg object-cover border" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">—</div>
      ),
  },
  {
    key: "title",
    title: "Bài viết",
    render: (val, row) => (
      <div className="max-w-md">
        <div className="flex items-center gap-1.5">
          {row.is_pinned ? <span title="Đã ghim">📌</span> : null}
          {val ? <div className="font-semibold line-clamp-1">{String(val)}</div> : null}
        </div>
        <div className="text-sm text-muted-foreground line-clamp-2">{row.content}</div>
      </div>
    ),
  },
  {
    key: "category",
    title: "Danh mục",
    render: (val) =>
      val ? (
        <Badge variant="outline">{String(val)}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    key: "is_published",
    title: "Trạng thái",
    render: (val) => (
      <Badge
        variant={val ? "default" : "secondary"}
        className={val ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
      >
        {val ? "Hiển thị" : "Ẩn"}
      </Badge>
    ),
  },
  {
    key: "created_at",
    title: "Ngày đăng",
    render: (val) => (
      <span className="text-sm text-muted-foreground">
        {val ? new Date(String(val)).toLocaleDateString("vi-VN") : "—"}
      </span>
    ),
  },
];

function NewsForm({
  row,
  onClose,
  onSuccess,
}: {
  row: NewsRow | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: row?.title || "",
    content: row?.content || "",
    image_url: row?.image_url || "",
    images: (Array.isArray(row?.images) ? row?.images : []) as string[],
    facebook_url: row?.facebook_url || "",
    category: row?.category || "",
    is_published: row?.is_published ?? true,
    is_pinned: row?.is_pinned ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToStorage(file);
      setFormData((f) => ({ ...f, image_url: url }));
      toast.success("Đã tải ảnh thumbnail");
    } catch (err: any) {
      toast.error(`Lỗi tải ảnh: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        urls.push(await uploadToStorage(file));
      }
      setFormData((f) => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`Đã tải ${urls.length} ảnh`);
    } catch (err: any) {
      toast.error(`Lỗi tải ảnh: ${err.message}`);
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (idx: number) => {
    setFormData((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }
    setIsSubmitting(true);
    const payload = {
      title: formData.title.trim() || null,
      content: formData.content.trim(),
      image_url: formData.image_url.trim() || null,
      images: formData.images,
      facebook_url: formData.facebook_url.trim() || null,
      category: formData.category || null,
      is_published: formData.is_published,
      is_pinned: formData.is_pinned,
    };
    try {
      if (row) {
        const { error } = await supabase.from("news").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news").insert(payload);
        if (error) throw error;
      }
      toast.success(row ? "Cập nhật thành công" : "Đăng bài thành công");
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
        <Label>Tiêu đề (tùy chọn)</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="VD: Global Strike for Gaza — Thứ 5 hàng tuần"
        />
      </div>

      <div className="space-y-2">
        <Label>Nội dung *</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Viết nội dung bài viết ở đây… (thoải mái, xuống dòng được giữ nguyên)"
          rows={12}
          className="min-h-[220px]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Ảnh thumbnail / bìa (hiển thị ngoài danh sách)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading ? <span className="text-sm text-muted-foreground whitespace-nowrap">Đang tải…</span> : null}
        </div>
        <Input
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="Hoặc dán link ảnh: https://..."
        />
        {formData.image_url ? (
          <div className="relative mt-2 w-fit">
            <img src={formData.image_url} alt="" className="max-h-40 rounded-lg object-cover border" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setFormData({ ...formData, image_url: "" })}
            >
              Xoá
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Ảnh đính kèm (gallery — hiển thị dưới nội dung, kiểu Facebook)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryUpload}
            disabled={uploadingGallery}
            className="cursor-pointer"
          />
          {uploadingGallery ? <span className="text-sm text-muted-foreground whitespace-nowrap">Đang tải…</span> : null}
        </div>
        {formData.images.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {formData.images.map((url, i) => (
              <div key={i} className="relative aspect-square">
                <img src={url} alt="" className="w-full h-full rounded-lg object-cover border" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none shadow"
                  title="Xoá ảnh"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Chọn nhiều ảnh cùng lúc để đính kèm vào bài.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Link Facebook gốc (tùy chọn)</Label>
        <Input
          value={formData.facebook_url}
          onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
          placeholder="https://facebook.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label>Danh mục</Label>
        <Select
          value={formData.category || undefined}
          onValueChange={(v) => setFormData({ ...formData, category: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn danh mục (tùy chọn)" />
          </SelectTrigger>
          <SelectContent>
            {NEWS_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(v) => setFormData({ ...formData, is_published: Boolean(v) })}
        />
        <Label htmlFor="is_published" className="cursor-pointer">
          Hiển thị bài viết trong app
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_pinned"
          checked={formData.is_pinned}
          onCheckedChange={(v) => setFormData({ ...formData, is_pinned: Boolean(v) })}
        />
        <Label htmlFor="is_pinned" className="cursor-pointer">
          📌 Ghim bài (hiện lên đầu)
        </Label>
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
          {isSubmitting ? "Đang lưu..." : row ? "Cập nhật" : "Đăng bài"}
        </Button>
      </div>
    </form>
  );
}

function FooterSettingCard() {
  const [footer, setFooter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "news_footer")
          .single();
        setFooter(data?.value || "");
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "news_footer", value: footer, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success("Đã lưu footer chung");
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Footer chung (tự thêm vào cuối mọi bài)</h2>
        <p className="text-sm text-muted-foreground">Thông tin liên hệ hiển thị ở cuối mỗi bài viết trong app.</p>
      </div>
      <Textarea
        value={footer}
        onChange={(e) => setFooter(e.target.value)}
        rows={4}
        disabled={loading}
        placeholder={"Mọi thông tin xin liên hệ:\nGmail: ...\nFacebook: ..."}
      />
      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving || loading}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          {saving ? "Đang lưu..." : "Lưu footer"}
        </Button>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("news").select("*", { count: "exact" }).eq("is_deleted", false);

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      setItems(data as NewsRow[]);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [range, search]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("news").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
      toast.success("Đã xoá bài viết");
      fetchItems();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const togglePublish = async (row: NewsRow) => {
    try {
      const { error } = await supabase
        .from("news")
        .update({ is_published: !row.is_published })
        .eq("id", row.id);
      if (error) throw error;
      toast.success(row.is_published ? "Đã gỡ bài (ẩn khỏi app)" : "Đã đăng lại bài");
      fetchItems();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const columnsWithToggle: Column<NewsRow>[] = [
    ...columns,
    {
      key: "_toggle",
      title: "",
      render: (_v, row) => (
        <Button
          size="sm"
          variant="outline"
          className={
            row.is_published
              ? "text-amber-600 hover:text-amber-700"
              : "text-emerald-600 hover:text-emerald-700"
          }
          onClick={() => togglePublish(row)}
        >
          {row.is_published ? "Gỡ bài" : "Đăng lại"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <FooterSettingCard />
      <DataTablePage
        title="Tin tức"
        description="Quản lý bài viết hiển thị trong app"
        columns={columnsWithToggle}
        data={items}
        isLoading={isLoading}
        getRowId={(r) => r.id}
        searchPlaceholder="Tìm bài viết..."
        addLabel="Đăng bài"
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onSearch={setSearch}
        onRefresh={fetchItems}
        formDialogClassName="sm:max-w-2xl"
        renderForm={(row, onClose) => <NewsForm row={row} onClose={onClose} onSuccess={fetchItems} />}
        onDelete={(row) => handleDelete(row.id)}
      />
    </div>
  );
}
