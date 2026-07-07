import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { FormField } from "@/lib/masterData";
import { useThemeStore } from "@/lib/theme";

interface FormModalProps {
  title: string;
  fields: FormField[];
  initialData: Record<string, unknown> | null;
  referenceData?: Record<string, { label: string; value: number }[]>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

export function FormModal({ title, fields, initialData, referenceData, onSubmit, onClose }: FormModalProps) {
  const theme = useThemeStore((s) => s.theme);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData });
    } else {
      const empty: Record<string, unknown> = {};
      fields.forEach((f) => {
        if (f.type === "toggle") empty[f.key] = false;
        else if (f.key === "sort_order") empty[f.key] = 0;
        else empty[f.key] = "";
      });
      setForm(empty);
    }
  }, [initialData, fields]);

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    for (const f of fields) {
      if (f.hidden) continue;
      if (f.required && (form[f.key] === "" || form[f.key] == null)) {
        setError(`${f.label} is required`);
        return;
      }
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const resolveOptions = (field: FormField): { label: string; value: string | number | boolean | null }[] => {
    if (field.options && field.options.length > 0) return field.options;
    if (field.key === "section_id" && referenceData?.sections) return referenceData.sections;
    if (field.key === "location_id" && referenceData?.locations) return referenceData.locations;
    if (field.key === "pic_id" && referenceData?.pic) return referenceData.pic;
    return [];
  };

  const inputStyle = {
    "--tw-ring-color": `${theme.colors[500]}40`,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100 animate-in fade-in">
              {error}
            </div>
          )}

          {fields.filter((f) => !f.hidden).map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.type === "select" ? (
                <select
                  value={String(form[field.key] ?? "")}
                  onChange={(e) => update(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:ring-2"
                  style={inputStyle}
                  required={field.required}
                >
                  <option value="">-- Select --</option>
                  {resolveOptions(field).map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === "toggle" ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form[field.key])}
                    onChange={(e) => update(field.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                    style={{ backgroundColor: form[field.key] ? theme.colors[500] : undefined }}
                  />
                </label>
              ) : field.type === "textarea" ? (
                <textarea
                  value={String(form[field.key] ?? "")}
                  onChange={(e) => update(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:ring-2 resize-none"
                  style={inputStyle}
                  rows={3}
                />
              ) : (
                <input
                  type={field.type}
                  value={String(form[field.key] ?? "")}
                  onChange={(e) => update(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none transition-all focus:ring-2"
                  style={inputStyle}
                  placeholder={field.placeholder}
                  required={field.required && field.type !== "password"}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-all hover:opacity-90"
              style={{ backgroundColor: theme.colors[600] }}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
