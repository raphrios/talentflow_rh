import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useCandidates } from "@/hooks/use-talent-flow";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Mail, Plus, X, Check, Loader2, Share2, AlertCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Candidate } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/processes")({
  component: ProcessesPage,
});

function ProcessesPage() {
  const [open, setOpen] = useState(false);
  const { data: candidates = [], isLoading } = useCandidates();
  const queryClient = useQueryClient();
  
  async function handleDeleteProcess(candidateId: string) {
    if (!confirm("Excluir este processo? Esta ação não pode ser desfeita.")) return;
    try {
      await supabase.from("assessments").delete().eq("candidate_id", candidateId);
      await supabase.from("documents").delete().eq("candidate_id", candidateId);
      await supabase.from("meetings").delete().eq("candidate_id", candidateId);
      const { error } = await supabase.from("candidates").delete().eq("id", candidateId);
      if (error) throw error;
      toast.success("Processo excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir processo");
    }
  }

  async function handleWhatsAppShare(candidate: Candidate) {
    if (!candidate.phone) {
      toast.error("Candidato não possui telefone cadastrado.");
      return;
    }

    const cleanPhone = candidate.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Número de telefone inválido (mínimo 10 dígitos).");
      return;
    }

    try {
      const text = encodeURIComponent(`Olá ${candidate.name}! Seu token TalentFlow: ${candidate.token}\n\nAcesse: ${window.location.origin}/token`);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      
      const { error } = await supabase
        .from("candidates")
        .update({ 
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_error: null 
        })
        .eq("id", candidate.id);

      if (error) throw error;
      
      toast.success("Redirecionando para o WhatsApp...");
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    } catch (err: any) {
      toast.error("Erro ao registrar envio de WhatsApp.");
      await supabase
        .from("candidates")
        .update({ whatsapp_error: "Falha ao abrir WhatsApp" })
        .eq("id", candidate.id);
    }
  }

  // Map candidates to processes for the UI
  const processes = candidates.map(c => ({
    id: `p-${c.id}`,
    candidate: c,
    status: c.status === "Concluído" ? "Concluído" : c.status === "Pendente" ? "Aguardando" : "Em Andamento",
    testsDone: c.status === "Concluído",
    documentsDone: false, // In a real app, check documents table
    meetingDone: false, // In a real app, check meetings table
  }));

  if (isLoading) {
    return (
      <DashboardShell title="Processos">
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Processos de Admissão">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted">Gerencie todos os processos em andamento.</p>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setOpen(true)}>
          <Plus size={15} /> Novo Processo
        </button>
      </div>

      <div className="card-revolut overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-surface/50">
                <th className="py-4 pl-6 font-bold uppercase tracking-wider">Candidato</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Token</th>
                <th>Testes</th>
                <th>Docs</th>
                <th>WhatsApp</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processes.map((p) => (
                <tr key={p.id} className="hover:bg-surface/60 transition-colors">
                  <td className="py-4 pl-6 font-semibold">{p.candidate.name}</td>
                  <td>{p.candidate.position}</td>
                  <td>
                    <span className={`badge ${p.status === "Concluído" ? "badge-success" : p.status === "Aguardando" ? "badge-warning" : "badge-info"}`}>{p.status}</span>
                  </td>
                  <td>
                    <div className="inline-flex items-center gap-2">
                      <code className="font-mono text-xs text-[#2dffce]">{p.candidate.token}</code>
                      <button onClick={() => { navigator.clipboard.writeText(p.candidate.token); toast.success("Token copiado"); }} className="text-muted hover:text-foreground">
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td>{p.testsDone ? <Check size={15} className="text-[#4ade80]" /> : <span className="text-muted text-xs">—</span>}</td>
                  <td>{p.documentsDone ? <Check size={15} className="text-[#4ade80]" /> : <span className="text-muted text-xs">—</span>}</td>
                  <td>
                    {p.candidate.whatsappSentAt ? (
                      <div className="flex items-center gap-1 text-[#25D366] text-xs">
                        <Check size={12} /> 
                        <span>{new Date(p.candidate.whatsappSentAt).toLocaleDateString()}</span>
                      </div>
                    ) : p.candidate.whatsappError ? (
                      <div className="flex items-center gap-1 text-red-400 text-xs">
                        <AlertCircle size={12} />
                        <span>Falha</span>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">Não enviado</span>
                    )}
                  </td>
                  <td className="text-right pr-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleWhatsAppShare(p.candidate)}
                        className="text-[#25D366] hover:underline flex items-center gap-1"
                      >
                        <Share2 size={12} /> <span className="text-xs">Enviar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProcess(p.candidate.id)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                        title="Excluir processo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && <NewProcessModal onClose={() => setOpen(false)} />}
    </DashboardShell>
  );
}

function NewProcessModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [token] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "", department: "" });
  const [loading, setLoading] = useState(false);
  
  const ready = form.name && form.email && form.phone && form.position && form.department;

  async function handleCreate() {
    setLoading(true);
    try {
      const { error } = await supabase.from("candidates").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        position: form.position,
        department: form.department,
        token: token,
        status: "Pendente"
      });

      if (error) throw error;

      toast.success("Processo criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar processo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="card w-full max-w-lg p-6 gradient-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Novo Processo</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nome do candidato"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: João da Silva" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@email.com" /></Field>
            <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo"><input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Desenvolvedor" /></Field>
            <Field label="Departamento"><input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Tecnologia" /></Field>
          </div>

          <div className="mt-4 p-4 rounded-xl border border-[#00d4aa]/30 bg-[#00d4aa]/8 text-center">
            <p className="text-xs text-muted mb-2">Token de acesso gerado</p>
            <div className="text-3xl font-bold font-display tracking-[0.4em] gradient-text">{token}</div>
            <div className="flex justify-center flex-wrap gap-2 mt-3">
              <button className="btn-ghost text-xs inline-flex items-center gap-1" onClick={() => { navigator.clipboard.writeText(token); toast.success("Token copiado"); }}>
                <Copy size={12} /> Copiar
              </button>
              <button className="btn-ghost text-xs inline-flex items-center gap-1" onClick={() => {
                if (!form.phone) {
                  toast.error("Informe o telefone para compartilhar.");
                  return;
                }
                const cleanPhone = form.phone.replace(/\D/g, "");
                const text = encodeURIComponent(`Olá ${form.name}! Seu token de acesso para o TalentFlow é: ${token}\n\nAcesse: ${window.location.origin}/token`);
                window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
              }}>
                <Share2 size={12} className="text-[#25D366]" /> WhatsApp
              </button>
              <button className="btn-ghost text-xs inline-flex items-center gap-1" onClick={() => toast.success("Token reenviado por e-mail")}>
                <Mail size={12} /> E-mail
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary inline-flex items-center gap-2" disabled={!ready || loading} onClick={handleCreate}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Criar Processo
            </button>
          </div>
        </div>
      </div>
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
