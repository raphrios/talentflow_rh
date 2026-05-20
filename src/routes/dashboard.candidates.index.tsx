import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useCandidates } from "@/hooks/use-talent-flow";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/candidates/")({
  component: CandidatesList,
});

const STATUS_STYLE: Record<string, string> = {
  "Concluído":  "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30",
  "Pendente":   "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  "Em Análise": "bg-blue-500/10 text-blue-400 border border-blue-500/30",
};

function CandidatesList() {
  const [q, setQ] = useState("");
  const { data: candidates = [], isLoading } = useCandidates();
  const filtered = candidates.filter((c) =>
    [c.name, c.email, c.position].some((s) => s?.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <DashboardShell title="Talentos">
      <div className="card-revolut overflow-hidden">
        {/* Search bar */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              className="input h-10"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Buscar por nome, cargo, e-mail…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {filtered.length} candidato(s)
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-surface/50">
                <th className="py-4 pl-6 font-bold uppercase tracking-wider">Candidato</th>
                <th className="py-4 font-bold uppercase tracking-wider hidden md:table-cell">Cargo</th>
                <th className="py-4 font-bold uppercase tracking-wider">Status</th>
                <th className="py-4 font-bold uppercase tracking-wider hidden lg:table-cell">Perfil DISC</th>
                <th className="py-4 font-bold uppercase tracking-wider hidden lg:table-cell">Score</th>
                <th className="py-4 font-bold uppercase tracking-wider hidden lg:table-cell">Compat.</th>
                <th className="py-4 pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-8 bg-surface rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-muted-foreground text-sm opacity-50">
                    Nenhum candidato encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/60 transition-colors group">
                    <td className="py-4 pl-6">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="py-4 text-muted-foreground hidden md:table-cell">{c.position}</td>
                    <td className="py-4">
                      <span className={`badge ${STATUS_STYLE[c.status] ?? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 hidden lg:table-cell">
                      <span className="badge bg-primary/10 text-primary border border-primary/30">
                        {c.dominantLabel}
                      </span>
                    </td>
                    <td className="py-4 font-semibold hidden lg:table-cell">{c.score || "—"}</td>
                    <td className="py-4 hidden lg:table-cell">{c.compatibility ? `${c.compatibility}%` : "—"}</td>
                    <td className="py-4 pr-6 text-right">
                      <Link
                        to="/dashboard/candidates/$id"
                        params={{ id: c.id }}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Ver detalhes →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
