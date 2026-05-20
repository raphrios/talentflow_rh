import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Download, Award, Zap, Heart, Brain,
  TrendingUp, Loader2, FileText, Monitor, ShieldAlert, AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { discQuestions, bigFiveQuestions, itQuestions, getITDifficulty } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/assessment/$token")({
  head: () => ({ meta: [{ title: "Avaliação — TalentFlow" }] }),
  component: Assessment,
});

type Step = 1 | 1.5 | 2 | 2.5 | 3 | 4;

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Básico",
  medium: "Intermediário",
  advanced: "Avançado",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  advanced: "text-red-400 bg-red-400/10 border-red-400/30",
};

function Assessment() {
  const { token } = Route.useParams();
  const [step, setStep] = useState<Step>(1);
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal
  const [personal, setPersonal] = useState({ name: "", email: "", phone: "" });

  // Documents
  const [documents, setDocuments] = useState<{ name: string; file: File | null }[]>([
    { name: "RG / CNH", file: null },
    { name: "Comprovante de Residência", file: null },
    { name: "Currículo (Opcional)", file: null },
  ]);

  // DISC
  const [discIdx, setDiscIdx] = useState(0);
  const [discAnswers, setDiscAnswers] = useState<string[]>(Array(discQuestions.length).fill(""));

  // IT Test
  const [itIdx, setItIdx] = useState(0);
  const [itAnswers, setItAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const [itScore, setItScore] = useState(0);
  const [itDifficulty, setItDifficulty] = useState<"easy" | "medium" | "advanced">("easy");
  const [cheated, setCheated] = useState(false);
  const [cheatingCountdown, setCheatingCountdown] = useState(5);
  const cheatingRef = useRef(false);

  // Big Five
  const [bfAnswers, setBfAnswers] = useState<number[]>(Array(bigFiveQuestions.length).fill(0));
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCandidate() {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data || data.status === "Concluído") {
        window.location.href = "/token";
        return;
      }

      setCandidate(data);
      setPersonal({ name: data.name, email: data.email, phone: data.phone || "" });
      setItDifficulty(getITDifficulty(data.position || ""));
      setLoading(false);
    }
    fetchCandidate();
  }, [token]);

  // ── Anti-cheat: only active on IT test (step 2.5) ─────────────────────────
  useEffect(() => {
    if (step !== 2.5) return;

    const triggerCheat = () => {
      if (cheatingRef.current) return;
      cheatingRef.current = true;
      setItAnswers(Array(10).fill(null));
      setItIdx(0);
      setItScore(0);
      setCheated(true);
      setCheatingCountdown(5);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") triggerCheat();
    };
    const onBlur = () => triggerCheat();
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [step]);

  // Countdown after cheat detected
  useEffect(() => {
    if (!cheated) return;
    if (cheatingCountdown <= 0) {
      setCheated(false);
      cheatingRef.current = false;
      // Auto-advance to Big Five with score 0
      setStep(3);
      return;
    }
    const t = setTimeout(() => setCheatingCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cheated, cheatingCountdown]);

  const itQList = itQuestions[itDifficulty];

  const progress = useMemo(() => {
    if (step === 1) return 5;
    if (step === 1.5) return 12;
    if (step === 2) return 15 + ((discIdx + 1) / discQuestions.length) * 25;
    if (step === 2.5) return 40 + ((itIdx + 1) / itQList.length) * 20;
    if (step === 3) return 60 + (bfAnswers.filter((v) => v > 0).length / bigFiveQuestions.length) * 35;
    return 100;
  }, [step, discIdx, bfAnswers, itIdx, itQList.length]);

  const stepLabel = () => {
    if (step === 1) return "Etapa 1 de 5 — Dados Pessoais";
    if (step === 1.5) return "Etapa 2 de 5 — Documentação";
    if (step === 2) return "Etapa 3 de 5 — Perfil DISC";
    if (step === 2.5) return "Etapa 4 de 5 — Teste de Informática";
    if (step === 3) return "Etapa 5 de 5 — Personalidade Big Five";
    return "Concluído";
  };

  async function handleFinish() {
    setSaving(true);
    try {
      const discCount: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
      discAnswers.forEach((v) => { if (v in discCount) discCount[v]++; });
      const totalDisc = Object.values(discCount).reduce((a, b) => a + b, 0) || 1;
      const discScores = {
        D: Math.round((discCount.D / totalDisc) * 100),
        I: Math.round((discCount.I / totalDisc) * 100),
        S: Math.round((discCount.S / totalDisc) * 100),
        C: Math.round((discCount.C / totalDisc) * 100),
      };

      const bfMap: Record<string, number[]> = {
        openness: [], conscientiousness: [], extraversion: [],
        agreeableness: [], neuroticism: [],
      };
      bigFiveQuestions.forEach((q, i) => {
        const val = bfAnswers[i] ?? 0;
        bfMap[q.trait]?.push(val * 20);
      });
      const bigFiveScores = Object.fromEntries(
        Object.entries(bfMap).map(([k, v]) => [k, v.length ? Math.round(v.reduce((a, b) => a + b) / v.length) : 0])
      );

      const dominant = (Object.entries(discScores) as [string, number][])
        .sort((a, b) => b[1] - a[1])[0][0];

      const finalItScore = itAnswers.filter((a, i) => a === itQList[i]?.correct).length;
      const compatibility = Math.round(
        (finalItScore / itQList.length) * 40 +
        (bigFiveScores.conscientiousness ?? 0) * 0.3 +
        (bigFiveScores.openness ?? 0) * 0.1 +
        30
      );

      await supabase.from("assessments").insert({
        candidate_id: candidate.id,
        disc_scores: discScores,
        big_five_scores: bigFiveScores,
        dominant_trait: dominant,
        compatibility_score: Math.min(compatibility, 100),
      });

      for (const doc of documents) {
        if (doc.file) {
          const ext = doc.file.name.split(".").pop();
          const path = `${candidate.id}/${doc.name}.${ext}`;
          const { data: up } = await supabase.storage.from("candidate-docs").upload(path, doc.file, { upsert: true });
          if (up) {
            const { data: { publicUrl } } = supabase.storage.from("candidate-docs").getPublicUrl(path);
            await supabase.from("documents").insert({
              candidate_id: candidate.id, name: doc.name, url: publicUrl,
              type: doc.file.type, status: "Aguardando",
            });
          }
        }
      }

      await supabase.from("candidates").update({ status: "Concluído" }).eq("id", candidate.id);

      setItScore(finalItScore);
      setCompletedAt(new Date().toLocaleString("pt-BR"));
      setStep(4);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Anti-cheat overlay */}
      <AnimatePresence>
        {cheated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-lg p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="card-revolut w-full max-w-md !p-10 text-center border-danger/30 bg-danger/5"
            >
              <div className="w-20 h-20 rounded-[24px] bg-danger/20 flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={40} className="text-danger" />
              </div>
              <h2 className="text-2xl font-black text-danger mb-3">Teste Encerrado</h2>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                Detectamos que você saiu da página durante o Teste de Informática.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Sua pontuação neste teste foi <strong className="text-danger">zerada</strong>. O teste prosseguirá automaticamente.
              </p>
              <div className="w-16 h-16 rounded-full border-4 border-danger/30 border-t-danger flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-black text-danger">{cheatingCountdown}</span>
              </div>
              <p className="text-xs text-muted-foreground">Redirecionando em {cheatingCountdown}s…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="text-xs text-muted font-medium">{stepLabel()}</div>
        </div>
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-1 bg-gradient-to-r from-[#00d4aa] to-[#60a5fa]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">

          {/* Step 1 — Personal */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <SectionHeader title="Dados Pessoais" subtitle="Para identificarmos suas respostas." />
              <div className="card p-6 space-y-4">
                <Field label="Nome completo">
                  <input className="input" value={personal.name} onChange={(e) => setPersonal({ ...personal, name: e.target.value })} placeholder="Seu nome completo" />
                </Field>
                <Field label="E-mail">
                  <input type="email" className="input" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} placeholder="voce@email.com" />
                </Field>
                <Field label="Telefone">
                  <input className="input" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} placeholder="(11) 99999-9999" />
                </Field>
                <div className="flex justify-end pt-2">
                  <button className="btn-primary inline-flex items-center gap-2" disabled={!personal.name || !personal.email || !personal.phone} onClick={() => setStep(1.5)}>
                    Continuar <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1.5 — Documents */}
          {step === 1.5 && (
            <motion.div key="s1.5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <SectionHeader title="Documentação" subtitle="Faça o upload dos documentos necessários para o processo." />
              <div className="card p-6 space-y-4">
                {documents.map((doc, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.file ? "bg-primary/20 text-primary" : "bg-white/5 text-muted"}`}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted">{doc.file ? doc.file.name : "Nenhum arquivo selecionado"}</p>
                      </div>
                    </div>
                    <label className="btn-ghost !py-2 !px-4 text-xs cursor-pointer">
                      <input type="file" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        const newDocs = [...documents]; newDocs[i] = { ...newDocs[i], file }; setDocuments(newDocs);
                      }} />
                      {doc.file ? "Alterar" : "Upload"}
                    </label>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <button className="btn-ghost inline-flex items-center gap-2" onClick={() => setStep(1)}><ArrowLeft size={16} /> Voltar</button>
                  <button className="btn-primary inline-flex items-center gap-2" onClick={() => setStep(2)}>Continuar <ArrowRight size={16} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — DISC */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <SectionHeader title="Teste Comportamental DISC" subtitle={`Questão ${discIdx + 1} de ${discQuestions.length}`} />
              <div className="card p-7">
                <AnimatePresence mode="wait">
                  <motion.div key={discIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <p className="text-lg font-medium mb-5">{discQuestions[discIdx].q}</p>
                    <div className="grid gap-3">
                      {discQuestions[discIdx].options.map((o, i) => {
                        const sel = discAnswers[discIdx] === o.value;
                        return (
                          <button key={i} onClick={() => { const n = [...discAnswers]; n[discIdx] = o.value; setDiscAnswers(n); }}
                            className={`text-left p-4 rounded-xl border transition ${sel ? "border-primary bg-primary/10" : "border-white/8 bg-white/[0.02] hover:bg-white/5"}`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-5 h-5 rounded-full border-2 grid place-items-center flex-shrink-0 ${sel ? "border-primary bg-primary" : "border-white/20"}`}>
                                {sel && <Check size={12} className="text-black" strokeWidth={3} />}
                              </span>
                              <span>{o.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="flex justify-between mt-6">
                  <button className="btn-ghost inline-flex items-center gap-2" onClick={() => { if (discIdx === 0) setStep(1.5); else setDiscIdx(discIdx - 1); }}>
                    <ArrowLeft size={16} /> Voltar
                  </button>
                  <button className="btn-primary inline-flex items-center gap-2" disabled={!discAnswers[discIdx]} onClick={() => {
                    if (discIdx < discQuestions.length - 1) setDiscIdx(discIdx + 1);
                    else { setItIdx(0); setStep(2.5); }
                  }}>
                    {discIdx === discQuestions.length - 1 ? "Próxima etapa" : "Próxima"} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2.5 — IT Test */}
          {step === 2.5 && !cheated && (
            <motion.div key="s2.5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Monitor size={22} className="text-primary" />
                    <h1 className="text-2xl font-bold">Teste de Informática</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">Questão {itIdx + 1} de {itQList.length}</p>
                </div>
                <div className={`badge border px-3 py-1.5 text-xs font-bold ${DIFFICULTY_COLOR[itDifficulty]}`}>
                  {DIFFICULTY_LABEL[itDifficulty]}
                </div>
              </div>

              {/* Anti-cheat warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 mb-5">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  <strong>Atenção:</strong> Não saia desta página durante o teste. Trocar de aba, minimizar a janela ou acessar outro aplicativo encerrará o teste automaticamente com pontuação zerada.
                </p>
              </div>

              <div className="card p-7">
                {/* Progress bar within IT test */}
                <div className="flex gap-1 mb-6">
                  {itQList.map((_, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${
                      i < itIdx ? "bg-primary" : i === itIdx ? "bg-primary/60" : "bg-white/10"
                    }`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={itIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <p className="text-lg font-medium mb-6">{itQList[itIdx].q}</p>
                    <div className="grid gap-3">
                      {itQList[itIdx].options.map((opt, oi) => {
                        const sel = itAnswers[itIdx] === oi;
                        const letters = ["A", "B", "C", "D"];
                        return (
                          <button key={oi} onClick={() => {
                            const n = [...itAnswers]; n[itIdx] = oi; setItAnswers(n);
                          }}
                            className={`text-left p-4 rounded-xl border transition-all ${
                              sel
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-white/8 bg-white/[0.02] hover:bg-white/5 text-foreground"
                            }`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors ${
                                sel ? "bg-primary text-black" : "bg-white/5 text-muted-foreground"
                              }`}>
                                {letters[oi]}
                              </span>
                              <span className="text-sm">{opt}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-8">
                  <button className="btn-ghost inline-flex items-center gap-2" onClick={() => {
                    if (itIdx === 0) setStep(2);
                    else setItIdx(itIdx - 1);
                  }}>
                    <ArrowLeft size={16} /> Voltar
                  </button>
                  <button
                    className="btn-primary inline-flex items-center gap-2"
                    disabled={itAnswers[itIdx] === null}
                    onClick={() => {
                      if (itIdx < itQList.length - 1) setItIdx(itIdx + 1);
                      else setStep(3);
                    }}
                  >
                    {itIdx === itQList.length - 1 ? "Próxima etapa" : "Próxima"} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Big Five */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <SectionHeader title="Teste de Personalidade — Big Five" subtitle="Indique seu nível de concordância em cada afirmação." />
              <div className="card p-6 space-y-6">
                {bigFiveQuestions.map((q, qi) => (
                  <div key={q.id} className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
                    <p className="font-medium mb-3">{qi + 1}. {q.q}</p>
                    <div className="flex justify-between text-[11px] text-muted mb-2">
                      <span>Discordo totalmente</span><span>Concordo totalmente</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((v) => {
                        const sel = bfAnswers[qi] === v;
                        return (
                          <button key={v} onClick={() => { const n = [...bfAnswers]; n[qi] = v; setBfAnswers(n); }}
                            className={`flex-1 h-11 rounded-lg border font-semibold transition ${sel ? "border-primary bg-primary/15 text-primary" : "border-white/8 bg-white/[0.02] hover:bg-white/5 text-muted"}`}>
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <button className="btn-ghost inline-flex items-center gap-2" onClick={() => setStep(2.5)}>
                    <ArrowLeft size={16} /> Voltar
                  </button>
                  <button className="btn-primary inline-flex items-center gap-2"
                    disabled={bfAnswers.some((v) => v === 0) || saving}
                    onClick={handleFinish}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar"} <Check size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <Finish
              name={personal.name}
              completedAt={completedAt ?? ""}
              itScore={itScore}
              itTotal={itQList.length}
              itDifficulty={itDifficulty}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted">{subtitle}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Finish({ name, completedAt, itScore, itTotal, itDifficulty }: {
  name: string; completedAt: string; itScore: number; itTotal: number; itDifficulty: string;
}) {
  const firstName = name.split(" ")[0];
  const itPct = Math.round((itScore / itTotal) * 100);
  const itPassed = itPct >= 60;

  const bentoItems = [
    {
      title: "Dominância (D)",
      value: "Alto",
      desc: "Orientado a resultados, direto e decisivo.",
      icon: Zap,
      color: "text-red-400",
      bg: "bg-red-400/10",
      grid: "col-span-12 md:col-span-4",
    },
    {
      title: "Soft Skills",
      tags: ["Liderança", "Resiliência", "Agilidade"],
      icon: Award,
      color: "text-primary",
      bg: "bg-primary/10",
      grid: "col-span-12 md:col-span-4",
    },
    {
      title: "Abertura à Experiência",
      value: "85%",
      desc: "Curioso e aberto a novos desafios.",
      icon: Brain,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      grid: "col-span-12 md:col-span-4",
    },
    {
      title: "Destaque do Perfil",
      content: "Você possui uma habilidade natural para liderar equipes em ambientes de alta pressão, mantendo o foco nos objetivos estratégicos.",
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      grid: "col-span-12 md:col-span-8",
    },
    {
      title: "Amabilidade",
      value: "75%",
      icon: Heart,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      grid: "col-span-12 md:col-span-4",
    },
  ];

  return (
    <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto pb-20">
      <Confetti />

      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-primary to-blue-500 grid place-items-center mx-auto mb-8 shadow-[0_0_50px_rgba(0,212,170,0.3)] relative"
        >
          <Check size={48} className="text-black" strokeWidth={3} />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-[32px] border-4 border-primary"
          />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
          Tudo pronto, <span className="accent-text">{firstName}</span>!
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Sua avaliação foi concluída. Confira um resumo dos seus resultados abaixo.
        </motion.p>
      </div>

      {/* IT Score card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6 card-revolut !p-6 flex items-center gap-6 border-white/5 bg-surface/40"
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${itPassed ? "bg-primary/20 text-primary" : "bg-danger/20 text-danger"}`}>
          <Monitor size={28} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="font-bold text-[15px]">Teste de Informática</p>
            <span className={`badge border text-[10px] px-2 py-0.5 ${DIFFICULTY_COLOR[itDifficulty]}`}>
              {DIFFICULTY_LABEL[itDifficulty]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{itScore} de {itTotal} questões corretas</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black ${itPassed ? "text-primary" : "text-danger"}`}>{itPct}%</div>
          <div className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${itPassed ? "text-primary/70" : "text-danger/70"}`}>
            {itPassed ? "Aprovado" : "Abaixo do mínimo"}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-5 mb-12">
        {bentoItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
            className={`${item.grid} card-revolut group relative overflow-hidden bg-surface/40 backdrop-blur-xl border-white/5 hover:border-primary/20`}
          >
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500`}>
              <item.icon size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">{item.title}</h3>
            {item.value && <div className={`text-3xl font-black mb-2 ${item.color}`}>{item.value}</div>}
            {item.desc && <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>}
            {item.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted">{tag}</span>
                ))}
              </div>
            )}
            {item.content && <p className="text-base text-muted-foreground leading-relaxed">{item.content}</p>}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <item.icon size={100} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex flex-col items-center gap-8">
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link to="/" className="btn-primary flex-1 h-14 group">
            Ir para Home <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button onClick={() => window.print()} className="btn-ghost flex-1 h-14 gap-2">
            <Download size={20} /> PDF Resumo
          </button>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">ID do Teste</p>
          <p className="text-sm font-mono text-muted bg-white/5 px-4 py-2 rounded-full border border-white/5 flex items-center gap-3">
            TF-{Math.random().toString(36).substring(7).toUpperCase()}
            <span className="w-1 h-1 rounded-full bg-white/20" />
            {completedAt}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.6 + Math.random() * 1.2,
      bg: ["#00d4aa", "#60a5fa", "#facc15", "#f472b6", "#2dffce"][i % 5],
      rot: Math.random() * 360,
    })),
  );
  useEffect(() => {}, []);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: p.rot + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{ left: `${p.left}%`, background: p.bg }}
          className="absolute top-0 w-2 h-3 rounded-sm"
        />
      ))}
    </div>
  );
}
