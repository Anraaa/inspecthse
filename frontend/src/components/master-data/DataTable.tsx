import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { ColumnDef } from "@/lib/masterData";
import { useThemeStore } from "@/lib/theme";
import { debounce } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";

interface DataTableProps {
  columns: ColumnDef[];
  data: Record<string, unknown>[];
  total?: number;
  offset: number;
  limit: number;
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  onPage: (offset: number) => void;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
}

export function DataTable({
  columns, data, total, offset, limit, loading, search, onSearch, onPage, onEdit, onDelete,
}: DataTableProps) {
  const theme = useThemeStore((s) => s.theme);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useRef(debounce((v: string) => onSearch(v), 300)).current;

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalSearch(v);
    debouncedSearch(v);
  }, [debouncedSearch]);

  const isServerPaginated = total != null;
  const effectiveTotal = isServerPaginated ? total : data.length;

  const displayData = useMemo(() => {
    const sorted = !sortKey ? [...data] : [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    if (isServerPaginated) return sorted;
    return sorted.slice(offset, offset + limit);
  }, [data, sortKey, sortDir, isServerPaginated, offset, limit]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none transition-all focus:ring-2"
            style={{ "--tw-ring-color": `${theme.colors[500]}40` } as React.CSSProperties}
          />
        </div>
        <span className="text-sm text-gray-400">{effectiveTotal} records</span>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 ${col.sortable ? "cursor-pointer select-none" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                        : <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${theme.colors[200]} ${theme.colors[500]} ${theme.colors[200]} ${theme.colors[200]}` }} />
                    <span className="text-sm text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center text-sm text-gray-400">
                  <p className="mb-1 text-lg">📭</p>
                  No data found
                </td>
              </tr>
            ) : (
              displayData.map((row, i) => (
                <tr key={String(row.id ?? i)} className="hover:bg-gray-50 transition-colors group">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "-")}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100 sm:group-hover:opacity-100">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
                          style={{ color: theme.colors[600], backgroundColor: `${theme.colors[50]}` }}
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {effectiveTotal > limit && (
        <Pagination offset={offset} limit={limit} total={effectiveTotal} onPage={onPage} />
      )}
    </div>
  );
}
