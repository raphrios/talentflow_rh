import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("Admin credentials missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const APIRoute = createAPIFileRoute("/api/admin")({
  POST: async ({ request }) => {
    const json = await request.json().catch(() => ({}));
    const { action, ...payload } = json as any;

    try {
      const admin = getAdmin();

      /* ── CREATE ─────────────────────────────────────────── */
      if (action === "create_recruiter") {
        const { email, password, full_name, role } = payload;

        const { data: created, error: authErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });

        if (authErr || !created?.user) {
          const msg = authErr?.message ?? "Erro ao criar usuário";
          const isDup = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate");
          return ok({ success: false, error: isDup ? "Este e-mail já está cadastrado." : msg });
        }

        const { error: pErr } = await admin
          .from("profiles")
          .upsert({ id: created.user.id, full_name, role, email });

        if (pErr) {
          await admin.auth.admin.deleteUser(created.user.id);
          return ok({ success: false, error: pErr.message });
        }

        return ok({ success: true, user_id: created.user.id });
      }

      /* ── UPDATE ─────────────────────────────────────────── */
      if (action === "update_recruiter") {
        const { user_id, full_name, role } = payload;
        const { error } = await admin.from("profiles").update({ full_name, role }).eq("id", user_id);
        if (error) return ok({ success: false, error: error.message });
        return ok({ success: true });
      }

      /* ── DELETE ─────────────────────────────────────────── */
      if (action === "delete_recruiter") {
        const { user_id } = payload;

        // 1. limpa recruiter_id nos profiles que apontam para este user
        const { error: e1 } = await admin
          .from("profiles")
          .update({ recruiter_id: null })
          .eq("recruiter_id", user_id);
        if (e1) return ok({ success: false, error: `clear recruiter_id: ${e1.message}` });

        // 2. remove o perfil do usuário
        const { error: e2 } = await admin.from("profiles").delete().eq("id", user_id);
        if (e2) return ok({ success: false, error: `delete profile: ${e2.message}` });

        // 3. remove do auth (recruitment_tokens cascadeiam)
        const { error: e3 } = await admin.auth.admin.deleteUser(user_id);
        if (e3) {
          const notFound = e3.message.toLowerCase().includes("not found");
          if (!notFound) return ok({ success: false, error: `delete auth: ${e3.message}` });
        }

        return ok({ success: true });
      }

      return ok({ success: false, error: "Ação desconhecida" });
    } catch (err: any) {
      return ok({ success: false, error: err?.message ?? "Erro interno no servidor" });
    }
  },
});

function ok(body: object) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}
