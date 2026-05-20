import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Candidate, CandidateStatus, DiscScores, BigFive } from "@/lib/mock-data";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) return null;
      
      // Garantir que o email master sempre tenha acesso admin
      const role = user.email?.toLowerCase() === 'igorrafaeljunior@gmail.com' ? 'admin' : data.role;
      
      return { ...data, role, email: user.email };
    },
  });
}

export function useCandidates() {
  return useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select(`
          *,
          assessments (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((c: any) => {
        const assessment = c.assessments?.[0];
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          position: c.position,
          department: c.department,
          testDate: c.created_at,
          status: c.status as CandidateStatus,
          dominant: assessment?.dominant_trait || null,
          dominantLabel: assessment?.dominant_trait ? getDiscLabel(assessment.dominant_trait) : "Não avaliado",
          score: assessment?.compatibility_score || 0,
          disc: (assessment?.disc_scores as unknown as DiscScores) || { D: 0, I: 0, S: 0, C: 0 },
          bigFive: (assessment?.big_five_scores as unknown as BigFive) || { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
          token: c.token,
          compatibility: assessment?.compatibility_score || 0,
          whatsappSentAt: c.whatsapp_sent_at,
          whatsappError: c.whatsapp_error,
        };
      });
    },
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["candidates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select(`
          *,
          assessments (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      const assessment = data.assessments?.[0];
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        testDate: data.created_at,
        status: data.status as CandidateStatus,
        dominant: assessment?.dominant_trait || null,
        dominantLabel: assessment?.dominant_trait ? getDiscLabel(assessment.dominant_trait) : "Não avaliado",
        score: assessment?.compatibility_score || 0,
        disc: (assessment?.disc_scores as unknown as DiscScores) || { D: 0, I: 0, S: 0, C: 0 },
        bigFive: (assessment?.big_five_scores as unknown as BigFive) || { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
        token: data.token,
        compatibility: assessment?.compatibility_score || 0,
        whatsappSentAt: data.whatsapp_sent_at,
        whatsappError: data.whatsapp_error,
      };
    },
    enabled: !!id,
  });
}

export function useProcesses() {
  return useQuery({
    queryKey: ["processes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processes")
        .select(`
          *,
          candidates (*)
        `);
      if (error) throw error;
      return data;
    },
  });
}

export function useMeetings() {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select(`
          *,
          candidates (name, position)
        `)
        .order("date", { ascending: true });
      if (error) throw error;
      return data.map((m: any) => ({
        id: m.id,
        candidateId: m.candidate_id,
        candidate: m.candidates.name,
        position: m.candidates.position,
        date: m.date,
        time: m.time,
        type: m.type,
        status: m.status,
        format: m.format,
      }));
    },
  });
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          candidates (name)
        `);
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id,
        candidateId: d.candidate_id,
        candidate: d.candidates?.name ?? "—",
        document: d.name,
        type: d.type,
        requestedAt: d.requested_at,
        status: d.status,
        url: d.url,
      }));
    },
  });
}

function getDiscLabel(trait: string) {
  const labels: Record<string, string> = {
    D: "Dominante",
    I: "Influenciador",
    S: "Estável",
    C: "Conformista",
  };
  return labels[trait] || trait;
}
