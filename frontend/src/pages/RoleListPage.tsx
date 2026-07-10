import { useEffect, useState } from "react";
import api from "@/lib/axios";
import type { RoleInfo, Permission } from "@/types";
import { useThemeStore } from "@/lib/theme";
import { Shield, Plus, X, Check, Loader2 } from "lucide-react";
import { Pagination } from "@/components/Pagination";

export function RoleListPage() {
  const theme = useThemeStore((s) => s.theme);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 12;
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editingRole, setEditingRole] = useState<RoleInfo | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", display_name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [offset]);

  async function loadRoles() {
    setRolesLoading(true);
    try {
      const res = await api.get("/roles", { params: { offset, limit } });
      setRoles(res.data.data || []);
      setTotal(res.data.total ?? 0);
    } catch { }
    finally { setRolesLoading(false); }
  }

  async function loadPermissions() {
    try {
      const res = await api.get("/permissions/modules");
      const data = res.data as Record<string, Permission[]>;
      const all: Permission[] = [];
      for (const key in data) {
        all.push(...data[key]);
      }
      setPermissions(all);
    } catch { }
  }

  async function openEdit(role: RoleInfo) {
    setEditingRole(role);
    setFormData({ name: role.name, display_name: role.display_name, description: role.description });
    try {
      const res = await api.get(`/roles/${role.id}/permissions`);
      setSelectedPerms((res.data as Permission[]).map((p) => p.id));
    } catch {
      setSelectedPerms([]);
    }
    setShowForm(true);
  }

  function openCreate() {
    setEditingRole(null);
    setFormData({ name: "", display_name: "", description: "" });
    setSelectedPerms([]);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, formData);
        await api.put(`/roles/${editingRole.id}/permissions`, { permission_ids: selectedPerms });
      } else {
        const res = await api.post("/roles", formData);
        await api.put(`/roles/${(res.data as RoleInfo).id}/permissions`, { permission_ids: selectedPerms });
      }
      setShowForm(false);
      loadRoles();
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal menyimpan role");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(role: RoleInfo) {
    if (role.is_system) {
      alert("Tidak dapat menghapus role sistem");
      return;
    }
    if (!confirm(`Hapus role "${role.display_name}"?`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      loadRoles();
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal menghapus role");
    }
  }

  function togglePermission(id: number) {
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const groupedPerms = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola peran dan izin akses pengguna</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg transition-all"
          style={{ background: `linear-gradient(135deg, ${theme.colors[500]}, ${theme.colors[600]})` }}
        >
          <Plus className="w-4 h-4" />
          Tambah Role
        </button>
      </div>

      {rolesLoading ? (
        <div className="text-center py-12 text-gray-400">Memuat data role...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ background: `linear-gradient(135deg, ${theme.colors[500]}, ${theme.colors[400]})` }}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.display_name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{role.name}</p>
                    </div>
                  </div>
                  {role.is_system && (
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">SYSTEM</span>
                  )}
                </div>
                {role.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{role.description}</p>
                )}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <button onClick={() => openEdit(role)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                    Edit
                  </button>
                  {!role.is_system && (
                    <button onClick={() => handleDelete(role)}
                      className="text-xs font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {total > limit && (
            <Pagination offset={offset} limit={limit} total={total} onPage={(o) => setOffset(o)} />
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingRole ? "Edit Role" : "Tambah Role"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Role</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-gray-300 outline-none transition-all"
                    placeholder="contoh: SUPERVISOR"
                    required
                    disabled={editingRole?.is_system}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-gray-300 outline-none transition-all"
                    placeholder="contoh: Supervisor"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:border-gray-300 outline-none transition-all resize-none"
                  rows={2}
                  placeholder="Deskripsi role..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Izin Akses (Permissions)</label>
                <div className="space-y-4">
                  {Object.entries(groupedPerms).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {module.replace(/-/g, " ")}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                              selectedPerms.includes(perm.id)
                                ? "border-indigo-200 bg-indigo-50"
                                : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{perm.display_name}</p>
                              <p className="text-xs text-gray-400">{perm.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50 order-2 sm:order-1"
                  style={{ background: `linear-gradient(135deg, ${theme.colors[500]}, ${theme.colors[600]})` }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-gray-600 font-medium text-sm bg-gray-100 hover:bg-gray-200 transition-all order-1 sm:order-2"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
