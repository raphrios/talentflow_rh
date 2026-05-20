import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { ArrowLeft, KeyRound, Loader2, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/token")({
  head: () => ({ meta: [{ title: "Acesse seu Teste — TalentFlow" }] }),
  component: TokenPage,
});

function TokenPage() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const full = digits.join("");
  const ready = full.length === 6;

  function onChange(i: number, v: string) {
    setError(null);
    const clean = v.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => {
        const n = [...d];
        n[i] = "";
        return n;
      });
      return;
    }

    if (clean.length > 1) {
      const paste = clean.slice(0, 6 - i);
      setDigits((d) => {
        const n = [...d];
        paste.split("").forEach((c, k) => {
          if (i + k < 6) n[i + k] = c;
        });
        return n;
      });
      const nextIdx = Math.min(i + paste.length, 5);
      setTimeout(() => {
        refs.current[nextIdx]?.focus();
        if (i + paste.length >= 6) {
          const fullToken = [...digits];
          paste.split("").forEach((c, k) => {
            if (i + k < 6) fullToken[i + k] = c;
          });
          if (fullToken.join("").length === 6) submit(undefined, fullToken.join(""));
        }
      }, 0);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[i] = clean;
    setDigits(nextDigits);

    if (i < 5) {
      setTimeout(() => refs.current[i + 1]?.focus(), 0);
    } else if (nextDigits.join("").length === 6) {
      submit(undefined, nextDigits.join(""));
    }
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }

  async function submit(e?: React.FormEvent, tokenOverride?: string) {
    e?.preventDefault();
    const tokenToValidate = tokenOverride || full;
    if (tokenToValidate.length !== 6) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("id, status")
        .eq("token", tokenToValidate)
        .single();

      if (data) {
        if (data.status === "Concluído") {
          setError("Este teste já foi concluído.");
        } else {
          navigate({ to: "/assessment/$token", params: { token: tokenToValidate } });
        }
      } else {
        setError("Token inválido ou expirado");
        setDigits(Array(6).fill(""));
        refs.current[0]?.focus();
      }
    } catch (err) {
      setError("Erro ao validar token. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-black">
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-[15px] font-medium text-muted hover:text-foreground transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao início
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {pageLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-[480px] card-revolut !p-12"
            >
              <div className="flex flex-col items-center gap-4 mb-10">
                <Skeleton className="h-12 w-32 rounded-full" />
                <Skeleton className="h-16 w-16 rounded-[24px]" />
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-md" />
              </div>
              <div className="flex gap-3 justify-center mb-8">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="w-12 h-16 sm:w-14 sm:h-20 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-14 w-full rounded-full" />
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
              className="w-full max-w-[480px]"
            >
              <div className="card-revolut !p-12 shadow-2xl relative overflow-hidden group border-white/5 bg-surface/50 backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl opacity-50" />
                
                <div className="flex flex-col items-center text-center mb-10">
                  <Logo size="lg" />
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mt-8 w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_rgba(0,212,170,0.1)]"
                  >
                    <KeyRound size={28} />
                  </motion.div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Código de Acesso</h1>
                  <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-[280px]">
                    Insira o token de 6 dígitos que você recebeu da empresa.
                  </p>
                </div>

                <form onSubmit={submit}>
                  <div className="flex gap-2 sm:gap-3 justify-center mb-8">
                    {digits.map((d, i) => (
                      <motion.input
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        ref={(el) => { refs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="\d*"
                        value={d}
                        onChange={(e) => onChange(i, e.target.value)}
                        onKeyDown={(e) => onKeyDown(i, e)}
                        onFocus={(e) => e.currentTarget.select()}
                        className={`
                          w-12 h-16 sm:w-14 sm:h-20 text-center text-3xl font-extrabold rounded-2xl
                          bg-white/5 border transition-all duration-300
                          ${error ? "border-danger text-danger bg-danger/5" : "border-white/5 focus:border-primary focus:bg-primary/5 focus:scale-105"}
                        `}
                        aria-label={`Dígito ${i + 1}`}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center text-sm font-bold text-danger mb-6 flex items-center justify-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                      {error}
                    </motion.div>
                  )}

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={!ready || loading} 
                    className="btn-primary w-full h-14 !text-[16px] shadow-lg shadow-primary/20 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={20} className="animate-spin" /> : (
                        <>Validar e Iniciar <Sparkles size={18} /></>
                      )}
                    </span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"
                      initial={false}
                    />
                  </motion.button>
                </form>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Candidato Teste (Demo)</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["482910", "551239", "664428"].map((t, idx) => (
                      <motion.button 
                        key={t}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                        onClick={() => {
                          setDigits(t.split(""));
                          setTimeout(() => submit(undefined, t), 100);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-mono text-muted hover:text-foreground transition-all"
                      >
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
