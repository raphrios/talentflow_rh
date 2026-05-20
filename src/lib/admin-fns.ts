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

type CreateRecruiterInput = {
  email: string;
  password: string;
  full_name: string;
  role: string;
};

type UpdateRecruiterInput = {
  user_id: string;
  full_name: string;
  role: string;
};

type DeleteRecruiterInput = {
  user_id: string;
};

export const createRecruiterFn = createServerFn(
  "POST",
  async (data: CreateRecruiterInput) => {
    const admin = getAdminClient();

    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    if (authErr || !created?.user) {
      const msg = authErr?.message || "Erro ao criar usuário";
      const isDuplicate =
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("duplicate");
      return {
        success: false as const,
        error: isDuplicate ? "Este e-mail já está cadastrado." : msg,
      };
    }

    const { error: profileErr } = await admin
      .from("profiles")
      .upsert({ id: created.user.id, full_name: data.full_name, role: data.role, email: data.email });

    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { success: false as const, error: profileErr.message };
    }

    return { success: true as const, user_id: created.user.id };
  }
);

export const updateRecruiterFn = createServerFn(
  "POST",
  async (data: UpdateRecruiterInput) => {
    const admin = getAdminClient();

    const { error } = await admin
      .from("profiles")
      .update({ full_name: data.full_name, role: data.role })
      .eq("id", data.user_id);

    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  }
);

export const deleteRecruiterFn = createServerFn(
  "POST",
  async (data: DeleteRecruiterInput) => {
    const admin = getAdminClient();

    try {
      // 1. Limpa recruiter_id em profiles que referenciam este usuário
      const { error: e1 } = await admin
        .from("profiles")
        .update({ recruiter_id: null })
        .eq("recruiter_id", data.user_id);
      if (e1) return { success: false as const, error: `[step1-clear-recruiter_id] ${e1.message}` };

      // 2. Remove o perfil do próprio usuário
      const { error: e2 } = await admin
        .from("profiles")
        .delete()
        .eq("id", data.user_id);
      if (e2) return { success: false as const, error: `[step2-delete-profile] ${e2.message}` };

      // 3. Remove o usuário do auth (tokens cascade automaticamente)
      const { error: e3 } = await admin.auth.admin.deleteUser(data.user_id);
      if (e3) {
        const notFound =
          e3.message.toLowerCase().includes("not found") ||
          e3.message.toLowerCase().includes("user not found");
        if (!notFound) {
          return { success: false as const, error: `[step3-delete-auth] ${e3.message}` };
        }
      }

      return { success: true as const };
    } catch (err: any) {
      return { success: false as const, error: `[exception] ${err?.message ?? "unknown"}` };
    }
  }
);
