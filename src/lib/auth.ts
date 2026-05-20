import { supabase } from "@/integrations/supabase/client";

export const MASTER_EMAIL = "igorrafaeljunior@gmail.com";

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'recruiter' | 'colaborador';
  full_name: string | null;
  is_master: boolean;
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

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: isMaster ? 'admin' : ((profile?.role === 'admin' || profile?.role === 'recruiter') ? profile.role : 'recruiter'),
      full_name: profile?.full_name || null,
      is_master: isMaster,
    };
  },
  async signIn(email: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return !error;
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options
    });
    
    if (error) throw error;
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
