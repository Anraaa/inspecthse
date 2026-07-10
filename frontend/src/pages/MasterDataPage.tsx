import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";
import { resourceConfigs, isMasterResource, fetchReferenceData } from "@/lib/masterData";
import type { ResourceConfig } from "@/lib/masterData";
import { DataTable } from "@/components/master-data/DataTable";
import { FormModal } from "@/components/master-data/FormModal";
import { useThemeStore } from "@/lib/theme";

export function MasterDataPage() {
  const params = useParams();
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const resource = params.resource || "sections";
  const config: ResourceConfig | undefined = resourceConfigs[resource];

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [referenceData, setReferenceData] = useState<Record<string, { label: string; value: string | number }[]>>({});

  const fetchData = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    setError("");
    try {
      const reqParams: Record<string, string | number> = {};
      if (config.paginated) {
        reqParams.limit = limit;
        reqParams.offset = offset;
        if (search) reqParams.search = search;
      }
      const res = await api.get(config.endpoint, { params: reqParams });
      if (config.paginated) {
        setData(res.data.data || []);
        setTotal(res.data.total ?? res.data.data?.length);
      } else {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        if (search) {
          const q = search.toLowerCase();
          setData(list.filter((r: Record<string, unknown>) =>
            Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
          ));
        } else setData(list);
        setTotal(undefined);
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [config, limit, offset, search]);

  useEffect(() => { if (config) fetchData(); }, [config, fetchData]);
  useEffect(() => { if (config) setOffset(0); }, [search, config]);
  useEffect(() => {
    if (!resource) return;
    if (!isMasterResource(resource)) { navigate("/sections", { replace: true }); return; }
    setReferenceData({});
    fetchReferenceData(resource).then(setReferenceData);
  }, [resource, navigate]);

  if (!config) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Invalid resource</div>;
  }

  const resourceList = Object.entries(resourceConfigs).map(([key, cfg]) => ({ key, label: cfg.namePlural }));

  return (
    <div>
      {/* Top Header & Navigation Group */}
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Title and Add Button Row */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{config.namePlural}</h1>
          <button
            onClick={() => { setEditRow(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white rounded-xl transition-all hover:opacity-90 shadow-md shadow-primary-500/10 shrink-0"
            style={{ backgroundColor: theme.colors[600] }}
          >
            <Plus className="w-4 h-4" />
            Add {config.name}
          </button>
        </div>

        {/* Horizontally Scrollable Resource Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none snap-x snap-proximity lg:overflow-x-visible lg:pb-0 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {resourceList.map((r) => {
            const isSelected = resource === r.key;
            return (
              <button
                key={r.key}
                onClick={() => navigate(`/${r.key}`)}
                className="px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap snap-start border"
                style={{
                  backgroundColor: isSelected ? `${theme.colors[50]}` : "white",
                  color: isSelected ? theme.colors[700] : "#6b7280",
                  borderColor: isSelected ? `${theme.colors[200]}` : "#e5e7eb",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <DataTable
          columns={config.columns}
          data={data}
          total={total}
          offset={offset}
          limit={limit}
          loading={loading}
          search={search}
          onSearch={setSearch}
          onPage={setOffset}
          onEdit={(row) => { setEditRow(row); setModalOpen(true); }}
          onDelete={(row) => setDeleteTarget(row)}
        />
      </div>

      {modalOpen && (
        <FormModal
          title={editRow ? `Edit ${config.name}` : `New ${config.name}`}
          fields={config.formFields}
          initialData={editRow}
          referenceData={referenceData}
          onSubmit={async (formData) => {
            const transformed = config.transformSubmit ? config.transformSubmit(formData) : formData;
            if (editRow) {
              await api.put(`${config.endpoint}/${editRow.id}`, { ...transformed, id: editRow.id });
            } else {
              await api.post(config.endpoint, transformed);
            }
            setEditRow(null);
            setModalOpen(false);
            fetchData();
          }}
          onClose={() => { setModalOpen(false); setEditRow(null); }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete {config.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{String(deleteTarget.name || deleteTarget.id)}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.delete(`${config.endpoint}/${deleteTarget.id}`);
                    setDeleteTarget(null);
                    fetchData();
                  } catch (err: unknown) {
                    alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to delete");
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
