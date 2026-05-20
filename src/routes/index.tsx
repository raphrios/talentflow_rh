import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, BarChart3, Users, Sparkles, ArrowRight, ClipboardCheck, UserPlus, LineChart, Shield, Zap, Globe, MousePointer2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentFlow — Contratações mais inteligentes" },
      { name: "description", content: "Testes comportamentais DISC, análise de personalidade Big Five e gestão de admissão em uma única plataforma." },
    ],
  }),
  component: Landing,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] as any 
    } 
  },
};


function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo />
            <ul className="hidden md:flex items-center gap-8 text-[15px] font-medium text-muted">
              <li><a href="#features" className="hover:text-foreground transition-colors">Produtos</a></li>
              <li><a href="#solutions" className="hover:text-foreground transition-colors">Soluções</a></li>
              <li><a href="#about" className="hover:text-foreground transition-colors">Sobre</a></li>
            </ul>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:inline-flex text-[15px] font-medium text-foreground hover:text-primary transition-colors">Entrar</Link>
            <Link to="/token" className="btn-primary !py-2 !px-6 text-sm">Começar teste</Link>
          </div>
        </nav>
      </header>

      <main className="pt-40">
        {/* Hero Section */}
        <section className="relative px-6 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-8 text-xs font-semibold uppercase tracking-wider text-primary">
                <Zap size={14} fill="currentColor" />
                Nova era do recrutamento
              </div>
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[0.95] mb-8">
                Contratações <br />
                <span className="accent-text">mais inteligentes.</span>
              </h1>
              <p className="mt-8 text-xl text-muted max-w-2xl mx-auto leading-relaxed">
                A plataforma completa para gerenciar talentos com ciência de dados e inteligência comportamental. Do teste ao contrato em um só fluxo.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/token" className="btn-primary !text-lg !px-10 !py-4 shadow-2xl">
                  Criar conta gratuita
                </Link>
                <Link to="/login" className="btn-ghost !text-lg !px-10 !py-4">
                  Falar com especialista
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-24 relative max-w-5xl mx-auto"
            >
              <div className="aspect-video glass rounded-[32px] overflow-hidden shadow-2xl p-4 bg-[#0a0a0a]">
                <div className="w-full h-full rounded-[20px] bg-background flex flex-col border border-white/5 relative group cursor-pointer overflow-hidden">
                  <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between bg-surface/50">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="w-32 h-2 rounded-full bg-white/5" />
                  </div>
                  <div className="flex-1 flex gap-4 p-4">
                    <div className="w-48 flex flex-col gap-3">
                      <div className="h-24 w-full rounded-xl bg-primary/10 border border-primary/20 p-3">
                        <div className="w-12 h-2 rounded-full bg-primary/40 mb-2" />
                        <div className="w-20 h-4 rounded-full bg-primary/20" />
                      </div>
                      <div className="flex-1 rounded-xl bg-white/2 border border-white/5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="h-20 rounded-xl bg-white/5 border border-white/5" />
                        <div className="h-20 rounded-xl bg-white/5 border border-white/5" />
                        <div className="h-20 rounded-xl bg-white/5 border border-white/5" />
                      </div>
                      <div className="flex-1 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-24 h-3 rounded-full bg-white/10" />
                          <div className="w-12 h-3 rounded-full bg-white/5" />
                        </div>
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/5" />
                              <div className="flex-1 h-2 rounded-full bg-white/5" />
                              <div className="w-12 h-2 rounded-full bg-primary/20" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[100px]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[100px]" />
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Uma plataforma,<br />possibilidades infinitas.</h2>
              <p className="text-lg text-muted">Desenvolvemos as ferramentas necessárias para que você tome a melhor decisão, sempre baseada em dados reais.</p>
            </div>
            <Link to="/login" className="btn-ghost group">
              Ver todos os recursos <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Big Bento Item */}
            <motion.div variants={item} className="md:col-span-2 card-revolut flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Brain size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Ciência do Comportamento</h3>
                <p className="text-muted max-w-sm leading-relaxed">
                  Utilizamos modelos psicométricos validados internacionalmente para mapear a cultura e o perfil dos seus candidatos.
                </p>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-card-elevated" />
                  ))}
                </div>
                <div className="text-sm font-medium text-muted">
                  <span className="text-white">+1.2k</span> candidatos avaliados hoje
                </div>
              </div>
            </motion.div>

            {/* Normal Bento Item */}
            <motion.div variants={item} className="card-revolut flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400">
                  <Shield size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Segurança Bancária</h3>
                <p className="text-muted leading-relaxed">
                  Dados protegidos pela LGPD com criptografia de ponta a ponta.
                </p>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-bold text-muted">Certificação ISO</span>
                <Globe size={16} className="text-muted" />
              </div>
            </motion.div>

            <motion.div variants={item} className="card-revolut group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
                <Sparkles size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4">IA Generativa</h3>
              <p className="text-muted leading-relaxed mb-8">
                Receba resumos automáticos sobre a compatibilidade do candidato com a vaga.
              </p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-purple-500 rounded-full" />
              </div>
            </motion.div>

            <motion.div variants={item} className="md:col-span-2 card-revolut flex flex-col md:flex-row items-center gap-12 group overflow-hidden">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Controle total na palma da mão</h3>
                <p className="text-muted leading-relaxed">
                  Gerencie processos, agende reuniões e envie documentos com um clique. Acompanhe tudo em tempo real.
                </p>
                <div className="mt-8 flex gap-3">
                  <div className="badge border border-primary/20 bg-primary/5 text-primary">Web</div>
                  <div className="badge border border-white/10 bg-white/5 text-muted">Mobile em breve</div>
                </div>
              </div>
              <div className="w-full md:w-64 h-48 rounded-2xl glass p-4 flex flex-col gap-3 group-hover:scale-105 transition-transform">
                {[1,2,3].map(i => (
                  <div key={i} className="h-10 w-full bg-white/5 rounded-lg border border-white/5" />
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Global Reach Section */}
        <section id="solutions" className="bg-surface py-32 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">Mude a forma como <br />sua empresa contrata.</h2>
              <div className="space-y-8">
                {[
                  { title: "Escalabilidade", desc: "Avalie mil candidatos com a mesma precisão de um.", icon: Zap },
                  { title: "Diversidade", desc: "Reduza vieses inconscientes com avaliações baseadas em dados.", icon: Users },
                  { title: "Performance", desc: "Candidatos que perfomam melhor desde o primeiro dia.", icon: LineChart },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-14 h-14 shrink-0 rounded-2xl glass flex items-center justify-center text-primary">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square glass rounded-[40px] overflow-hidden p-8 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-8 animate-pulse">
                  <Globe size={40} className="text-primary" />
                </div>
                <div className="text-6xl font-extrabold mb-4">30+</div>
                <div className="text-lg text-muted font-medium">Países utilizando <br />nossa metodologia comportamental</div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-[120px] rounded-full" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-32 text-center">
          <div className="card-revolut !p-20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <h2 className="text-4xl md:text-6xl font-bold mb-8 relative z-10">Pronto para transformar seu RH?</h2>
            <p className="text-xl text-muted mb-12 max-w-2xl mx-auto relative z-10">
              Junte-se a centenas de empresas que já estão contratando melhor com o TalentFlow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/token" className="btn-primary !text-lg !px-12 !py-4 shadow-xl">
                Começar agora
              </Link>
              <Link to="/login" className="btn-ghost !text-lg !px-12 !py-4">
                Ver demonstração
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 pb-20 pt-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-8 text-lg text-muted max-w-sm">
              Inovação psicométrica para o RH do futuro. Dados que transformam carreiras e empresas.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-8">Navegação</h4>
            <ul className="space-y-4 text-muted font-medium">
              <li><a href="#" className="hover:text-primary transition-colors">Produtos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-8">Legal</h4>
            <ul className="space-y-4 text-muted font-medium">
              <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-32 flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5 text-sm text-muted font-medium">
          <div>© 2026 TalentFlow Ltd.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

