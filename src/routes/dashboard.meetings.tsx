import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useMeetings, useCandidates } from "@/hooks/use-talent-flow";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus, Video, MapPin, X, Check, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/meetings")({
  component: MeetingsPage,
});

function MeetingsPage() {
  const [view, setView] = useState<"month" | "week">("week");
  const [open, setOpen] = useState(false);
  const { data: meetings = [], isLoading } = useMeetings();
  const queryClient = useQueryClient();

  async function handleDeleteMeeting(meetingId: string) {
    if (!confirm("Excluir esta reunião?")) return;
    const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
    if (error) {
      toast.error("Erro ao excluir reunião");
    } else {
      toast.success("Reunião excluída");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    }
  }

  return (
    <DashboardShell title="Reuniões">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-lg border border-white/8 p-1 bg-white/2 text-xs">
          <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded ${view === "week" ? "bg-[#00d4aa]/15 text-[#2dffce]" : "text-muted"}`}>Semana</button>
          <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded ${view === "month" ? "bg-[#00d4aa]/15 text-[#2dffce]" : "text-muted"}`}>Mês</button>
        </div>
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setOpen(true)}>
          <Plus size={15} /> Agendar Reunião
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {meetings.map((m) => (
          <div key={m.id} className="card p-5 hover:-translate-y-0.5 transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{m.candidate}</h3>
                <p className="text-xs text-muted">{m.position}</p>
              </div>
              <span className={`badge ${m.status === "Agendada" ? "badge-info" : m.status === "Realizada" ? "badge-success" : "badge-danger"}`}>{m.status}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-muted">
                <Calendar size={14} /> {new Date(m.date).toLocaleDateString("pt-BR")} · {m.time}
              </p>
              <p className="flex items-center gap-2 text-muted">
                {m.format === "Presencial" ? <MapPin size={14} /> : <Video size={14} />} {m.format}
              </p>
              <span className="inline-block badge badge-primary mt-1">{m.type}</span>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-ghost flex-1 text-sm inline-flex items-center justify-center gap-2" onClick={() => toast.success(`Entrando na reunião com ${m.candidate}...`)}>
                <Video size={14} /> Entrar
              </button>
              <button
                className="p-2 rounded-xl hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors border border-border"
                onClick={() => handleDeleteMeeting(m.id)}
                title="Excluir reunião"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && <NewMeetingModal onClose={() => setOpen(false)} />}
    </DashboardShell>
  );
}

export function NewMeetingModal({ onClose, initialCandidateId }: { onClose: () => void; initialCandidateId?: string }) {
  const queryClient = useQueryClient();
  const { data: candidates = [] } = useCandidates();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    candidateId: initialCandidateId || (candidates[0]?.id || ""), 
    type: "Entrevista Inicial", 
    date: "", 
    time: "", 
    format: "Google Meet", 
    notes: "" 
  });

  useEffect(() => {
    if (!form.candidateId && candidates.length > 0) {
      setForm(f => ({ ...f, candidateId: candidates[0].id }));
    }
  }, [candidates]);

  const ready = form.candidateId && form.date && form.time;

  async function handleCreate() {
    setLoading(true);
    try {
      const { error } = await supabase.from("meetings").insert({
        candidate_id: form.candidateId,
        date: form.date,
        time: form.time,
        type: form.type,
        format: form.format,
        status: "Agendada"
      });

      if (error) throw error;

      toast.success("Reunião agendada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar reunião");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="card w-full max-w-lg p-6 gradient-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Agendar Reunião</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <Field label="Candidato">
            <select className="input" value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })}>
              <option value="" disabled className="bg-[#131c33]">Selecione um candidato</option>
              {candidates.map((c: any) => <option key={c.id} value={c.id} className="bg-[#131c33]">{c.name} — {c.position}</option>)}
            </select>
          </Field>
          <Field label="Tipo de reunião">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {["Entrevista Inicial", "Análise de Perfil", "Onboarding"].map((t) => <option key={t} className="bg-[#131c33]">{t}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data"><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Horário"><input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          </div>
          <Field label="Formato">
            <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {["Presencial", "Google Meet", "Zoom"].map((t) => <option key={t} className="bg-[#131c33]">{t}</option>)}
            </select>
          </Field>
          <Field label="Observações"><textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas para o time…" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary inline-flex items-center gap-2" disabled={!ready || loading} onClick={handleCreate}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Confirmar Agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted mb-1 block">{label}</span>{children}</label>;
}
