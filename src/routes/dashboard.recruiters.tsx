import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/auth";
import { Plus, Search, UserCog, Mail, Shield, Loader2, Trash2, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
// Chama a API route /api/admin (mais confiável que createServerFn nesta versão)
async function adminAPI(action: string, payload: object) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ success: boolean; error?: string; [k: string]: any }>;
}

export const Route = createFileRoute("/dashboard/recruiters")({
  beforeLoad: async () => {
    const profile = await auth.getProfile();
    if (!profile?.is_master) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RecruitersPage,
});

function RecruitersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "recruiter" as "admin" | "recruiter" });
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "recruiter" as "admin" | "recruiter" });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar usuários");
    else setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({ full_name: user.full_name || "", role: user.role || "recruiter" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await adminAPI("create_recruiter", {
        email: form.email, password: form.password,
        full_name: form.full_name, role: form.role,
      });
      if (!result.success) {
        toast.error(result.error || "Erro ao criar usuário");
      } else {
        toast.success("Recrutador criado com sucesso!");
        setShowCreate(false);
        setForm({ email: "", password: "", full_name: "", role: "recruiter" });
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro inesperado");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const result = await adminAPI("update_recruiter", {
        user_id: editUser.id, full_name: editForm.full_name, role: editForm.role,
      });
      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar usuário");
      } else {
        toast.success("Usuário atualizado com sucesso!");
        setEditUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro inesperado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) return;
    setDeletingId(userId);
    try {
      const result = await adminAPI("delete_recruiter", { user_id: userId });
      if (!result.success) {
        toast.error(result.error || "Erro ao excluir usuário");
      } else {
        toast.success("Usuário excluído com sucesso");
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir usuário");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell title="Gestão de Recrutadores">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              className="input h-12 !bg-surface !border-white/5"
              style={{ paddingLeft: "3rem" }}
              placeholder="Buscar por nome, e-mail ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary h-12 px-6 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus size={20} /> Novo Recrutador
          </button>
        </div>

        {/* Table */}
        <div className="card-revolut overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Usuário</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cargo</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-8 h-20 bg-white/[0.01]" />
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground text-sm opacity-50">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center font-bold text-xs text-primary flex-shrink-0">
                          {user.full_name?.substring(0, 2).toUpperCase() || "US"}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold">{user.full_name || "Sem Nome"}</div>
                          <div className="text-[12px] text-muted-foreground font-mono opacity-60">{user.email || user.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {user.role === 'admin' ? <Shield size={14} /> : <UserCog size={14} />}
                        {user.role === 'admin' ? 'Admin' : 'Recrutador'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[14px] font-medium">Ativo</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-primary transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-danger transition-colors disabled:opacity-40"
                          title="Excluir Usuário"
                        >
                          {deletingId === user.id
                            ? <Loader2 size={18} className="animate-spin" />
                            : <Trash2 size={18} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Create Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <Modal onClose={() => setShowCreate(false)}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Novo Recrutador</h2>
                <p className="text-muted-foreground text-sm mt-1">Cadastre um novo membro na equipe.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <FieldLabel label="Nome Completo">
                <input required className="input h-14 !bg-surface !border-white/5" placeholder="ex: João Silva"
                  value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </FieldLabel>

              <FieldLabel label="E-mail">
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input required type="email" className="input h-14 !bg-surface !border-white/5"
                    style={{ paddingLeft: "3rem" }} placeholder="email@exemplo.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </FieldLabel>

              <FieldLabel label="Senha Provisória">
                <input required type="password" className="input h-14 !bg-surface !border-white/5" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </FieldLabel>

              <FieldLabel label="Nível de Acesso">
                <div className="grid grid-cols-2 gap-3">
                  {(["recruiter", "admin"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                      className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                        form.role === r ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/10'
                      }`}>
                      {r === 'admin' ? <Shield size={18} /> : <UserCog size={18} />}
                      {r === 'admin' ? 'Administrador' : 'Recrutador'}
                    </button>
                  ))}
                </div>
              </FieldLabel>

              <button disabled={creating} className="btn-primary w-full h-14 !text-[16px] shadow-lg shadow-primary/20 mt-2">
                {creating ? <Loader2 className="animate-spin mx-auto" /> : "Criar Usuário"}
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {editUser && (
          <Modal onClose={() => setEditUser(null)}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Editar Recrutador</h2>
                <p className="text-muted-foreground text-sm mt-1">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <FieldLabel label="Nome Completo">
                <input required className="input h-14 !bg-surface !border-white/5" placeholder="Nome completo"
                  value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
              </FieldLabel>

              <FieldLabel label="Nível de Acesso">
                <div className="grid grid-cols-2 gap-3">
                  {(["recruiter", "admin"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setEditForm({ ...editForm, role: r })}
                      className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                        editForm.role === r ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/10'
                      }`}>
                      {r === 'admin' ? <Shield size={18} /> : <UserCog size={18} />}
                      {r === 'admin' ? 'Administrador' : 'Recrutador'}
                    </button>
                  ))}
                </div>
              </FieldLabel>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setEditUser(null)} className="btn-ghost flex-1 h-14">
                  Cancelar
                </button>
                <button disabled={saving || !editForm.full_name.trim()} className="btn-primary flex-1 h-14 !text-[16px] shadow-lg shadow-primary/20">
                  {saving ? <Loader2 className="animate-spin mx-auto" /> : <><Check size={18} /> Salvar</>}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg card-revolut !p-8 shadow-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">{label}</label>
      {children}
    </div>
  );
}
