import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Supabase admin credentials not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const createRecruiterFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string; full_name: string; role: string }) => data)
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    // Create auth user
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    if (authErr || !created?.user) {
      const msg = authErr?.message || "Erro ao criar usuário";
      const isDuplicate = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate");
      return {
        success: false as const,
        error: isDuplicate ? "Este e-mail já está cadastrado." : msg,
      };
    }

    // Upsert profile
    const { error: profileErr } = await admin
      .from("profiles")
      .upsert({ id: created.user.id, full_name: data.full_name, role: data.role, email: data.email });

    if (profileErr) {
      // Rollback auth user
      await admin.auth.admin.deleteUser(created.user.id);
      return { success: false as const, error: profileErr.message };
    }

    return { success: true as const, user_id: created.user.id };
  });

export const deleteRecruiterFn = createServerFn({ method: "POST" })
  .validator((data: { user_id: string }) => data)
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    const { error: profileErr } = await admin.from("profiles").delete().eq("id", data.user_id);
    if (profileErr) return { success: false as const, error: profileErr.message };

    const { error: authErr } = await admin.auth.admin.deleteUser(data.user_id);
    if (authErr) return { success: false as const, error: authErr.message };

    return { success: true as const };
  });
