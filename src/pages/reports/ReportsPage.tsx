import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw, Search, Eye, AlertCircle, CheckCircle2, XCircle, Edit, Building2, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BrandForm, BrandMoralForm } from "../brands/BrandsPage";
import { ProductForm } from "../products/ProductsPage";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePagination } from "@/hooks/use-pagination";
import type { Report, Brand, Barcode, Product } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  dismissed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [targetInfo, setTargetInfo] = useState<{ brand?: Brand; barcode?: Barcode } | null>(null);
  const [isEditTargetOpen, setIsEditTargetOpen] = useState(false);
  const [isMoralFormOpen, setIsMoralFormOpen] = useState(false);
  const [reportTypes, setReportTypes] = useState<Record<string, string>>({});
  const [editType, setEditType] = useState<"brand" | "product" | null>(null);
  const { page, pageSize, total, setTotal, onPageChange, range } = usePagination();

  // Fetch report types for mapping
  useEffect(() => {
    supabase.from("report_types").select("*").then(({ data }) => {
      if (data) {
        const mapping = data.reduce((acc, current) => {
          acc[current.code] = current.name;
          return acc;
        }, {} as Record<string, string>);
        setReportTypes(mapping);
      }
    });
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("reports")
        .select("*, brand:brands(id, name, logo_url, company:companies(id, name))", { count: "exact" });
      
      if (tab !== "all") {
        query = query.eq("status", tab);
      }
      
      if (search) {
        query = query.or(`type.ilike.%${search}%,description.ilike.%${search}%,barcode_value.ilike.%${search}%`);
      }

      // Initial results fetch
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(range.from, range.to);

      if (error) throw error;
      let finalData = data as Report[];

      // If pending, calculate "Heat" (report frequency)
      if (tab === "pending") {
        // Simple internal count for the current page to prioritize "hot" items
        const reportCounts = finalData.reduce((acc: any, r) => {
          const key = r.barcode_value || r.brand_id || 'unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        finalData = finalData.map(r => ({
          ...r,
          reportCount: reportCounts[r.barcode_value || r.brand_id || 'unknown'] || 1
        })).sort((a: any, b: any) => b.reportCount - a.reportCount);
      }

      setReports(finalData);
      setTotal(count || 0);
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTargetInfo = async (report: Report) => {
    setTargetInfo(null);
    if (report.barcode_value) {
      const { data } = await supabase.from("barcodes").select("*, product:products(*, brand:brands(*))").eq("barcode_value", report.barcode_value).maybeSingle();
      if (data) setTargetInfo(prev => ({ ...prev, barcode: data as Barcode }));
    }
    if (report.brand_id) {
      const { data } = await supabase.from("brands").select("*, company:companies(*)").eq("id", report.brand_id).maybeSingle();
      if (data) setTargetInfo(prev => ({ ...prev, brand: data as Brand }));
    }
  };

  const handleViewDetail = (report: Report) => {
    setSelectedReport(report);
    setResolutionNote(report.resolution_note || "");
    setIsDetailOpen(true);
    fetchTargetInfo(report);
  };

  useEffect(() => {
    fetchReports();
  }, [tab, range, search]);

  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (id: string, status: string, note?: string) => {
    setIsUpdating(true);
    console.log(`Updating report ${id} to ${status} with note: ${note}`);
    try {
      const update: Record<string, any> = { status };
      if (note !== undefined) update.resolution_note = note;
      if (status === "resolved") update.resolved_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("reports")
        .update(update)
        .eq("id", id)
        .select("*");
        
      if (error) throw error;
      
      const updatedRow = data && data.length > 0 ? data[0] : null;
      if (!updatedRow) {
        console.warn("No rows were updated for ID:", id);
        toast.error("Không thể cập nhật report (có thể do quyền hạn hoặc lỗi kết nối)");
        await fetchReports();
        return;
      }
      
      console.log("Update success:", updatedRow);
      toast.success(`Đã cập nhật: ${status}`);
      
      // OPTIMISTIC UPDATE: Update local state immediately
      setReports(prev => prev.map(r => r.id === id ? { ...r, status, resolution_note: note || r.resolution_note } : r));
      
      // Close dialog and reset state
      setIsDetailOpen(false);
      setResolutionNote("");
      setSelectedReport(null);
      
      // Still refresh to ensure pagination and filters match DB exactly
      await fetchReports();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(`Lỗi cập nhật: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm">Hàng đợi báo cáo từ người dùng</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchReports}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); onPageChange(1); }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">⏳ Chờ xử lý</TabsTrigger>
          <TabsTrigger value="resolved">✅ Đã giải quyết</TabsTrigger>
          <TabsTrigger value="dismissed">🚫 Bỏ qua</TabsTrigger>
          <TabsTrigger value="all">📋 Tất cả</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm report..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Badge variant="secondary">{total} kết quả</Badge>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Loại</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mô tả</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Brand</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Barcode</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ngày</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Đang tải...</td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleViewDetail(r)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20">
                            {reportTypes[r.type] || r.type}
                          </Badge>
                          {(r as any).reportCount > 1 && (
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30">
                              🔥 {(r as any).reportCount}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">{r.description || "—"}</td>
                      <td className="px-4 py-3">
                        {r.brand?.name ? (
                          <div className="flex flex-col">
                            <span>{r.brand.name}</span>
                            {r.brand.company?.name && <span className="text-xs text-muted-foreground">{r.brand.company.name}</span>}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3"><code className="text-xs font-mono">{r.barcode_value || "—"}</code></td>
                      <td className="px-4 py-3"><Badge className={statusColors[r.status] || ""}>{r.status}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("vi-VN")}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleViewDetail(r)} title="Xem chi tiết">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Trước</Button>
          <span className="text-sm px-2">Trang {page} / {Math.ceil(total / pageSize) || 1}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= Math.ceil(total / pageSize)}>Sau</Button>
        </div>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Chi tiết báo cáo
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Thông tin chung</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-sm font-medium px-3">
                        {reportTypes[selectedReport.type] || selectedReport.type}
                      </Badge>
                      <Badge className={`${statusColors[selectedReport.status]} border shadow-sm`}>
                        {selectedReport.status === 'pending' ? '⏳ Chờ xử lý' : 
                         selectedReport.status === 'resolved' ? '✅ Đã giải quyết' : '🚫 Đã bác bỏ'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Nội dung báo cáo 📝</Label>
                    <p className="mt-1.5 text-sm bg-muted/50 p-3 rounded-lg border italic leading-relaxed text-foreground/80">
                      "{selectedReport.description || "Không có mô tả chi tiết"}"
                    </p>
                  </div>
                  
                  {selectedReport.status !== 'pending' && (
                    <div className="p-3 rounded-lg border bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/50">
                      <Label className="text-xs text-emerald-700 dark:text-emerald-400 uppercase font-bold">Kết quả xử lý</Label>
                      <p className="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        {selectedReport.resolution_note || "Đã giải quyết (không có ghi chú)"}
                      </p>
                      {selectedReport.resolved_at && (
                        <p className="text-[10px] text-emerald-600 mt-1">
                          Hoàn tất lúc: {new Date(selectedReport.resolved_at).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-l pl-6 bg-muted/20 rounded-r-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Đối tượng liên quan 🎯</Label>
                    <div className="mt-2 space-y-3">
                      {selectedReport.brand_id && (
                        <div className="p-3 rounded-lg border bg-white dark:bg-background shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">Brand</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-50" onClick={() => { setEditType("brand"); setIsEditTargetOpen(true); }} title="Chỉnh sửa brand">
                              <Edit className="h-3 w-3 text-blue-600" />
                            </Button>
                          </div>
                          <p className="font-bold text-blue-900 dark:text-blue-200">{targetInfo?.brand?.name || "Đang tải..."}</p>
                          {targetInfo?.brand?.company && (
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {targetInfo.brand.company.name}
                            </p>
                          )}
                          
                          {/* Quick Action: Moral Status */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2 text-[10px] h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setIsMoralFormOpen(true)}
                          >
                            <Shield className="h-3 w-3 mr-1" /> Cập nhật Trạng thái đạo đức
                          </Button>
                        </div>
                      )}
                      
                      {selectedReport.barcode_value && (
                        <div className="p-3 rounded-lg border bg-white dark:bg-background shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-orange-600 border-orange-200">Barcode</Badge>
                            {targetInfo?.barcode?.product && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-orange-50" onClick={() => { setEditType("product"); setIsEditTargetOpen(true); }} title="Chỉnh sửa sản phẩm">
                                <Edit className="h-3 w-3 text-orange-600" />
                              </Button>
                            )}
                          </div>
                          <code className="text-sm block font-mono font-bold text-orange-700 dark:text-orange-300 mb-1">{selectedReport.barcode_value}</code>
                          {(targetInfo?.barcode?.product) ? (
                            <div className="text-xs border-t pt-2 mt-2">
                              <p className="font-bold">{(targetInfo.barcode.product as any).name}</p>
                              <p className="text-muted-foreground italic">Nhãn hàng: {(targetInfo.barcode.product as any).brand?.name}</p>
                            </div>
                          ) : (
                            <div className="text-center py-2 text-xs italic text-muted-foreground border border-dashed rounded mt-2">
                              Chưa có sản phẩm liên kết
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 
                    Ghi chú xử lý (Admin)
                  </Label>
                  <Textarea 
                    placeholder="Nhập ghi chú giải quyết, hướng khắc phục hoặc lý do bác bỏ báo cáo này..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="min-h-[100px] border-emerald-100 focus-visible:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedReport?.status !== "resolved" && selectedReport?.status !== "dismissed" && (
              <div className="flex w-full gap-2">
                <Button 
                  variant="outline" 
                  disabled={isUpdating}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50" 
                  onClick={() => updateStatus(selectedReport!.id, "dismissed", resolutionNote)}
                >
                  {isUpdating ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Bác bỏ
                </Button>
                <Button 
                  disabled={isUpdating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={() => updateStatus(selectedReport!.id, "resolved", resolutionNote)}
                >
                  {isUpdating ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Giải quyết
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditTargetOpen} onOpenChange={setIsEditTargetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa {editType === "brand" ? "Nhãn hàng" : "Sản phẩm"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {editType === "brand" && targetInfo?.brand && (
              <BrandForm 
                row={targetInfo.brand} 
                onClose={() => setIsEditTargetOpen(false)} 
                onSuccess={() => {
                  fetchTargetInfo(selectedReport!);
                  setIsEditTargetOpen(false);
                }} 
              />
            )}
            {editType === "product" && targetInfo?.barcode?.product && (
              <ProductForm 
                row={targetInfo.barcode.product as unknown as Product} 
                onClose={() => setIsEditTargetOpen(false)} 
                onSuccess={() => {
                  fetchTargetInfo(selectedReport!);
                  setIsEditTargetOpen(false);
                }} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isMoralFormOpen} onOpenChange={setIsMoralFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái đạo đức</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedReport?.brand_id && (
              <BrandMoralForm 
                row={null} 
                onClose={() => setIsMoralFormOpen(false)} 
                onSuccess={() => {
                  toast.success("Đã cập nhật trạng thái đạo đức của brand");
                  setIsMoralFormOpen(false);
                }} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
