import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { Briefcase, ClipboardCheck, Calendar, FileText, TrendingUp, TrendingDown, ArrowRight, Upload, PlayCircle, Brain, Check, Loader2 } from "lucide-react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { DashboardShell } from "@/components/DashboardShell";
import { useCandidates, useMeetings, useDocuments } from "@/hooks/use-talent-flow";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { discQuestions, bigFiveQuestions } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { profile } = useRouteContext({ from: "/dashboard" }) as any;
  const isColaborador = profile?.role === "colaborador";

  if (isColaborador) {
    return <ColaboradorDashboard profile={profile} />;
  }
  
  return <RecruiterDashboard />;
}

function ColaboradorDashboard({ profile }: { profile: any }) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      const { data, error } = await supabase
        .from("collaborator_tests")
        .select("*")
        .eq("user_id", profile.id);
      
      if (!error && data) {
        setTests(data);
      }
      setLoading(false);
    }
    fetchTests();
  }, [profile.id]);

  const discTest = tests.find(t => t.test_type === "disc");
  const bigFiveTest = tests.find(t => t.test_type === "big_five");

  return (
    <DashboardShell title="Meus Testes">
      <div className="space-y-8">
        <div className="card-revolut !p-8 bg-primary/10 border-primary/20">
          <h2 className="text-2xl font-black mb-2">Olá, {profile?.full_name || "Colaborador"}!</h2>
          <p className="text-muted-foreground">Você foi convidado para participar de um processo seletivo. Realize os testes abaixo e envie seus documentos para prosseguir.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-[24px]" />
            <Skeleton className="h-48 rounded-[24px]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestCard 
              title="Teste de Perfil (DISC)"
              description="Descubra seu perfil comportamental predominante."
              icon={<ClipboardCheck size={24} />}
              status={discTest?.status || "pending"}
              testType="disc"
              userId={profile.id}
            />

            <TestCard 
              title="Personalidade (Big Five)"
              description="Avalie suas principais dimensões de personalidade."
              icon={<Brain size={24} />}
              status={bigFiveTest?.status || "pending"}
              testType="big_five"
              userId={profile.id}
            />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-revolut !p-6 flex flex-col gap-4 border-white/5 bg-surface/40"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Documentação Pendente</h3>
                <p className="text-sm text-muted-foreground mt-1">Envie RG, CPF e Comprovante de Residência.</p>
              </div>
              <Link to="/dashboard/documents" className="btn-secondary w-full mt-auto flex items-center justify-center gap-2">
                <Upload size={18} /> Enviar Agora
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function TestCard({ title, description, icon, status, testType, userId }: any) {
  const [active, setActive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const questions = testType === "disc" ? discQuestions : bigFiveQuestions;
  const isCompleted = status === "completed";

  const startTest = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("collaborator_tests")
      .select("*")
      .eq("user_id", userId)
      .eq("test_type", testType)
      .single();

    if (!data) {
      await supabase.from("collaborator_tests").insert({
        user_id: userId,
        test_type: testType,
        status: "in_progress",
        responses: {}
      });
    } else if (data.responses) {
      setAnswers(data.responses);
    }
    
    setSaving(false);
    setActive(true);
  };

  const saveAnswer = async (questionId: any, answer: any) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    await supabase
      .from("collaborator_tests")
      .update({ responses: newAnswers, status: "in_progress" })
      .eq("user_id", userId)
      .eq("test_type", testType);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Finalize
      setSaving(true);
      await supabase
        .from("collaborator_tests")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("test_type", testType);
      
      setSaving(false);
      setActive(false);
      window.location.reload();
    }
  };

  if (active) {
    const q = questions[currentIdx];
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
        <div className="card-revolut w-full max-w-2xl !p-8 bg-surface border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">{title}</h3>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Questão {currentIdx + 1} de {questions.length}</span>
          </div>
          
          <div className="h-1.5 w-full bg-white/5 rounded-full mb-8 overflow-hidden">
            <motion.div 
              className="h-full bg-primary shadow-[0_0_10px_rgba(0,212,170,0.5)]" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="space-y-6">
            <p className="text-lg font-medium">{(q as any).q}</p>
            <div className="grid gap-3">
              {testType === "disc" ? (
                (q as any).options.map((opt: any) => (
                  <button 
                    key={opt.value} 
                    onClick={() => saveAnswer(q.id, opt.value)}
                    className="p-4 text-left rounded-xl border border-white/5 bg-white/2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-white/20 group-hover:border-primary transition-colors" />
                      {opt.label}
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Discordo</span>
                    <span>Concordo</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button 
                        key={val} 
                        onClick={() => saveAnswer(q.id, val)}
                        className="flex-1 h-12 rounded-xl border border-white/5 bg-white/2 hover:border-primary/50 hover:bg-primary/5 font-bold transition-all"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button onClick={() => setActive(false)} className="mt-8 text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
            Sair e continuar depois
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-revolut !p-6 flex flex-col gap-4 border-white/5 bg-surface/40 ${isCompleted ? 'opacity-80' : ''}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
        {isCompleted ? <Check size={24} /> : icon}
      </div>
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2">
          {title}
          {isCompleted && <span className="text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded-full">Concluído</span>}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {!isCompleted && (
        <button 
          onClick={startTest}
          disabled={saving}
          className="btn-primary w-full mt-auto flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle size={18} />}
          {status === "in_progress" ? "Continuar Teste" : "Iniciar Teste"}
        </button>
      )}
      {isCompleted && (
        <div className="mt-auto pt-4 border-t border-white/5 text-xs text-muted-foreground italic">
          Teste realizado com sucesso.
        </div>
      )}
    </motion.div>
  );
}

function RecruiterDashboard() {
  const { data: candidatesData, isLoading } = useCandidates();
  const { data: meetingsData = [] } = useMeetings();
  const { data: docsData = [] } = useDocuments();

  const candidates = candidatesData || [];
  const completed = candidates.filter((c) => c.status === "Concluído");
  const avgBigFive = [
    { trait: "Abertura", value: avg(completed.map((c) => c.bigFive?.openness ?? 0)) },
    { trait: "Conscienciosidade", value: avg(completed.map((c) => c.bigFive?.conscientiousness ?? 0)) },
    { trait: "Extroversão", value: avg(completed.map((c) => c.bigFive?.extraversion ?? 0)) },
    { trait: "Amabilidade", value: avg(completed.map((c) => c.bigFive?.agreeableness ?? 0)) },
    { trait: "Neuroticismo", value: avg(completed.map((c) => c.bigFive?.neuroticism ?? 0)) },
  ];
  const discDist = [
    { name: "Dominante", value: candidates.filter((c) => c.dominant === "D").length, fill: "#00d4aa" },
    { name: "Influenciador", value: candidates.filter((c) => c.dominant === "I").length, fill: "#3b82f6" },
    { name: "Estável", value: candidates.filter((c) => c.dominant === "S").length, fill: "#a855f7" },
    { name: "Conformista", value: candidates.filter((c) => c.dominant === "C").length, fill: "#64748b" },
  ];

  const today = new Date().toISOString().split("T")[0];
  const kpis = [
    { label: "Processos Ativos", value: candidates.filter((c) => c.status !== "Concluído").length, delta: +18, icon: Briefcase, to: "/dashboard/processes" },
    { label: "Testes Concluídos", value: completed.length, delta: +25, icon: ClipboardCheck, to: "/dashboard/candidates" },
    { label: "Agenda de Hoje", value: (meetingsData as any[]).filter((m) => m.date === today).length, delta: -10, icon: Calendar, to: "/dashboard/meetings" },
    { label: "Docs Pendentes", value: (docsData as any[]).filter((d) => d.status === "Pendente").length, delta: +5, icon: FileText, to: "/dashboard/documents" },
  ];

  return (
    <DashboardShell title="Visão Geral">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card-revolut !p-6 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </div>
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[400px] lg:col-span-2 rounded-[24px]" />
              <Skeleton className="h-[400px] rounded-[24px]" />
            </div>
            <Skeleton className="h-[400px] rounded-[24px]" />
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((k, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={k.to as any}
                    className="card-revolut !p-6 group block border-white/5 hover:border-primary/20 bg-surface/40 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">{k.label}</p>
                        <p className="text-4xl font-extrabold tracking-tight">{k.value}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all group-hover:scale-110">
                        <k.icon size={22} />
                      </div>
                    </div>
                    <div className={`mt-6 inline-flex items-center gap-1.5 text-sm font-bold ${k.delta >= 0 ? "text-primary" : "text-danger"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${k.delta >= 0 ? "bg-primary shadow-[0_0_8px_rgba(0,212,170,0.5)]" : "bg-danger"}`} />
                      {k.delta >= 0 ? "+" : ""}{k.delta}%
                      <span className="text-muted-foreground font-medium ml-1">esta semana</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="card-revolut lg:col-span-2 border-white/5 bg-surface/40 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold">Análise Científica Média</h3>
                    <p className="text-sm text-muted-foreground">Distribuição Big Five dos candidatos concluídos</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="badge border border-primary/20 bg-primary/5 text-primary">Consolidado</div>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={avgBigFive}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="trait" tick={{ fill: "#8e96aa", fontSize: 12, fontWeight: 500 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} stroke="transparent" />
                      <Radar 
                        dataKey="value" 
                        stroke="#00d4aa" 
                        strokeWidth={3}
                        fill="#00d4aa" 
                        fillOpacity={0.15} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: "#0d101a", 
                          border: "1px solid rgba(255,255,255,0.1)", 
                          borderRadius: "16px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                        }} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="card-revolut border-white/5 bg-surface/40 backdrop-blur-sm"
              >
                <div className="mb-8">
                  <h3 className="text-lg font-bold">Predominância DISC</h3>
                  <p className="text-sm text-muted-foreground">Perfis dominantes na base</p>
                </div>
                <div className="h-80 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={discDist} 
                        dataKey="value" 
                        nameKey="name" 
                        innerRadius={70} 
                        outerRadius={100} 
                        paddingAngle={8}
                        stroke="none"
                      >
                        {discDist.map((d, i) => <Cell key={i} fill={d.fill} className="outline-none" />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: "#0d101a", 
                          border: "1px solid rgba(255,255,255,0.1)", 
                          borderRadius: "16px"
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-extrabold">{candidates.length}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {discDist.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card-revolut border-white/5 bg-surface/40 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold">Atividade Recente</h3>
                  <p className="text-sm text-muted-foreground">Últimas avaliações em tempo real</p>
                </div>
                <Link to="/dashboard/candidates" className="btn-ghost !py-2 !px-4 !text-sm group">
                  Ver pipeline completo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-border">
                      <th className="pb-4 pl-2">Candidato</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Perfil</th>
                      <th className="pb-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {candidates.slice(0, 5).map((c) => (
                      <tr key={c.id} className="group hover:bg-surface/60 transition-colors">
                        <td className="py-5 pl-2">
                          <div className="font-bold text-[15px]">{c.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.position}</div>
                        </td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,212,170,0.4)]" />
                            <span className="font-bold text-xs uppercase tracking-wider">{c.dominantLabel}</span>
                          </div>
                        </td>
                        <td>
                          <Link 
                            to="/dashboard/candidates/$id" 
                            params={{ id: c.id }} 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
                          >
                            <ArrowRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isDone = status === "Concluído";
  const isPending = status === "Pendente";
  
  return (
    <span className={`
      badge !px-3 !py-1 !text-[10px] 
      ${isDone ? "bg-primary/10 text-primary border border-primary/20" : 
        isPending ? "bg-warning/10 text-warning border border-warning/20" : 
        "bg-info/10 text-info border border-info/20"}
    `}>
      {status}
    </span>
  );
}

function avg(nums: number[]) { 
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0; 
}

