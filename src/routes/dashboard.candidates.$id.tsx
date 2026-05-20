import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useCandidate } from "@/hooks/use-talent-flow";
import { Bar, BarChart, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar, FileText, Download, ArrowLeft, Mail, Phone, CheckCircle2, AlertCircle, Send, Check, X, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { NewMeetingModal } from "./dashboard.meetings";

export const Route = createFileRoute("/dashboard/candidates/$id")({
  component: CandidateDetail,
});

function CandidateDetail() {
  const { id } = Route.useParams();
  const { data: c, isLoading } = useCandidate(id);

  if (isLoading) {
    return (
      <DashboardShell title="Carregando...">
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!c) {
    return (
      <DashboardShell title="Candidato">
        <div className="card p-8 text-center">
          <p className="text-muted">Candidato não encontrado.</p>
          <Link to="/dashboard/candidates" className="text-primary hover:underline mt-4 inline-block">Voltar para lista</Link>
        </div>
      </DashboardShell>
    );
  }
  const discData = [
    { name: "D", value: c.disc.D, fill: "#ef4444", label: "Dominância" },
    { name: "I", value: c.disc.I, fill: "#facc15", label: "Influência" },
    { name: "S", value: c.disc.S, fill: "#22c55e", label: "Estabilidade" },
    { name: "C", value: c.disc.C, fill: "#3b82f6", label: "Conformidade" },
  ];
  const bf = [
    { trait: "Abertura", value: c.bigFive.openness, desc: "Curiosidade, criatividade." },
    { trait: "Conscienciosidade", value: c.bigFive.conscientiousness, desc: "Organização e disciplina." },
    { trait: "Extroversão", value: c.bigFive.extraversion, desc: "Sociabilidade e energia." },
    { trait: "Amabilidade", value: c.bigFive.agreeableness, desc: "Cooperação e empatia." },
    { trait: "Neuroticismo", value: c.bigFive.neuroticism, desc: "Estabilidade emocional inversa." },
  ];

  const [isExporting, setIsExporting] = useState(false);
  const [isRequestingDocs, setIsRequestingDocs] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    
    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          const doc = new jsPDF();
          const accentColor = [0, 212, 170]; // #00D4AA

          // Header
          doc.setFillColor(15, 23, 42); // Navy background
          doc.rect(0, 0, 210, 40, "F");
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(24);
          doc.text("TalentFlow", 20, 25);
          
          doc.setFontSize(10);
          doc.text("Relatório de Avaliação do Candidato", 20, 32);
          
          // Candidate Info
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(18);
          doc.text(c.name, 20, 55);
          
          doc.setFontSize(11);
          doc.setTextColor(100, 100, 100);
          doc.text(`${c.position} · ${c.department}`, 20, 62);
          
          // Stats Table
          (doc as any).autoTable({
            startY: 70,
            head: [["Atributo", "Valor"]],
            body: [
              ["E-mail", c.email],
              ["Telefone", c.phone],
              ["Data do Teste", new Date(c.testDate).toLocaleDateString("pt-BR")],
              ["Status", c.status],
              ["Compatibilidade", `${c.compatibility}%`],
              ["Perfil Dominante", c.dominantLabel]
            ],
            headStyles: { fillColor: accentColor },
            margin: { left: 20, right: 20 }
          });

          // DISC Data
          const finalY = (doc as any).lastAutoTable.finalY + 15;
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          doc.text("Resultados DISC", 20, finalY);
          
          (doc as any).autoTable({
            startY: finalY + 5,
            head: [["Fator", "Pontuação", "Descrição"]],
            body: [
              ["Dominância (D)", `${c.disc.D}%`, "Desafio, controle, resultados"],
              ["Influência (I)", `${c.disc.I}%`, "Pessoas, comunicação, entusiasmo"],
              ["Estabilidade (S)", `${c.disc.S}%`, "Paciência, apoio, consistência"],
              ["Conformidade (C)", `${c.disc.C}%`, "Regras, precisão, qualidade"]
            ],
            headStyles: { fillColor: accentColor },
            margin: { left: 20, right: 20 }
          });

          // Big Five
          const bfY = (doc as any).lastAutoTable.finalY + 15;
          doc.text("Big Five Personality Traits", 20, bfY);
          
          (doc as any).autoTable({
            startY: bfY + 5,
            head: [["Traço", "Pontuação"]],
            body: [
              ["Abertura", `${c.bigFive.openness}%`],
              ["Conscienciosidade", `${c.bigFive.conscientiousness}%`],
              ["Extroversão", `${c.bigFive.extraversion}%`],
              ["Amabilidade", `${c.bigFive.agreeableness}%`],
              ["Neuroticismo", `${c.bigFive.neuroticism}%`]
            ],
            headStyles: { fillColor: accentColor },
            margin: { left: 20, right: 20 }
          });

          doc.save(`TalentFlow_Relatorio_${c.name.replace(/\s+/g, "_")}.pdf`);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      }),
      {
        loading: "Gerando relatório PDF...",
        success: "Relatório exportado com sucesso!",
        error: "Erro ao exportar PDF",
        finally: () => setIsExporting(false),
      }
    );
  };

  const handleRequestDocs = () => {
    setIsRequestingDocs(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Enviando solicitação...",
        success: "Solicitação de documentos enviada para o candidato!",
        error: "Erro ao enviar solicitação",
        finally: () => setIsRequestingDocs(false),
      }
    );
  };

  return (
    <DashboardShell title="Perfil do Candidato">
      <Link to="/dashboard/candidates" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4">
        <ArrowLeft size={15} /> Voltar para candidatos
      </Link>

      <div className="card p-6 mb-5 gradient-border">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#60a5fa] grid place-items-center text-[#022c22] font-bold text-2xl">
            {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{c.name}</h2>
            <p className="text-muted">{c.position} · {c.department}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Mail size={12} /> {c.email}</span>
              <span className="inline-flex items-center gap-1"><Phone size={12} /> {c.phone}</span>
              <span className="inline-flex items-center gap-1"><Calendar size={12} /> {new Date(c.testDate).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className={`badge ${c.status === "Concluído" ? "badge-success" : c.status === "Pendente" ? "badge-warning" : "badge-info"}`}>{c.status}</span>
            <div className="text-right">
              <div className="text-xs text-muted">Compatibilidade</div>
              <div className="text-2xl font-bold gradient-text">{c.compatibility || "—"}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Perfil DISC</h3>
            <span className="badge badge-primary">Perfil Dominante: {c.dominantLabel}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={discData}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#131c33", border: "1px solid #ffffff15", borderRadius: 8 }} formatter={((v: any, _n: any, p: any) => [`${v}%`, p.payload.label]) as any} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {discData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted mt-3">
            O perfil <strong className="text-foreground">{c.dominantLabel}</strong> tende a destacar-se em comunicação,
            influência e mobilização de pessoas. Combina bem com cargos que envolvem relacionamento e liderança inspiradora.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3">Big Five</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={bf}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="trait" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#ffffff10" />
                <Radar dataKey="value" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            {bf.map((t) => (
              <div key={t.trait} className="flex items-center justify-between p-2 rounded bg-white/3">
                <span className="text-muted">{t.trait}</span>
                <span className="font-semibold">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Pontos fortes</h3>
          <div className="space-y-2">
            {["Excelente comunicação interpessoal", "Capacidade de mobilizar equipes", "Resiliência em ambientes dinâmicos"].map((s) => (
              <div key={s} className="flex items-start gap-2 p-3 rounded-lg bg-[#22c55e]/8 border border-[#22c55e]/20">
                <CheckCircle2 size={16} className="text-[#4ade80] mt-0.5" />
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Áreas de desenvolvimento</h3>
          <div className="space-y-2">
            {["Aprofundar análises técnicas detalhadas", "Refinar atenção a processos formais"].map((s) => (
              <div key={s} className="flex items-start gap-2 p-3 rounded-lg bg-[#eab308]/8 border border-[#eab308]/20">
                <AlertCircle size={16} className="text-[#facc15] mt-0.5" />
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setIsMeetingModalOpen(true)}>
          <Calendar size={15} /> Agendar Reunião
        </button>
        {isMeetingModalOpen && (
          <NewMeetingModal 
            onClose={() => setIsMeetingModalOpen(false)} 
            initialCandidateId={c.id}
          />
        )}
        <button 
          className="btn-ghost inline-flex items-center gap-2" 
          onClick={handleRequestDocs}
          disabled={isRequestingDocs}
        >
          <FileText size={15} /> Solicitar Documentos
        </button>
        <button 
          className="btn-ghost inline-flex items-center gap-2" 
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          <Download size={15} /> {isExporting ? "Exportando..." : "Exportar PDF"}
        </button>
      </div>
    </DashboardShell>
  );
}
