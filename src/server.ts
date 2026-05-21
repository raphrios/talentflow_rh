import "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { consumeLastCapturedError } from "./lib/error-capture";
import { createClient } from "@supabase/supabase-js";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as any).default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("Admin credentials missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function handleAdminAPI(request: Request): Promise<Response> {
  let payload: any = {};
  try { payload = await request.json(); } catch { return json({ success: false, error: "Invalid JSON" }, 400); }

  const { action, ...data } = payload;

  try {
    const admin = getAdmin();

    /* CREATE */
    if (action === "create_recruiter") {
      const { email, password, full_name, role } = data;

      // Valida senha mínima (Supabase exige >= 6 caracteres por padrão)
      if (!password || password.length < 6)
        return json({ success: false, error: "A senha deve ter pelo menos 6 caracteres." });

      const { data: created, error: authErr } = await admin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,       // marca email como confirmado
        user_metadata: { full_name },
      });
      if (authErr || !created?.user) {
        const msg = authErr?.message ?? "Erro ao criar usuário";
        const isDup = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate");
        return json({ success: false, error: isDup ? "Este e-mail já está cadastrado." : msg });
      }

      // Força confirmação de email via updateUser como dupla garantia
      await admin.auth.admin.updateUserById(created.user.id, {
        email_confirm: true,
      });

      const { error: pErr } = await admin.from("profiles")
        .upsert({ id: created.user.id, full_name, role, email: email.trim().toLowerCase() });
      if (pErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ success: false, error: pErr.message });
      }
      return json({ success: true, user_id: created.user.id });
    }

    /* CONFIRM EMAIL */
    if (action === "confirm_email") {
      const { user_id } = data;
      await admin.auth.admin.updateUserById(user_id, { email_confirm: true });
      return json({ success: true });
    }

    /* BLOCK / UNBLOCK */
    if (action === "block_user" || action === "unblock_user") {
      const { user_id } = data;
      const blocked = action === "block_user";
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        app_metadata: { blocked },
      });
      if (error) return json({ success: false, error: error.message });
      return json({ success: true, blocked });
    }

    /* LIST USERS WITH BLOCKED STATUS */
    if (action === "list_users") {
      const { data: profiles, error: pErr } = await admin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (pErr) return json({ success: false, error: pErr.message });

      // busca app_metadata de cada user via admin API
      const usersWithStatus = await Promise.all(
        (profiles ?? []).map(async (p: any) => {
          try {
            const { data: u } = await admin.auth.admin.getUserById(p.id);
            return { ...p, blocked: u?.user?.app_metadata?.blocked === true };
          } catch {
            return { ...p, blocked: false };
          }
        })
      );
      return json({ success: true, users: usersWithStatus });
    }

    /* UPDATE */
    if (action === "update_recruiter") {
      const { user_id, full_name, role } = data;
      const { error } = await admin.from("profiles").update({ full_name, role }).eq("id", user_id);
      if (error) return json({ success: false, error: error.message });
      return json({ success: true });
    }

    /* DELETE */
    if (action === "delete_recruiter") {
      const { user_id } = data;

      // 1. limpa FK recruiter_id nos profiles dependentes (sem ON DELETE CASCADE)
      const { error: e1 } = await admin.from("profiles")
        .update({ recruiter_id: null })
        .eq("recruiter_id", user_id);
      if (e1) return json({ success: false, error: `clear recruiter_id: ${e1.message}` });

      // 2. remove o perfil do próprio usuário
      const { error: e2 } = await admin.from("profiles").delete().eq("id", user_id);
      if (e2) return json({ success: false, error: `delete profile: ${e2.message}` });

      // 3. remove o auth user (recruitment_tokens cascadeiam automaticamente)
      const { error: e3 } = await admin.auth.admin.deleteUser(user_id);
      if (e3) {
        const notFound = e3.message.toLowerCase().includes("not found");
        if (!notFound) return json({ success: false, error: `delete auth: ${e3.message}` });
      }

      return json({ success: true });
    }

    return json({ success: false, error: "Ação desconhecida" });
  } catch (err: any) {
    console.error("[admin-api]", err);
    return json({ success: false, error: err?.message ?? "Erro interno" });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Intercepta /api/admin antes do TanStack Start
    const url = new URL(request.url);
    if (url.pathname === "/api/admin" && request.method === "POST") {
      return handleAdminAPI(request);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
