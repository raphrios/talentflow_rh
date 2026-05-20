import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-talent-flow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, UserPlus, Shield, Loader2, Trash2, Key, RefreshCw, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Listar tokens do recrutador
  const { data: tokens, refetch: refetchTokens } = useQuery({
    queryKey: ["recruitment-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruitment_tokens")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateNewToken = async () => {
    setIsGenerating(true);
    try {
      if (!profile?.id) throw new Error("Usuário não identificado");
      // Usar a função RPC do banco que criamos
      const { data: token, error: genError } = await supabase.rpc('generate_token', { length: 6 });
      if (genError) throw genError;

      const { error } = await supabase
        .from("recruitment_tokens")
        .insert({
          recruiter_id: profile?.id,
          token: token,
          is_active: true
        });

      if (error) throw error;
      toast.success("Novo token gerado!");
      refetchTokens();
    } catch (error: any) {
      toast.error("Erro ao gerar token: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Token copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTokenStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("recruitment_tokens")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      toast.success(currentStatus ? "Token desativado" : "Token ativado");
      refetchTokens();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  // Listar todos os recrutadores (somente admin vê todos)
  const { data: recruiters, isLoading: loadingRecruiters } = useQuery({
    queryKey: ["recruiters"],
    queryFn: async () => {
      // Como a tabela profiles não tem email, vamos assumir que apenas admins 
      // podem listar outros perfis e que o sistema vai lidar com a exibição
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === "admin",
  });

  const createRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsCreating(true);
    try {
      // Nota: Em um ambiente real, você usaria uma Edge Function ou Admin Auth API
      // Aqui vamos simular o convite ou criação
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            role: "recruiter",
          }
        }
      });

      if (error) throw error;
      
      toast.success("Recrutador criado com sucesso!");
      setNewEmail("");
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: ["recruiters"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar recrutador");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRecruiter = async (id: string) => {
    if (id === profile?.id) {
      toast.error("Você não pode excluir seu próprio perfil");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Perfil removido");
      queryClient.invalidateQueries({ queryKey: ["recruiters"] });
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell title="Configurações">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Configurações">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              Meu Perfil 
              {profile?.role === "admin" && (
                <span className="badge-premium text-[10px] py-0 px-2 uppercase tracking-wider">Admin Master</span>
              )}
            </h2>
            <p className="text-sm text-muted mb-5">Suas informações básicas de conta.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-1 block">E-mail</label>
                <div className="p-3 bg-secondary/30 rounded-lg text-sm border border-border/50">
                  {profile?.email || "igorrafaeljunior@gmail.com"}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Nível de Acesso</label>
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${profile?.role === "admin" ? "text-primary" : "text-muted"}`} />
                  <span className="text-sm capitalize font-medium">{profile?.role || "Recrutador"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-1">Segurança</h2>
            <p className="text-sm text-muted mb-5">Atualize sua senha de acesso.</p>
            <button 
              className="btn-secondary w-full" 
              onClick={() => toast.info("Funcionalidade de troca de senha em desenvolvimento")}
            >
              Alterar Senha
            </button>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Tokens de Convite
            </h2>
            <p className="text-sm text-muted mb-5">Gere tokens para que colaboradores possam criar contas vinculadas a você.</p>
            
            <div className="space-y-4">
              <button 
                onClick={generateNewToken}
                disabled={isGenerating}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Gerar Novo Token
              </button>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {tokens?.length === 0 ? (
                  <p className="text-center text-xs text-muted py-4">Nenhum token gerado ainda.</p>
                ) : (
                  tokens?.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <code className="text-lg font-black tracking-widest text-primary">{t.token}</code>
                        <div className={`w-2 h-2 rounded-full ${t.is_active ? 'bg-primary' : 'bg-muted'}`} title={t.is_active ? 'Ativo' : 'Inativo'} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => copyToClipboard(t.token)}
                          className="p-2 text-muted hover:text-foreground transition-colors"
                          title="Copiar token"
                        >
                          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => toggleTokenStatus(t.id, t.is_active)}
                          className={`p-2 transition-colors ${t.is_active ? 'text-muted hover:text-danger' : 'text-muted hover:text-primary'}`}
                          title={t.is_active ? 'Desativar' : 'Ativar'}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {profile?.role === "admin" && (
          <div className="space-y-6">
            <div className="card p-6 border-primary/20 bg-primary/[0.02]">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Adicionar Recrutador
              </h2>
              <p className="text-sm text-muted mb-5">Crie novos acessos para sua equipe.</p>
              
              <form onSubmit={createRecruiter} className="space-y-4">
                <div className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="E-mail do recrutador" 
                    className="input w-full"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                  <input 
                    type="password" 
                    placeholder="Senha temporária" 
                    className="input w-full"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  disabled={isCreating}
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Criar Conta de Recrutador
                </button>
              </form>
            </div>

            <div className="card overflow-hidden">
              <div className="p-6 border-b border-border/50">
                <h2 className="text-lg font-semibold mb-1">Equipe de Recrutadores</h2>
                <p className="text-sm text-muted">Gerencie quem tem acesso ao sistema.</p>
              </div>
              <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
                {loadingRecruiters ? (
                  <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted" /></div>
                ) : recruiters?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted">Nenhum outro recrutador cadastrado.</div>
                ) : (
                  recruiters?.map((r: any) => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(r.email || "R").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                          {r.full_name || "Recrutador"}
                          {r.role === "admin" && <Shield className="w-3 h-3 text-primary" />}
                          </div>
                          <div className="text-[10px] text-muted capitalize">{r.role}</div>
                        </div>
                      </div>
                      {r.id !== profile?.id && (
                        <button 
                          onClick={() => deleteRecruiter(r.id)}
                          className="p-2 text-muted hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
