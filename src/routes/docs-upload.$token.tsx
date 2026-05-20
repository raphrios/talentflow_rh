import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Upload, FileText, Check, Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/docs-upload/$token")({
  head: () => ({ meta: [{ title: "Envio de Documentos — TalentFlow" }] }),
  component: DocsUploadPage,
});

function DocsUploadPage() {
  const { token } = Route.useParams();
  const [candidate, setCandidate] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: cand, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !cand) {
        setLoading(false);
        return;
      }

      setCandidate(cand);

      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("candidate_id", cand.id)
        .eq("status", "Pendente");

      const pendingDocs = docs || [];
      setDocuments(pendingDocs);

      const initialFiles: Record<string, File | null> = {};
      pendingDocs.forEach((d: any) => { initialFiles[d.id] = null; });
      setFiles(initialFiles);
      setLoading(false);
    }
    load();
  }, [token]);

  async function handleUpload() {
    setUploading(true);
    try {
      for (const doc of documents) {
        const file = files[doc.id];
        if (!file) continue;

        const fileExt = file.name.split(".").pop();
        const fileName = `${candidate.id}/${doc.id}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("candidate-docs")
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          toast.error(`Erro ao enviar ${doc.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("candidate-docs")
          .getPublicUrl(fileName);

        await supabase
          .from("documents")
          .update({ url: publicUrl, status: "Em Análise" })
          .eq("id", doc.id);
      }

      setDone(true);
      toast.success("Documentos enviados com sucesso!");
    } catch {
      toast.error("Erro ao enviar documentos");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold mb-2 gradient-text">Token Inválido</h1>
          <p className="text-muted-foreground mb-4">Este token não existe ou expirou.</p>
          <Link to="/" className="btn-primary inline-block">Voltar para o início</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-revolut w-full max-w-md !p-10 text-center"
        >
          <div className="w-20 h-20 rounded-[24px] bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black mb-2">Documentos enviados!</h2>
          <p className="text-muted-foreground">Seus documentos foram recebidos e estão em análise. Aguarde o contato da equipe.</p>
        </motion.div>
      </div>
    );
  }

  const hasFiles = Object.values(files).some((f) => f !== null);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-[15px] font-medium text-muted hover:text-foreground transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Início
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <Logo size="lg" />
          <h1 className="text-3xl font-black mt-8 mb-2">Envio de Documentos</h1>
          <p className="text-muted-foreground">
            Olá, <strong>{candidate.name}</strong>! Envie os documentos solicitados abaixo.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="card-revolut text-center !p-10">
            <FileText size={48} className="text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">Nenhum documento pendente encontrado para o seu cadastro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card-revolut !p-5 border-2 transition-all ${
                  files[doc.id] ? "border-primary/40 bg-primary/5" : "border-white/5 bg-surface/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      files[doc.id] ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                    }`}>
                      {files[doc.id] ? <Check size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <p className="font-bold">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {files[doc.id] ? files[doc.id]!.name : "Nenhum arquivo selecionado"}
                      </p>
                    </div>
                  </div>
                  <label className="btn-ghost !py-2 !px-4 text-xs cursor-pointer whitespace-nowrap">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFiles((prev) => ({ ...prev, [doc.id]: file }));
                      }}
                    />
                    {files[doc.id] ? "Alterar" : "Upload"}
                  </label>
                </div>
              </motion.div>
            ))}

            <button
              className="btn-primary w-full h-14 !text-[16px] shadow-lg shadow-primary/20 mt-6 flex items-center justify-center gap-2"
              disabled={!hasFiles || uploading}
              onClick={handleUpload}
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              {uploading ? "Enviando..." : "Enviar Documentos"}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Apenas os documentos com arquivo selecionado serão enviados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
