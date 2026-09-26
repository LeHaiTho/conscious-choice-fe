import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, RefreshCcw, Megaphone, Bell } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  body: string;
  tone: "normal" | "urgent";
  icon: string | null;
  priority: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  days_of_week: number[] | null;
}

const DAYS = [
  { v: 1, label: "T2" },
  { v: 2, label: "T3" },
  { v: 3, label: "T4" },
  { v: 4, label: "T5" },
  { v: 5, label: "T6" },
  { v: 6, label: "T7" },
  { v: 0, label: "CN" },
];

const emptyForm = {
  title: "",
  body: "",
  tone: "normal" as "normal" | "urgent",
  icon: "",
  priority: 0,
  is_active: true,
  start_date: "",
  end_date: "",
  days_of_week: [] as number[],
};

function scheduleText(b: Banner): string {
  const parts: string[] = [];
  if (b.days_of_week && b.days_of_week.length > 0) {
    const labels = DAYS.filter((d) => b.days_of_week!.includes(d.v)).map((d) => d.label);
    parts.push(labels.join(", "));
  } else {
    parts.push("Mọi ngày");
  }
  if (b.start_date || b.end_date) {
    parts.push(`(${b.start_date || "…"} → ${b.end_date || "…"})`);
  }
  return parts.join(" ");
}

export default function BannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reminder_banners")
        .select("*")
        .eq("is_deleted", false)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as Banner[]) || []);
    } catch (e: any) {
      toast.error(`Lỗi tải: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      body: b.body,
      tone: b.tone,
      icon: b.icon || "",
      priority: b.priority,
      is_active: b.is_active,
      start_date: b.start_date || "",
      end_date: b.end_date || "",
      days_of_week: b.days_of_week || [],
    });
    setOpen(true);
  };

  const toggleDay = (v: number) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(v)
        ? f.days_of_week.filter((d) => d !== v)
        : [...f.days_of_week, v],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      tone: form.tone,
      icon: form.icon.trim() || null,
      priority: Number(form.priority) || 0,
      is_active: form.is_active,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      days_of_week: form.days_of_week.length > 0 ? form.days_of_week : null,
    };
    try {
      if (editing) {
        const { error } = await supabase
          .from("reminder_banners")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Đã cập nhật banner");
      } else {
        const { error } = await supabase.from("reminder_banners").insert(payload);
        if (error) throw error;
        toast.success("Đã tạo banner");
      }
      setOpen(false);
      fetchItems();
    } catch (e: any) {
      toast.error(`Lỗi lưu: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      const { error } = await supabase
        .from("reminder_banners")
        .update({ is_active: !b.is_active })
        .eq("id", b.id);
      if (error) throw error;
      fetchItems();
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`);
    }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`Xóa banner "${b.title}"?`)) return;
    try {
      const { error } = await supabase
        .from("reminder_banners")
        .update({ is_deleted: true })
        .eq("id", b.id);
      if (error) throw error;
      toast.success("Đã xóa");
      fetchItems();
    } catch (e: any) {
      toast.error(`Lỗi: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banner nhắc nhở</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý banner hiển thị ở đầu màn hình chính của app. App tự chọn banner
            hợp lệ cho hôm nay theo khoảng ngày, thứ trong tuần và độ ưu tiên.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchItems}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Tạo banner
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nội dung</TableHead>
              <TableHead>Kiểu</TableHead>
              <TableHead>Lịch hiển thị</TableHead>
              <TableHead className="text-center">Ưu tiên</TableHead>
              <TableHead className="text-center">Bật</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Chưa có banner nào
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                <TableRow key={b.id} className={b.is_active ? "" : "opacity-50"}>
                  <TableCell className="max-w-[280px]">
                    <div className="flex items-center gap-2 font-medium">
                      {b.tone === "urgent" ? (
                        <Megaphone className="h-4 w-4 shrink-0 text-red-500" />
                      ) : (
                        <Bell className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                      <span className="truncate">{b.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{b.body}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={b.tone === "urgent" ? "destructive" : "secondary"}
                    >
                      {b.tone === "urgent" ? "Khẩn cấp" : "Thường"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {scheduleText(b)}
                  </TableCell>
                  <TableCell className="text-center">{b.priority}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={b.is_active}
                      onCheckedChange={() => handleToggleActive(b)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(b)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Chỉnh sửa banner" : "Tạo banner mới"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tiêu đề *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: Hôm nay là thứ 5! Global Strike for Gaza!"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nội dung *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Mô tả ngắn hiển thị dưới tiêu đề"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kiểu</Label>
                <Select
                  value={form.tone}
                  onValueChange={(v) => setForm({ ...form, tone: v as "normal" | "urgent" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Thường (xanh)</SelectItem>
                    <SelectItem value="urgent">Khẩn cấp (đỏ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Độ ưu tiên</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Icon (tùy chọn — tên Ionicons)</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="VD: megaphone, notifications, heart (để trống = tự động)"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Hiển thị vào các thứ (để trống = mọi ngày)</Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {DAYS.map((d) => (
                  <label key={d.v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.days_of_week.includes(d.v)}
                      onCheckedChange={() => toggleDay(d.v)}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Từ ngày (tùy chọn)</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Đến ngày (tùy chọn)</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(c) => setForm({ ...form, is_active: !!c })}
              />
              Bật hiển thị
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
