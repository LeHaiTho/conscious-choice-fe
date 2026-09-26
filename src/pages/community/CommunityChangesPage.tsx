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
import { RefreshCcw, Undo2 } from "lucide-react";

interface ContentChange {
  id: string;
  target_type: string;
  target_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  vote_count: number | null;
  status: string;
  applied_at: string;
  reverted_at: string | null;
}

const FIELD_LABEL: Record<string, string> = {
  brand_name: "Tên thương hiệu",
  product_name: "Tên sản phẩm",
  category: "Danh mục",
  boycott: "Trạng thái tẩy chay",
  new_product: "Sản phẩm mới",
};

const BOYCOTT_LABEL: Record<string, string> = {
  targeted: "Tẩy chay",
  pressure: "Gây áp lực",
  alternative: "Khuyến nghị",
};

function displayValue(field: string, val: string | null) {
  if (val == null || val === "") return "—";
  if (field === "boycott") return BOYCOTT_LABEL[val] || val;
  return val;
}

export default function CommunityChangesPage() {
  const [items, setItems] = useState<ContentChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_changes")
        .select("*")
        .order("applied_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setItems((data as ContentChange[]) || []);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRevert = async (id: string) => {
    setReverting(id);
    try {
      const { data, error } = await supabase.rpc("revert_change", { p_change_id: id });
      if (error) throw error;
      if (data && (data as any).ok === false) {
        toast.error("Không thể hoàn tác: " + ((data as any).reason || ""));
      } else {
        toast.success("Đã hoàn tác về giá trị cũ");
        fetchItems();
      }
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setReverting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thay đổi cộng đồng</h1>
          <p className="text-muted-foreground text-sm">
            Các thay đổi tự động do cộng đồng đồng thuận (N=3). Bạn có thể hoàn tác nếu không hợp lý.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchItems}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Loại</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead>Thay đổi</TableHead>
              <TableHead className="text-center">Phiếu</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Chưa có thay đổi nào từ cộng đồng
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{FIELD_LABEL[c.field] || c.field}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground" title={c.target_id}>
                    {c.target_type} · {c.target_id}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground line-through">{displayValue(c.field, c.old_value)}</span>
                    <span className="mx-2">→</span>
                    <span className="font-semibold">{displayValue(c.field, c.new_value)}</span>
                  </TableCell>
                  <TableCell className="text-center">{c.vote_count ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.applied_at).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "reverted" ? "secondary" : "default"}
                      className={c.status === "applied" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
                    >
                      {c.status === "reverted" ? "Đã hoàn tác" : "Đang áp dụng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.status === "applied" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reverting === c.id}
                        onClick={() => handleRevert(c.id)}
                      >
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                        {reverting === c.id ? "Đang..." : "Hoàn tác"}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
