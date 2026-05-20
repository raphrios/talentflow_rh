import { createRootRoute, Outlet, HeadContent, Scripts, useRouter, Link, useRouterState } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../styles.css";

const queryClient = new QueryClient();

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-6 text-center max-w-md">
        <h1 className="text-xl font-semibold mb-2">Algo deu errado</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <div className="flex gap-2 justify-center">
          <button className="btn-primary" onClick={() => router.invalidate()}>Tentar novamente</button>
          <Link to="/" className="btn-ghost">Início</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TalentFlow — Sistema de Gestão de RH" },
      { name: "description", content: "Plataforma de testes comportamentais, análise de personalidade e gestão de admissão." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" },
    ],
  }),
  scripts: () => [
    {
      // Prevent flash of wrong theme — runs before React hydrates
      children: `(function(){var t=localStorage.getItem('talentflow-theme');if(t==='light'){document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');}})();`,
    },
  ],
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold mb-2 gradient-text">404</h1>
        <p className="text-muted-foreground mb-4">Página não encontrada.</p>
        <Link to="/" className="btn-primary inline-block">Voltar para o início</Link>
      </div>
    </div>
  ),
});

function RootComponent() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [isNavigating, setIsNavigating] = useState(false);
  const routerState = useRouterState();

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AnimatedBackground />
          <AnimatePresence mode="wait">
            {isNavigating && <LoadingOverlay key="loading" />}
          </AnimatePresence>
          
          <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-screen"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </QueryClientProvider>
        
        <Toaster
          position="top-right"
          theme="system"
          richColors 
          toastOptions={{
            style: {
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
            }
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
