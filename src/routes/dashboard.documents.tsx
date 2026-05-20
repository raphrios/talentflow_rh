import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useDocuments, useCandidates } from "@/hooks/use-talent-flow";
import { docTypes } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Plus, Send, X, Copy, Loader2,
  Download, CheckCircle, Clock, AlertCircle, XCircle, ChevronDown, ExternalLink, Trash2
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/Skeleton";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/dashboard/documents")({
  component: DocumentsPage,
});

const STATUS_OPTIONS = ["Pendente", "Em Análise", "Documentação Pendente", "Aprovado", "Reprovado"] as const;
type DocStatus = typeof STATUS_OPTIONS[number];

const STATUS_STYLE: Record<DocStatus, { bg: string; text: string; icon: React.ElementType }> = {
  "Aprovado":               { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-500", icon: CheckCircle },
  "Em Análise":             { bg: "bg-blue-500/10 border-blue-500/30",       text: "text-blue-400",   icon: Clock },
  "Documentação Pendente":  { bg: "bg-amber-500/10 border-amber-500/30",     text: "text-amber-400",  icon: AlertCircle },
  "Pendente":               { bg: "bg-zinc-500/10 border-zinc-500/30",       text: "text-zinc-400",   icon: Clock },
  "Reprovado":              { bg: "bg-red-500/10 border-red-500/30",         text: "text-red-400",    icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status as DocStatus] ?? STATUS_STYLE["Pendente"];
  const Icon = s.icon;
  return (
    <span className={`badge border ${s.bg} ${s.text} inline-flex items-center gap-1.5`}>
      <Icon size={11} /> {status}
    </span>
  );
}

function StatusDropdown({ docId, currentStatus, onUpdate }: { docId: string; currentStatus: string; onUpdate: (id: string, s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (s: string) => {
    setOpen(false);
    setLoading(true);
    await onUpdate(docId, s);
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-xs font-medium"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <StatusBadge status={currentStatus} />}
        <ChevronDown size={12} className="text-muted-foreground" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-xl min-w-[200px] overflow-hidden"
            >
              {STATUS_OPTIONS.map((s) => {
                const style = STATUS_STYLE[s];
                const Icon = style.icon;
                return (
                  <button
                    key={s}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold hover:bg-surface transition-colors ${s === currentStatus ? "bg-surface" : ""}`}
                    onClick={() => handleSelect(s)}
                  >
                    <Icon size={13} className={style.text} />
                    <span className={style.text}>{s}</span>
                    {s === currentStatus && <span className="ml-auto text-primary text-[10px]">✓</span>}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DocumentsPage() {
  const [filterCandidate, setFilterCandidate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [drawer, setDrawer] = useState(false);
  const { data: docs = [], isLoading } = useDocuments();
  const { data: candidates = [] } = useCandidates();
  const queryClient = useQueryClient();

  const updateDocStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("documents").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Status atualizado para "${newStatus}"`);
    } catch {
      toast.error("Erro ao atualizar status do documento");
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Excluir este documento?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir documento");
    } else {
      toast.success("Documento excluído");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  };

  const handleDownload = (doc: any) => {
    if (doc.url) {
      window.open(doc.url, "_blank");
    } else {
      toast.info("Este documento ainda não foi enviado pelo colaborador.");
    }
  };

  const handleDownloadAll = () => {
    const withUrl = filtered.filter((d: any) => d.url);
    if (withUrl.length === 0) {
      toast.info("Nenhum documento enviado disponível para download.");
      return;
    }
    withUrl.forEach((d: any) => window.open(d.url, "_blank"));
    toast.success(`${withUrl.length} documento(s) aberto(s) para download.`);
  };

  const filtered = useMemo(() =>
    docs.filter((d: any) =>
      (!filterCandidate || d.candidateId === filterCandidate) &&
      (!filterStatus || d.status === filterStatus),
    ),
  [docs, filterCandidate, filterStatus]);

  const sentCount = filtered.filter((d: any) => d.url).length;

  return (
    <DashboardShell title="Documentos">
      {/* Filters */}
      <div className="card-revolut p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="input"
          value={filterCandidate}
          onChange={(e) => setFilterCandidate(e.target.value)}
        >
          <option value="">Todos os candidatos</option>
          {candidates.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button
          className="btn-primary inline-flex items-center justify-center gap-2 md:col-start-3"
          onClick={() => setDrawer(true)}
        >
          <Plus size={15} /> Solicitar Documentos
        </button>
        <button
          className="btn-ghost inline-flex items-center justify-center gap-2"
          onClick={handleDownloadAll}
          disabled={sentCount === 0}
          title={sentCount === 0 ? "Nenhum documento enviado ainda" : `Baixar ${sentCount} documento(s)`}
        >
          <Download size={15} /> Baixar Todos ({sentCount})
        </button>
      </div>

      {/* Table */}
      <div className="card-revolut overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center py-2">
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 flex-1 rounded-lg" />
                  <Skeleton className="h-10 w-32 rounded-lg" />
                  <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border bg-surface/50">
                    <th className="py-4 pl-6 font-bold uppercase tracking-wider">Candidato</th>
                    <th className="py-4 font-bold uppercase tracking-wider">Documento</th>
                    <th className="py-4 font-bold uppercase tracking-wider hidden md:table-cell">Tipo</th>
                    <th className="py-4 font-bold uppercase tracking-wider hidden md:table-cell">Solicitado em</th>
                    <th className="py-4 font-bold uppercase tracking-wider">Status</th>
                    <th className="py-4 pr-6 font-bold uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((d: any) => (
                    <motion.tr
                      key={d.id}
                      layoutId={d.id}
                      className="group hover:bg-surface/60 transition-colors"
                    >
                      <td className="py-4 pl-6 font-semibold">{d.candidate}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <FileText size={15} />
                          </div>
                          <span>{d.document}</span>
                        </div>
                      </td>
                      <td className="py-4 text-muted-foreground hidden md:table-cell">{d.type}</td>
                      <td className="py-4 text-muted-foreground hidden md:table-cell">
                        {new Date(d.requestedAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-4">
                        <StatusDropdown
                          docId={d.id}
                          currentStatus={d.status}
                          onUpdate={updateDocStatus}
                        />
                      </td>
                      <td className="py-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              d.url
                                ? "bg-primary/10 text-primary hover:bg-primary hover:text-black"
                                : "bg-surface text-muted-foreground cursor-not-allowed opacity-50"
                            }`}
                            onClick={() => handleDownload(d)}
                            title={d.url ? "Baixar documento" : "Documento não enviado"}
                          >
                            <Download size={12} />
                            {d.url ? "Baixar" : "Pendente"}
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                            onClick={() => handleDeleteDoc(d.id)}
                            title="Excluir documento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-40">
                          <FileText size={48} />
                          <p className="text-sm">Nenhum documento encontrado.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {drawer && <RequestDrawer onClose={() => setDrawer(false)} candidates={candidates} />}
    </DashboardShell>
  );
}

function RequestDrawer({ onClose, candidates }: { onClose: () => void; candidates: any[] }) {
  const queryClient = useQueryClient();
  const [cand, setCand] = useState(candidates[0]?.id || "");
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadToken, setUploadToken] = useState<string | null>(null);

  useEffect(() => {
    if (!cand && candidates.length > 0) setCand(candidates[0].id);
  }, [candidates]);

  async function handleSend() {
    if (picked.length === 0) return;
    setLoading(true);
    try {
      const inserts = picked.map((docName) => ({
        candidate_id: cand,
        name: docName,
        type: ["Identidade", "Identidade", "Residência", "Trabalho", "Educação", "Saúde", "Foto", "Contrato"][docTypes.indexOf(docName)] ?? "Outros",
        status: "Pendente",
      }));

      const { error } = await supabase.from("documents").insert(inserts);
      if (error) throw error;

      // Use the candidate's existing token for the upload link
      const selectedCand = candidates.find((c: any) => c.id === cand);
      setUploadToken(selectedCand?.token || null);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Solicitação enviada (${picked.length} documentos)`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar documentos");
    } finally {
      setLoading(false);
    }
  }

  const copyUploadLink = () => {
    if (!uploadToken) return;
    const link = `${window.location.origin}/docs-upload/${uploadToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de upload copiado!");
  };

  const copyToken = () => {
    if (!uploadToken) return;
    navigator.clipboard.writeText(uploadToken);
    toast.success("Token copiado!");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative h-full w-full max-w-md bg-card border-l border-border p-6 overflow-y-auto flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Solicitar Documentos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Selecione os documentos necessários</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {uploadToken ? (
          /* Success state — show upload token */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6 text-center">
              <CheckCircle size={36} className="text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-emerald-500 mb-1">Solicitação enviada!</h4>
              <p className="text-xs text-muted-foreground">{picked.length} documento(s) solicitado(s)</p>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Token de Envio</p>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-3">
                  <code className="flex-1 font-mono text-2xl font-black tracking-widest text-primary text-center">
                    {uploadToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors flex-shrink-0"
                    title="Copiar token"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Compartilhe este token com o colaborador para que ele faça o upload dos documentos.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Link direto de upload</p>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl p-3">
                  <span className="flex-1 text-xs text-muted-foreground font-mono truncate">
                    {window.location.origin}/docs-upload/{uploadToken}
                  </span>
                  <button
                    onClick={copyUploadLink}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap"
                  >
                    <ExternalLink size={14} /> Copiar
                  </button>
                </div>
              </div>

              <div className="bg-surface rounded-xl p-4">
                <p className="text-xs font-bold mb-2">Documentos solicitados:</p>
                <ul className="space-y-1">
                  {picked.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText size={12} className="text-primary flex-shrink-0" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button className="btn-ghost w-full mt-6" onClick={onClose}>
              Fechar
            </button>
          </motion.div>
        ) : (
          /* Form state */
          <>
            <div className="flex-1 space-y-5">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Candidato</span>
                <select className="input" value={cand} onChange={(e) => setCand(e.target.value)}>
                  {candidates.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Documentos ({picked.length} selecionados)
                </span>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {docTypes.map((d) => {
                    const sel = picked.includes(d);
                    return (
                      <label
                        key={d}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          sel
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-surface hover:border-primary/30 text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={(e) => setPicked(e.target.checked ? [...picked, d] : picked.filter((x) => x !== d))}
                          className="accent-primary w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-sm font-medium">{d}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-border">
              <button
                className="btn-primary w-full inline-flex items-center justify-center gap-2 h-12"
                disabled={picked.length === 0 || loading}
                onClick={handleSend}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? "Enviando..." : `Solicitar ${picked.length > 0 ? `(${picked.length})` : ""}`}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
