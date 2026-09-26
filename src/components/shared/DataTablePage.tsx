import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: string;
  title: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DataTablePageProps<T> {
  title: string;
  description: string;
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRefresh?: () => void;
  addLabel?: string;
  getRowId: (row: T) => string;
  renderForm?: (
    row: T | null,
    onClose: () => void
  ) => React.ReactNode;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /** Class cho DialogContent của form (mặc định hẹp; truyền rộng hơn cho form nhiều nội dung) */
  formDialogClassName?: string;
}

export function DataTablePage<T>({
  title,
  description,
  columns,
  data,
  isLoading = false,
  searchPlaceholder = "Tìm kiếm...",
  onSearch,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
  addLabel = "Thêm mới",
  getRowId,
  renderForm,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  formDialogClassName = "sm:max-w-lg",
}: DataTablePageProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<T | null>(null);
  const [deleteRow, setDeleteRow] = useState<T | null>(null);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleEdit = (row: T) => {
    setEditingRow(row);
    setIsFormOpen(true);
    onEdit?.(row);
  };

  const handleAdd = () => {
    setEditingRow(null);
    setIsFormOpen(true);
    onAdd?.();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRow(null);
  };

  // Filter client side when no onSearch
  const filteredData =
    !onSearch && searchQuery
      ? data.filter((row) =>
          Object.values(row as Record<string, unknown>).some((val) =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      : data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                {addLabel}
              </Button>
            </DialogTrigger>
            <DialogContent className={`${formDialogClassName} max-h-[90vh] overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle>
                  {editingRow ? "Chỉnh sửa" : "Thêm mới"} {title.toLowerCase()}
                </DialogTitle>
                <DialogDescription>
                  {editingRow
                    ? "Cập nhật thông tin bên dưới."
                    : "Điền thông tin để tạo mới."}
                </DialogDescription>
              </DialogHeader>
              {renderForm?.(editingRow, handleFormClose)}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="whitespace-nowrap">
          {total || filteredData.length} kết quả
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.title}
                </TableHead>
              ))}
              <TableHead className="w-[80px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Skeleton className="h-5 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-32 text-center text-muted-foreground"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  className="group transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(
                            (row as Record<string, unknown>)[col.key],
                            row
                          )
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? "—"
                          )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteRow(row)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xoá
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={() => setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xoá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xoá? Thao tác này sẽ đánh dấu xoá mềm (soft delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Huỷ</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteRow) {
                  onDelete?.(deleteRow);
                  setDeleteRow(null);
                }
              }}
            >
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
