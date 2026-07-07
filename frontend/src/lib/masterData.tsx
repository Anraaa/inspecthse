import { useState } from "react";
import { QrCode } from "lucide-react";
import api from "./axios";

export interface ColumnDef {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  sortable?: boolean;
}

export interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "password" | "select" | "toggle" | "textarea";
  required?: boolean;
  options?: { label: string; value: string | number | boolean | null }[];
  placeholder?: string;
  hidden?: boolean;
}

export interface ResourceConfig {
  name: string;
  namePlural: string;
  endpoint: string;
  paginated: boolean;
  columns: ColumnDef[];
  formFields: FormField[];
  refetchKeys?: string[];
  transformSubmit?: (data: Record<string, unknown>) => Record<string, unknown>;
}

const assetCategoryOptions = [
  { label: "APAR", value: "APAR" },
  { label: "HYDRANT", value: "HYDRANT" },
  { label: "FIRE ALARM", value: "FIRE_ALARM" },
];

const inputTypeOptions = [
  { label: "Boolean", value: "boolean" },
  { label: "Numeric", value: "numeric" },
  { label: "Text", value: "text" },
  { label: "Option", value: "option" },
];

const checkTypeOptions = [
  { label: "Fisik", value: "fisik" },
  { label: "Fungsi", value: "fungsi" },
];

const roleOptions = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "K3L", value: "K3L" },
  { label: "Tim HSE", value: "TIM_HSE" },
];

function fmtDate(val: unknown): string {
  if (!val) return "-";
  return new Date(val as string).toLocaleDateString("id-ID", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function QRDownloadButton({ endpoint, filename }: { endpoint: string; filename: string }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      alert("Gagal mengunduh QR Code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-50 border border-primary-100"
    >
      <QrCode className="w-3.5 h-3.5" />
      {loading ? "..." : "QR Code"}
    </button>
  );
}

export const resourceConfigs: Record<string, ResourceConfig> = {
  sections: {
    name: "Section",
    namePlural: "Sections",
    endpoint: "/sections",
    paginated: false,
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "description", label: "Description" },
      { key: "created_at", label: "Created", render: (v) => fmtDate(v) },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  locations: {
    name: "Location",
    namePlural: "Locations",
    endpoint: "/locations",
    paginated: false,
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "description", label: "Description" },
      { key: "created_at", label: "Created", render: (v) => fmtDate(v) },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  shifts: {
    name: "Shift",
    namePlural: "Shifts",
    endpoint: "/shifts",
    paginated: false,
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "start_time", label: "Start" },
      { key: "end_time", label: "End" },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "start_time", label: "Start Time", type: "text", required: true, placeholder: "HH:MM" },
      { key: "end_time", label: "End Time", type: "text", required: true, placeholder: "HH:MM" },
    ],
  },
  parameters: {
    name: "Parameter",
    namePlural: "Parameters",
    endpoint: "/parameters",
    paginated: false,
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "asset_category", label: "Category", render: (v) => <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">{v as string}</span> },
      { key: "parameter_name", label: "Parameter", sortable: true },
      { key: "input_type", label: "Type", render: (v) => <span className="capitalize text-xs text-gray-500">{v as string}</span> },
      { key: "check_type", label: "Check", render: (v) => <span className="capitalize text-xs text-gray-500">{v as string}</span> },
      { key: "is_required", label: "Required", render: (v) => v ? <span className="text-green-600 text-xs font-medium">Yes</span> : <span className="text-gray-400 text-xs">No</span> },
      { key: "sort_order", label: "Order" },
    ],
    formFields: [
      { key: "asset_category", label: "Asset Category", type: "select", required: true, options: assetCategoryOptions },
      { key: "parameter_name", label: "Parameter Name", type: "text", required: true },
      { key: "input_type", label: "Input Type", type: "select", required: true, options: inputTypeOptions },
      { key: "check_type", label: "Check Type", type: "select", required: true, options: checkTypeOptions },
      { key: "unit", label: "Unit", type: "text", placeholder: "kg, bar, psi..." },
      { key: "options", label: "Options (comma separated)", type: "text", placeholder: "opsi1,opsi2,opsi3" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "is_required", label: "Required", type: "toggle" },
    ],
  },
  users: {
    name: "User",
    namePlural: "Users",
    endpoint: "/users",
    paginated: true,
    refetchKeys: ["users"],
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "email", label: "Email" },
      { key: "role", label: "Role", render: (v) => <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700">{v as string}</span> },
      { key: "is_active", label: "Status", render: (v) => v ? <span className="text-green-600 text-xs font-medium">Active</span> : <span className="text-red-500 text-xs font-medium">Inactive</span> },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "Leave empty to keep current" },
      { key: "role", label: "Role", type: "select", required: true, options: roleOptions },
      { key: "section_id", label: "Section", type: "select", options: [] },
      { key: "is_active", label: "Active", type: "toggle" },
    ],
  },
  assets: {
    name: "Asset",
    namePlural: "Assets",
    endpoint: "/assets",
    paginated: true,
    refetchKeys: ["assets"],
    columns: [
      { key: "id", label: "ID", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "asset_category", label: "Category", render: (v) => <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700">{v as string}</span> },
      { key: "serial_number", label: "Serial" },
      { key: "location_id", label: "Location", render: (_v, row) => <span className="text-xs text-gray-500">{String(row.location_name || row.location_id || "-")}</span> },
      { key: "qr_code", label: "QR Code", render: (_v, row) => (
        <QRDownloadButton endpoint={`/assets/${row.id}/qr`} filename={`QR-Asset-${row.name}.png`} />
      )},
      { key: "is_active", label: "Status", render: (v) => v ? <span className="text-green-600 text-xs font-medium">Active</span> : <span className="text-red-500 text-xs font-medium">Inactive</span> },
    ],
    formFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "asset_category", label: "Category", type: "select", required: true, options: assetCategoryOptions },
      { key: "serial_number", label: "Serial Number", type: "text" },
      { key: "location_id", label: "Location", type: "select", required: true, options: [] },
      { key: "section_id", label: "Section", type: "select", options: [] },
      { key: "pic_id", label: "PIC", type: "select", options: [] },
      { key: "plant", label: "Plant", type: "text" },
      { key: "size", label: "Size", type: "text" },
      { key: "expired_at", label: "Expired At", type: "date" },
      { key: "qr_code", label: "QR Code", type: "text", placeholder: "Auto-generated if empty" },
      { key: "is_active", label: "Active", type: "toggle" },
    ],
    transformSubmit: (data) => {
      const d = { ...data };
      if (d.expired_at && typeof d.expired_at === "string" && d.expired_at.includes("T")) {
        d.expired_at = (d.expired_at as string).split("T")[0];
      }
      return d;
    },
  },
};

export function isMasterResource(resource: string): boolean {
  return resource in resourceConfigs;
}

export async function fetchReferenceData(resource: string): Promise<Record<string, { label: string; value: number }[]>> {
  const result: Record<string, { label: string; value: number }[]> = {};

  if (resource === "users" || resource === "assets") {
    try {
      const res = await api.get("/sections");
      const sections = Array.isArray(res.data) ? res.data : res.data?.data || [];
      result.sections = sections.map((s: { id: number; name: string }) => ({ label: s.name, value: s.id }));
    } catch { result.sections = []; }
  }

  if (resource === "assets") {
    try {
      const locRes = await api.get("/locations");
      const locs = Array.isArray(locRes.data) ? locRes.data : locRes.data?.data || [];
      result.locations = locs.map((l: { id: number; name: string }) => ({ label: l.name, value: l.id }));
    } catch { result.locations = []; }

    try {
      const userRes = await api.get("/users", { params: { limit: 100 } });
      const users = userRes.data?.data || [];
      result.pic = users.map((u: { id: number; name: string }) => ({ label: u.name, value: u.id }));
    } catch { result.pic = []; }
  }

  return result;
}
