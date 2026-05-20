import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/auth";
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCcw,
  Calendar,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard/tokens")({
  component: TokensPage,
});

function TokensPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("recruitment_tokens")
      .select("*")
      .eq("recruiter_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar tokens");
    } else {
      setTokens(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const generateToken = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Use the database function generate_token
      const { data: tokenStr, error: genError } = await supabase.rpc('generate_token', { length: 6 });
      if (genError) throw genError;

      const { error } = await supabase
        .from("recruitment_tokens")
        .insert({
          recruiter_id: user.id,
          token: tokenStr,
          is_active: true,
          max_usage: null // Unlimited by default
        });

      if (error) throw error;

      toast.success("Token gerado com sucesso!");
      fetchTokens();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar token");
    } finally {
      setGenerating(false);
    }
  };

  const toggleToken = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("recruitment_tokens")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar token");
    } else {
      toast.success(currentStatus ? "Token desativado" : "Token ativado");
      fetchTokens();
    }
  };

  const deleteToken = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este token?")) return;

    const { error } = await supabase
      .from("recruitment_tokens")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir token");
    } else {
      toast.success("Token excluído");
      fetchTokens();
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado para a área de transferência!");
  };

  return (
    <DashboardShell title="Tokens de Recrutamento">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Gerenciar Acessos</h2>
            <p className="text-sm text-muted-foreground">Gere tokens para que novos colaboradores possam criar suas contas.</p>
          </div>
          <button 
            onClick={generateToken}
            disabled={generating}
            className="btn-primary h-12 px-6 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {generating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            Gerar Novo Token
          </button>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : tokens.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-revolut !p-12 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                  <KeyRound size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Nenhum token ativo</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  Você ainda não gerou nenhum token de recrutamento. Gere um token agora para permitir o cadastro de novos colaboradores.
                </p>
                <button 
                  onClick={generateToken}
                  className="btn-secondary px-8 h-12"
                >
                  Gerar meu primeiro token
                </button>
              </motion.div>
            ) : (
              tokens.map((t, i) => (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-revolut !p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                      t.is_active ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-muted-foreground border border-white/5'
                    }`}>
                      {t.token}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Token de Acesso</span>
                        <span className={`badge ${t.is_active ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
                          {t.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Criado em {new Date(t.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><Users size={14} /> {t.usage_count} usos</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => copyToken(t.token)}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                      title="Copiar Token"
                    >
                      <Copy size={20} />
                    </button>
                    <button 
                      onClick={() => toggleToken(t.id, t.is_active)}
                      className={`p-3 rounded-xl transition-all ${
                        t.is_active ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                      title={t.is_active ? "Desativar" : "Ativar"}
                    >
                      {t.is_active ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                    </button>
                    <button 
                      onClick={() => deleteToken(t.id)}
                      className="p-3 rounded-xl bg-white/5 hover:bg-danger/10 text-muted-foreground hover:text-danger transition-all opacity-0 group-hover:opacity-100"
                      title="Excluir"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardShell>
  );
}
