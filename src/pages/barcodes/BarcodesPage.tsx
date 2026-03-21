import { useState } from "react";
import { DataTablePage, type Column } from "@/components/shared/DataTablePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Barcode } from "@/types";

const sampleBarcodes: Barcode[] = [
  {
    barcode_value: "5449000000996",
    product_id: "1",
    is_verified: true,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    product: { id: "1", brand_id: "1", name: "Coca-Cola Classic 330ml", is_deleted: false, created_at: "", updated_at: "" },
  },
  {
    barcode_value: "5449000131805",
    product_id: "2",
    is_verified: true,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    product: { id: "2", brand_id: "1", name: "Coca-Cola Zero Sugar 320ml", is_deleted: false, created_at: "", updated_at: "" },
  },
  {
    barcode_value: "5449000012345",
    product_id: "3",
    is_verified: false,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    product: { id: "3", brand_id: "2", name: "Fanta Cam 330ml", is_deleted: false, created_at: "", updated_at: "" },
  },
  {
    barcode_value: "8934673001234",
    product_id: "4",
    is_verified: true,
    is_deleted: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    product: { id: "4", brand_id: "4", name: "Vinamilk Sữa Tươi 180ml", is_deleted: false, created_at: "", updated_at: "" },
  },
];

const columns: Column<Barcode>[] = [
  {
    key: "barcode_value",
    title: "Mã vạch",
    render: (val) => (
      <code className="font-mono text-sm bg-muted px-2 py-1 rounded font-medium">
        {String(val)}
      </code>
    ),
  },
  {
    key: "product",
    title: "Sản phẩm",
    render: (_val, row) => (
      <span className="font-medium">{row.product?.name || "—"}</span>
    ),
  },
  {
    key: "is_verified",
    title: "Xác thực",
    render: (val) =>
      val ? (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          ✓ Verified
        </Badge>
      ) : (
        <Badge variant="secondary">Chưa xác thực</Badge>
      ),
  },
  {
    key: "is_deleted",
    title: "Trạng thái",
    render: (val) => (
      <Badge variant={val ? "destructive" : "default"} className={!val ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>
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

function BarcodeForm({
  row,
  onClose,
}: {
  row: Barcode | null;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    barcode_value: row?.barcode_value || "",
    product_id: row?.product_id || "",
    is_verified: row?.is_verified || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit:", formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="barcode_value">Mã vạch</Label>
        <Input
          id="barcode_value"
          value={formData.barcode_value}
          onChange={(e) =>
            setFormData({ ...formData, barcode_value: e.target.value })
          }
          placeholder="5449000000996"
          required
          disabled={!!row}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product_id">Product ID</Label>
        <Input
          id="product_id"
          value={formData.product_id}
          onChange={(e) =>
            setFormData({ ...formData, product_id: e.target.value })
          }
          placeholder="UUID sản phẩm"
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_verified"
          checked={formData.is_verified}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_verified: !!checked })
          }
        />
        <Label htmlFor="is_verified" className="text-sm font-normal">
          Đã xác thực (Verified)
        </Label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Huỷ
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          {row ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </form>
  );
}

export default function BarcodesPage() {
  return (
    <DataTablePage
      title="Barcodes"
      description="Quản lý mã vạch liên kết với sản phẩm"
      columns={columns}
      data={sampleBarcodes}
      getRowId={(row) => row.barcode_value}
      searchPlaceholder="Tìm kiếm mã vạch..."
      addLabel="Thêm barcode"
      total={sampleBarcodes.length}
      renderForm={(row, onClose) => (
        <BarcodeForm row={row} onClose={onClose} />
      )}
      onDelete={(row) => console.log("Delete:", row.barcode_value)}
    />
  );
}
