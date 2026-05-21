import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail, Lock, UserPlus, Users, Briefcase, Key, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { auth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Área do Recrutador — TalentFlow" }] }),
  component: Login,
});

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"recruiter" | "colaborador">("recruiter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const nav = useNavigate();
  const { theme, toggle } = useTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        const result = await auth.signIn(email, password);
        if (result.success) {
          nav({ to: "/dashboard" });
        } else {
          setError(result.error ?? "E-mail ou senha incorretos.");
        }
      } else {
        const success = await auth.signUp(email, password, role, token);
        if (success) {
          setError("Conta criada com sucesso! Faça login agora.");
          setMode("login");
        } else {
          setError("Erro ao criar conta. Tente novamente.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-black">
      <div className="p-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-[15px] font-medium text-muted hover:text-foreground transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao início
        </Link>
        <button className="theme-toggle" onClick={toggle} title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}>
          <motion.div key={theme} initial={{ rotate: -30, opacity: 0, scale: 0.7 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </motion.div>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px]"
        >
          <div className="card-revolut !p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <Logo size="lg" />
              <h1 className="text-3xl font-extrabold mt-8 tracking-tight">
                {mode === "login" ? "Entrar no TalentFlow" : "Criar sua conta"}
              </h1>
              <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">
                {mode === "login" 
                  ? "Bem-vindo à sua central de gestão de talentos."
                  : "Comece a gerenciar seus candidatos hoje mesmo."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    key={error}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm font-medium text-danger flex items-start gap-2 bg-danger/10 p-3 rounded-xl"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0 mt-1.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-3 pb-2"
                  >
                    <button
                      type="button"
                      onClick={() => setRole("recruiter")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        role === "recruiter"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      <Briefcase size={20} />
                      <span className="text-xs font-bold uppercase tracking-wider">Recrutador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("colaborador")}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        role === "colaborador"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      <Users size={20} />
                      <span className="text-xs font-bold uppercase tracking-wider">Colaborador</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    placeholder="E-mail"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-white/10 bg-white/[0.03] focus:border-primary/50 focus:bg-white/[0.05] transition-all outline-none"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="password"
                    placeholder="Senha"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-white/10 bg-white/[0.03] focus:border-primary/50 focus:bg-white/[0.05] transition-all outline-none"
                  />
                </div>
                {mode === "signup" && role === "colaborador" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="relative"
                  >
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Token do Recrutador"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      className="w-full h-14 pl-12 pr-4 rounded-xl border border-white/10 bg-white/[0.03] focus:border-primary/50 focus:bg-white/[0.05] transition-all outline-none"
                    />
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-primary text-black font-bold text-lg hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  mode === "login" ? "Entrar" : "Criar conta"
                )}
              </button>

              <div className="flex flex-col items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  {mode === "login" ? (
                    <>
                      <UserPlus size={16} /> Não tem uma conta? Cadastre-se
                    </>
                  ) : (
                    <>Já tem uma conta? Faça login</>
                  )}
                </button>
              </div>

              <p className="text-center text-[10px] text-muted-foreground pt-4 uppercase tracking-widest opacity-50">
                Acesso restrito
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
