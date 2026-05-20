import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/auth";
import { Plus, Search, UserCog, Mail, Shield, Loader2, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { createRecruiterFn, deleteRecruiterFn } from "@/lib/admin-fns";

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
  const [showModal, setShowModal] = useState(false);
  
  // New user form state
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "recruiter" as "admin" | "recruiter"
  });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar usuários");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createRecruiterFn({
        data: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        },
      });
      if (!result.success) {
        toast.error(result.error || "Erro ao criar usuário");
      } else {
        toast.success("Recrutador criado com sucesso!");
        setShowModal(false);
        setForm({ email: "", password: "", full_name: "", role: "recruiter" });
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro inesperado");
    } finally {
      setCreating(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'recruiter' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast.error("Erro ao atualizar permissão");
    } else {
      toast.success("Permissão atualizada");
      fetchUsers();
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) return;
    try {
      const result = await deleteRecruiterFn({ data: { user_id: userId } });
      if (!result.success) {
        toast.error(result.error || "Erro ao excluir usuário");
      } else {
        toast.success("Usuário excluído com sucesso");
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir usuário");
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              className="input h-12 !bg-surface !border-white/5"
              style={{ paddingLeft: "3rem" }}
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary h-12 px-6 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus size={20} /> Novo Recrutador
          </button>
        </div>

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
                ) : filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center font-bold text-xs text-primary">
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
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[14px] font-medium">Ativo</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleRole(user.id, user.role)}
                          className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-primary transition-colors"
                          title="Alternar Cargo"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-danger transition-colors"
                          title="Excluir Usuário"
                        >
                          <Trash2 size={18} />
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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg card-revolut !p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Novo Recrutador</h2>
                  <p className="text-muted-foreground text-sm mt-1">Cadastre um novo membro na equipe.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Nome Completo</label>
                  <input 
                    required
                    className="input h-14 !bg-surface !border-white/5" 
                    placeholder="ex: João Silva" 
                    value={form.full_name}
                    onChange={e => setForm({...form, full_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">E-mail</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input 
                      required
                      type="email"
                      className="input !pl-12 h-14 !bg-surface !border-white/5" 
                      placeholder="email@exemplo.com" 
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Senha Provisória</label>
                  <input 
                    required
                    type="password"
                    className="input h-14 !bg-surface !border-white/5" 
                    placeholder="••••••••" 
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Nível de Acesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setForm({...form, role: 'recruiter'})}
                      className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                        form.role === 'recruiter' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/10'
                      }`}
                    >
                      <UserCog size={18} /> Recrutador
                    </button>
                    <button 
                      type="button"
                      onClick={() => setForm({...form, role: 'admin'})}
                      className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                        form.role === 'admin' ? 'border-primary bg-primary/5 text-primary' : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/10'
                      }`}
                    >
                      <Shield size={18} /> Administrador
                    </button>
                  </div>
                </div>

                <button 
                  disabled={creating}
                  className="btn-primary w-full h-14 !text-[16px] shadow-lg shadow-primary/20 mt-4"
                >
                  {creating ? <Loader2 className="animate-spin mx-auto" /> : "Criar Usuário"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
