import { ChevronLeft, ChevronRight } from "lucide-react";
import { useThemeStore } from "@/lib/theme";

interface PaginationProps {
  offset: number;
  limit: number;
  total: number;
  onPage: (offset: number) => void;
}

export function Pagination({ offset, limit, total, onPage }: PaginationProps) {
  const theme = useThemeStore((s) => s.theme);
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-400">{total} records</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => onPage(0)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-xs text-gray-400">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage((p - 1) * limit)}
            className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
            style={
              p === currentPage
                ? { backgroundColor: theme.colors[500], color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#6b7280" }
            }
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-xs text-gray-400">...</span>}
            <button
              onClick={() => onPage((totalPages - 1) * limit)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPage(Math.min(total - limit, offset + limit))}
          disabled={offset + limit >= total}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
