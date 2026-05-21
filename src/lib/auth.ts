import { supabase } from "@/integrations/supabase/client";

export const MASTER_EMAIL = "igorrafaeljunior@gmail.com";

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'recruiter' | 'colaborador';
  full_name: string | null;
  is_master: boolean;
  is_blocked: boolean;
}

export const auth = {
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
  async isAuthed(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  },
  async getProfile(): Promise<UserProfile | null> {
    const session = await this.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const isMaster = session.user.email?.toLowerCase() === MASTER_EMAIL.toLowerCase();
    const isBlocked = session.user.app_metadata?.blocked === true;

    // Bloqueia acesso ao dashboard se conta estiver suspensa (exceto master)
    if (isBlocked && !isMaster) {
      await supabase.auth.signOut();
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: isMaster ? 'admin' : ((profile?.role === 'admin' || profile?.role === 'recruiter') ? profile.role : 'recruiter'),
      full_name: profile?.full_name || null,
      is_master: isMaster,
      is_blocked: isBlocked,
    };
  },
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      // Verifica bloqueio APÓS login bem-sucedido
      if (data?.user?.app_metadata?.blocked === true) {
        await supabase.auth.signOut();
        return { success: false, error: "⚠️ Acesso bloqueado por inadimplência. Entre em contato com o administrador." };
      }
      return { success: true };
    }

    // Traduz erros comuns do Supabase para português
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed"))
      return { success: false, error: "E-mail não confirmado. Verifique sua caixa de entrada." };
    if (msg.includes("invalid login") || msg.includes("invalid credentials"))
      return { success: false, error: "E-mail ou senha incorretos." };
    if (msg.includes("too many requests") || msg.includes("rate limit"))
      return { success: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
    if (msg.includes("user not found"))
      return { success: false, error: "Nenhuma conta encontrada com este e-mail." };

    return { success: false, error: error.message };
  },
  async signUp(email: string, password: string, role: 'recruiter' | 'colaborador' = 'recruiter', token?: string): Promise<boolean> {
    const options: any = {
      data: {
        role,
      }
    };

    if (role === 'colaborador') {
      if (!token) throw new Error("Token de recrutador é obrigatório para colaboradores.");
      
      // Verify token
      const { data: tokenData, error: tokenError } = await supabase
        .from('recruitment_tokens')
        .select('recruiter_id')
        .eq('token', token.toUpperCase())
        .eq('is_active', true)
        .single();

      if (tokenError || !tokenData) {
        throw new Error("Token de recrutador inválido ou expirado.");
      }
      
      options.data.recruiter_id = tokenData.recruiter_id;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });

    if (error) throw error;

    // Pede ao servidor para confirmar o email imediatamente
    // (evita que o usuário precise verificar o email para logar)
    if (signUpData?.user?.id) {
      try {
        await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm_email", user_id: signUpData.user.id }),
        });
      } catch { /* silently ignore — user can still confirm via email */ }
    }

    return true;
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  },
};
