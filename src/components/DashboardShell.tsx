import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, Users, Calendar, FileText, Settings, Search, Bell, LogOut, Menu, ChevronRight, ShieldCheck, KeyRound, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { auth, type UserProfile } from "@/lib/auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

export function DashboardShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    auth.getProfile().then(setProfile);
  }, []);

  const navItems = profile?.role === 'colaborador' 
    ? [
        { to: "/dashboard", label: "Meus Testes", icon: LayoutDashboard, exact: true },
        { to: "/dashboard/documents", label: "Enviar Documentos", icon: FileText },
      ]
    : [
        { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, exact: true },
        { to: "/dashboard/processes", label: "Admissão", icon: Briefcase },
        { to: "/dashboard/candidates", label: "Talentos", icon: Users },
        { to: "/dashboard/meetings", label: "Agenda", icon: Calendar },
        { to: "/dashboard/documents", label: "Documentos", icon: FileText },
      ];

  if (profile?.is_master) {
    navItems.push({ to: "/dashboard/recruiters", label: "Recrutadores", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:sticky top-0 z-50 h-screen w-72 flex flex-col
        bg-surface border-r border-border transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-20 px-8 flex items-center shrink-0">
          <Logo />
        </div>
        
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-8">
          <div>
            <div className="px-4 mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Menu Principal</div>
            <nav className="space-y-1">
              {navItems.map((n) => {
                const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                return (
                  <Link 
                    key={n.to} 
                    to={n.to as any} 
                    onClick={() => setMobileOpen(false)}
                    className={`
                      group flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-bold transition-all
                      ${active
                        ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(0,212,170,0.2)]"
                        : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <n.icon size={20} className={active ? "text-current" : "group-hover:text-primary transition-colors"} />
                      <span>{n.label}</span>
                    </div>
                    {active && <ChevronRight size={16} />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-4 mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Sistema</div>
            <nav className="space-y-1">
              <Link 
                to="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all
                  ${pathname === "/dashboard/settings" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"}
                `}
              >
                <Settings size={20} />
                <span>Configurações</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-bold text-xs">
              {profile?.full_name?.substring(0, 2).toUpperCase() || "US"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">{profile?.full_name || "Usuário"}</div>
              <div className="text-[11px] text-muted-foreground truncate">{profile?.email}</div>
            </div>
          </div>
          <button 
            onClick={async () => { await auth.signOut(); toast.success("Até breve!"); navigate({ to: "/login" }); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={20} /> Sair da conta
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 glass-strong h-20 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-black tracking-tight">{title ?? "Visão Geral"}</h1>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative hidden md:block">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                className="input pl-12 w-80 !bg-surface !border-white/5" 
                placeholder="Pesquisar em todo o TalentFlow..." 
              />
            </div>
            
            <button
              className="theme-toggle"
              onClick={toggle}
              title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            >
              <motion.div
                key={theme}
                initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </motion.div>
            </button>

            <button className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface" />
            </button>

            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="text-right hidden sm:block">
                <div className="text-[14px] font-bold">Admin TalentFlow</div>
                <div className="text-[12px] text-muted-foreground">{profile?.role === 'admin' ? 'Acesso Admin' : 'Recrutador'}</div>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-blue-500 p-0.5">
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center font-bold text-sm">
                  {profile?.full_name?.substring(0, 2).toUpperCase() || "AD"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}


