export type DiscProfile = "D" | "I" | "S" | "C";
export type CandidateStatus = "Concluído" | "Pendente" | "Em Análise";

export interface DiscScores { D: number; I: number; S: number; C: number; }
export interface BigFive {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  testDate: string;
  status: CandidateStatus;
  dominant: DiscProfile | null;
  dominantLabel: string;
  score: number;
  disc: DiscScores;
  bigFive: BigFive;
  token: string;
  compatibility: number;
  whatsappSentAt?: string | null;
  whatsappError?: string | null;
}

const profileLabel: Record<DiscProfile, string> = {
  D: "Dominante",
  I: "Influenciador",
  S: "Estável",
  C: "Conformista",
};

export const VALID_TOKENS = ["482910", "731042", "295847"];

export const candidates: Candidate[] = [
  {
    id: "c-001", name: "Mariana Oliveira", email: "mariana.oliveira@email.com",
    phone: "(11) 98765-4321", position: "Desenvolvedora Front-end Senior",
    department: "Tecnologia", testDate: "2026-05-12", status: "Concluído",
    dominant: "I", dominantLabel: profileLabel.I, score: 87,
    disc: { D: 22, I: 38, S: 25, C: 15 },
    bigFive: { openness: 82, conscientiousness: 78, extraversion: 74, agreeableness: 81, neuroticism: 32 },
    token: "482910", compatibility: 87,
  },
  {
    id: "c-002", name: "Rafael Cardoso", email: "rafael.cardoso@email.com",
    phone: "(21) 99876-1122", position: "Gerente de Produto",
    department: "Produto", testDate: "2026-05-14", status: "Em Análise",
    dominant: "D", dominantLabel: profileLabel.D, score: 92,
    disc: { D: 42, I: 28, S: 18, C: 12 },
    bigFive: { openness: 75, conscientiousness: 88, extraversion: 70, agreeableness: 62, neuroticism: 28 },
    token: "731042", compatibility: 81,
  },
  {
    id: "c-003", name: "Beatriz Almeida", email: "beatriz.almeida@email.com",
    phone: "(31) 91234-5678", position: "Analista de RH",
    department: "Recursos Humanos", testDate: "2026-05-10", status: "Concluído",
    dominant: "S", dominantLabel: profileLabel.S, score: 80,
    disc: { D: 15, I: 24, S: 41, C: 20 },
    bigFive: { openness: 68, conscientiousness: 82, extraversion: 55, agreeableness: 90, neuroticism: 40 },
    token: "295847", compatibility: 90,
  },
  {
    id: "c-004", name: "Lucas Pereira", email: "lucas.pereira@email.com",
    phone: "(41) 99888-7766", position: "Engenheiro de Dados",
    department: "Tecnologia", testDate: "2026-05-15", status: "Pendente",
    dominant: "C", dominantLabel: profileLabel.C, score: 0,
    disc: { D: 18, I: 14, S: 26, C: 42 },
    bigFive: { openness: 70, conscientiousness: 92, extraversion: 42, agreeableness: 70, neuroticism: 25 },
    token: "551239", compatibility: 0,
  },
  {
    id: "c-005", name: "Camila Souza", email: "camila.souza@email.com",
    phone: "(51) 98123-4455", position: "Designer de Produto",
    department: "Design", testDate: "2026-05-13", status: "Concluído",
    dominant: "I", dominantLabel: profileLabel.I, score: 85,
    disc: { D: 20, I: 40, S: 28, C: 12 },
    bigFive: { openness: 90, conscientiousness: 72, extraversion: 80, agreeableness: 78, neuroticism: 35 },
    token: "118827", compatibility: 84,
  },
  {
    id: "c-006", name: "Pedro Henrique Lima", email: "pedro.lima@email.com",
    phone: "(85) 99777-3322", position: "Coordenador Comercial",
    department: "Vendas", testDate: "2026-05-11", status: "Em Análise",
    dominant: "D", dominantLabel: profileLabel.D, score: 78,
    disc: { D: 40, I: 32, S: 16, C: 12 },
    bigFive: { openness: 65, conscientiousness: 70, extraversion: 88, agreeableness: 60, neuroticism: 38 },
    token: "338201", compatibility: 76,
  },
  {
    id: "c-007", name: "Juliana Martins", email: "juliana.martins@email.com",
    phone: "(11) 99654-7788", position: "Analista Financeiro Pleno",
    department: "Financeiro", testDate: "2026-05-09", status: "Concluído",
    dominant: "C", dominantLabel: profileLabel.C, score: 89,
    disc: { D: 16, I: 18, S: 28, C: 38 },
    bigFive: { openness: 60, conscientiousness: 94, extraversion: 50, agreeableness: 75, neuroticism: 30 },
    token: "778893", compatibility: 88,
  },
  {
    id: "c-008", name: "Thiago Ribeiro", email: "thiago.ribeiro@email.com",
    phone: "(48) 99211-3344", position: "Tech Lead Mobile",
    department: "Tecnologia", testDate: "2026-05-16", status: "Pendente",
    dominant: "D", dominantLabel: profileLabel.D, score: 0,
    disc: { D: 36, I: 24, S: 22, C: 18 },
    bigFive: { openness: 80, conscientiousness: 84, extraversion: 68, agreeableness: 66, neuroticism: 30 },
    token: "664428", compatibility: 0,
  },
];

export const discQuestions = [
  { id: 1, q: "Em uma situação de pressão no trabalho, eu tendo a:", options: [
    { label: "Tomar a frente e decidir rapidamente", value: "D" },
    { label: "Motivar a equipe a encontrar soluções", value: "I" },
    { label: "Manter a calma e seguir o plano", value: "S" },
    { label: "Analisar cuidadosamente todas as opções", value: "C" },
  ]},
  { id: 2, q: "Diante de um conflito com um colega, prefiro:", options: [
    { label: "Confrontar diretamente o problema", value: "D" },
    { label: "Buscar uma conversa aberta e amigável", value: "I" },
    { label: "Mediar buscando harmonia", value: "S" },
    { label: "Apresentar fatos e dados", value: "C" },
  ]},
  { id: 3, q: "Ao iniciar um novo projeto, minha prioridade é:", options: [
    { label: "Definir metas e prazos agressivos", value: "D" },
    { label: "Envolver e entusiasmar as pessoas", value: "I" },
    { label: "Garantir estabilidade no processo", value: "S" },
    { label: "Documentar requisitos com precisão", value: "C" },
  ]},
  { id: 4, q: "Trabalhando em equipe, eu costumo:", options: [
    { label: "Assumir a liderança naturalmente", value: "D" },
    { label: "Comunicar e inspirar", value: "I" },
    { label: "Apoiar e cooperar", value: "S" },
    { label: "Verificar qualidade e padrões", value: "C" },
  ]},
  { id: 5, q: "Diante de uma mudança inesperada:", options: [
    { label: "Reajo rápido e busco oportunidades", value: "D" },
    { label: "Adapto e envolvo o time", value: "I" },
    { label: "Prefiro estabilidade e preparo", value: "S" },
    { label: "Avalio riscos antes de agir", value: "C" },
  ]},
  { id: 6, q: "Em reuniões, eu geralmente:", options: [
    { label: "Direciono a discussão para decisões", value: "D" },
    { label: "Trago energia e ideias", value: "I" },
    { label: "Escuto antes de falar", value: "S" },
    { label: "Aponto dados e análises", value: "C" },
  ]},
  { id: 7, q: "Minha forma de aprender é:", options: [
    { label: "Fazendo e errando rápido", value: "D" },
    { label: "Em grupo, trocando experiências", value: "I" },
    { label: "Com método e tempo", value: "S" },
    { label: "Estudando a fundo a teoria", value: "C" },
  ]},
  { id: 8, q: "Sob pressão de prazo, eu:", options: [
    { label: "Acelero e cobro resultados", value: "D" },
    { label: "Motivo o time a entregar juntos", value: "I" },
    { label: "Mantenho consistência no ritmo", value: "S" },
    { label: "Reviso para evitar erros", value: "C" },
  ]},
  { id: 9, q: "Ao receber feedback negativo:", options: [
    { label: "Encaro como desafio para melhorar", value: "D" },
    { label: "Procuro entender o lado emocional", value: "I" },
    { label: "Reflito calmamente antes de agir", value: "S" },
    { label: "Analiso ponto a ponto", value: "C" },
  ]},
  { id: 10, q: "Em um ambiente novo, eu:", options: [
    { label: "Tomo iniciativa logo", value: "D" },
    { label: "Faço amizades rapidamente", value: "I" },
    { label: "Observo antes de me envolver", value: "S" },
    { label: "Estudo as regras e processos", value: "C" },
  ]},
  { id: 11, q: "Para tomar uma decisão importante:", options: [
    { label: "Confio no instinto e ajo", value: "D" },
    { label: "Consulto pessoas próximas", value: "I" },
    { label: "Pondero impactos de longo prazo", value: "S" },
    { label: "Levanto evidências e dados", value: "C" },
  ]},
  { id: 12, q: "Meu maior diferencial profissional é:", options: [
    { label: "Foco em resultado", value: "D" },
    { label: "Relacionamento e comunicação", value: "I" },
    { label: "Lealdade e consistência", value: "S" },
    { label: "Precisão e qualidade", value: "C" },
  ]},
];

export const bigFiveQuestions = [
  { id: 1, q: "Gosto de explorar ideias novas e abstratas.", trait: "openness" },
  { id: 2, q: "Sou organizado e cumpro prazos com disciplina.", trait: "conscientiousness" },
  { id: 3, q: "Sinto-me confortável em situações sociais.", trait: "extraversion" },
  { id: 4, q: "Costumo confiar nas pessoas e ajudar quando posso.", trait: "agreeableness" },
  { id: 5, q: "Preocupo-me frequentemente com situações futuras.", trait: "neuroticism" },
  { id: 6, q: "Tenho curiosidade sobre arte, ciência e cultura.", trait: "openness" },
  { id: 7, q: "Sigo planos com atenção aos detalhes.", trait: "conscientiousness" },
  { id: 8, q: "Tomo a iniciativa em conversas e reuniões.", trait: "extraversion" },
  { id: 9, q: "Evito conflitos e busco harmonia no time.", trait: "agreeableness" },
  { id: 10, q: "Mudanças bruscas me deixam ansioso.", trait: "neuroticism" },
];

// ── IT Test ───────────────────────────────────────────────────────────────────

export type ITDifficulty = "easy" | "medium" | "advanced";

export interface ITQuestion {
  id: number;
  q: string;
  options: string[];
  correct: number; // 0-indexed
}

export const itQuestions: Record<ITDifficulty, ITQuestion[]> = {
  easy: [
    { id: 1, q: "Qual atalho de teclado é usado para copiar um texto?", options: ["CTRL+X", "CTRL+C", "CTRL+V", "CTRL+Z"], correct: 1 },
    { id: 2, q: "O que significa 'Salvar Como' em um editor de texto?", options: ["Apagar o arquivo atual", "Criar uma cópia com novo nome ou local", "Enviar por e-mail", "Imprimir o documento"], correct: 1 },
    { id: 3, q: "O que é um navegador de internet?", options: ["Um antivírus", "Um programa para editar fotos", "Um programa para acessar sites", "Um sistema operacional"], correct: 2 },
    { id: 4, q: "Para que serve o atalho CTRL+Z?", options: ["Salvar o arquivo", "Desfazer a última ação", "Fechar o programa", "Selecionar tudo"], correct: 1 },
    { id: 5, q: "O que é um anexo de e-mail?", options: ["O rascunho de uma mensagem", "O assunto do e-mail", "Um arquivo enviado junto com a mensagem", "A assinatura do remetente"], correct: 2 },
    { id: 6, q: "Qual das opções abaixo é um sistema operacional?", options: ["Google Chrome", "Microsoft Word", "Windows 11", "Adobe Photoshop"], correct: 2 },
    { id: 7, q: "O que é uma planilha eletrônica?", options: ["Um editor de textos", "Uma tabela de células para organizar e calcular dados", "Um programa de apresentação", "Um gerenciador de e-mails"], correct: 1 },
    { id: 8, q: "O que significa 'WiFi'?", options: ["Rede de fibra óptica", "Conexão via satélite", "Rede local sem fio", "Protocolo de segurança"], correct: 2 },
    { id: 9, q: "Para que serve o botão 'Responder a todos' em um e-mail?", options: ["Encaminhar a mensagem", "Responder apenas ao remetente", "Responder a todos os destinatários da conversa", "Arquivar a mensagem"], correct: 2 },
    { id: 10, q: "O que é a 'Lixeira' no computador?", options: ["Uma pasta de favoritos", "Local temporário para arquivos excluídos", "O disco rígido externo", "Um backup automático"], correct: 1 },
  ],
  medium: [
    { id: 1, q: "Qual fórmula no Excel soma todos os valores de A1 a A10?", options: ["=TOTAL(A1:A10)", "=SOMA(A1:A10)", "=CALC(A1:A10)", "=MEDIA(A1:A10)"], correct: 1 },
    { id: 2, q: "O que é um banco de dados relacional?", options: ["Um banco que armazena apenas imagens", "Sistema onde dados são organizados em tabelas com relacionamentos", "Um servidor de e-mail", "Um programa de criptografia"], correct: 1 },
    { id: 3, q: "O que significa IP no contexto de redes?", options: ["Internal Program", "Internet Protocol", "Integrated Port", "Interface Provider"], correct: 1 },
    { id: 4, q: "O que faz a função PROCV (VLOOKUP) no Excel?", options: ["Conta células com texto", "Formata células coloridas", "Busca um valor em uma coluna e retorna dado correspondente", "Calcula média ponderada"], correct: 2 },
    { id: 5, q: "Qual a principal diferença entre RAM e HD/SSD?", options: ["Não há diferença relevante", "RAM é memória volátil e rápida; HD/SSD é armazenamento permanente", "HD é mais rápido que a RAM", "RAM armazena vídeos, HD armazena áudio"], correct: 1 },
    { id: 6, q: "O que é um backup?", options: ["Uma atualização de sistema operacional", "Um tipo de vírus ransomware", "Cópia de segurança dos dados", "Um programa de compressão de arquivos"], correct: 2 },
    { id: 7, q: "O que significa a sigla DNS?", options: ["Data Network Security", "Domain Name System", "Digital Node Server", "Direct Navigation Software"], correct: 1 },
    { id: 8, q: "No Excel, a função SE() / IF() serve para:", options: ["Somar valores condicionalmente", "Retornar um valor baseado em uma condição verdadeira ou falsa", "Formatar células automaticamente", "Criar gráficos dinâmicos"], correct: 1 },
    { id: 9, q: "O que é um firewall?", options: ["Um tipo de processador gráfico", "Um software de apresentação", "Sistema que monitora e controla o tráfego de rede", "Um protocolo de envio de e-mail"], correct: 2 },
    { id: 10, q: "O que é um servidor web?", options: ["Um computador portátil de alto desempenho", "Software ou máquina que armazena e entrega páginas web a clientes", "Um roteador sem fio corporativo", "Um teclado ergonômico especial"], correct: 1 },
  ],
  advanced: [
    { id: 1, q: "O que é polimorfismo na Programação Orientada a Objetos?", options: ["A capacidade de uma classe ter múltiplos construtores", "A capacidade de um método assumir diferentes comportamentos conforme o contexto", "O processo de esconder atributos de uma classe", "Herança múltipla entre classes abstratas"], correct: 1 },
    { id: 2, q: "Qual é a complexidade de tempo média do algoritmo Quick Sort?", options: ["O(n²)", "O(n)", "O(n log n)", "O(log n)"], correct: 2 },
    { id: 3, q: "O que significa ACID em bancos de dados?", options: ["Access, Control, Integrity, Data", "Atomicidade, Consistência, Isolamento, Durabilidade", "Authentication, Cipher, Index, Deployment", "Architecture, Coding, Integration, Data"], correct: 1 },
    { id: 4, q: "O que é uma REST API?", options: ["Um banco de dados NoSQL distribuído", "Estilo arquitetural para sistemas distribuídos baseado em HTTP/recursos", "Um framework JavaScript para interfaces", "Um protocolo de segurança TLS"], correct: 1 },
    { id: 5, q: "O que é uma race condition?", options: ["Competição entre algoritmos de ordenação", "Erro causado por acesso concorrente não sincronizado a recurso compartilhado", "Um tipo de teste de carga e performance", "Uma otimização de query em banco de dados"], correct: 1 },
    { id: 6, q: "O que é SQL Injection?", options: ["Técnica de otimização de queries via índices", "Ataque que insere código SQL malicioso em inputs para manipular o banco", "Método de backup incremental de banco de dados", "Tipo de índice para busca full-text"], correct: 1 },
    { id: 7, q: "Na notação Big O, O(1) significa:", options: ["Complexidade linear proporcional à entrada", "Complexidade quadrática", "Complexidade constante, independente do tamanho da entrada", "Complexidade logarítmica"], correct: 2 },
    { id: 8, q: "O que é containerização com Docker?", options: ["Método de compressão avançada de arquivos", "Técnica de virtualização a nível de SO que empacota apps e dependências", "Um banco de dados em memória de alta performance", "Um protocolo de roteamento de rede"], correct: 1 },
    { id: 9, q: "O que é normalização em banco de dados relacional?", options: ["Processo de criptografar dados sensíveis em repouso", "Técnica de backup automático incremental", "Processo de organizar tabelas para eliminar redundância e anomalias", "Método de indexação para acelerar buscas"], correct: 2 },
    { id: 10, q: "O que é um Design Pattern (padrão de projeto)?", options: ["Um framework CSS baseado em componentes", "Solução reutilizável e documentada para problemas recorrentes em software", "Um tipo específico de banco de dados orientado a grafos", "Uma metodologia ágil de desenvolvimento"], correct: 1 },
  ],
};

export function getITDifficulty(position: string): ITDifficulty {
  const p = (position || "").toLowerCase();
  if (p.match(/desenvolv|engineer|arquitet|tech lead|data scien|devops|fullstack|backend|frontend|mobile|sênior|senior|sr\.|pleno|programad|sre|cloud|infra|security|ciberseg/)) {
    return "advanced";
  }
  if (p.match(/analista|coordenador|supervisor|gerente|financeiro|contábil|marketing|produto|sistemas|bi |business intel|scrum|gestor/)) {
    return "medium";
  }
  return "easy";
}

// ── End IT Test ────────────────────────────────────────────────────────────────

export const processes = candidates.map((c, i) => ({
  id: `p-${i + 1}`,
  candidate: c,
  status: c.status === "Concluído" ? "Concluído" : c.status === "Pendente" ? "Aguardando" : "Em Andamento",
  testsDone: c.status === "Concluído",
  documentsDone: i % 3 === 0,
  meetingDone: i % 4 === 0,
}));

export const meetings = [
  { id: "m-1", candidateId: "c-001", candidate: "Mariana Oliveira", position: "Front-end Sr.", date: "2026-05-19", time: "10:00", type: "Entrevista Inicial", status: "Agendada", format: "Google Meet" },
  { id: "m-2", candidateId: "c-002", candidate: "Rafael Cardoso", position: "Gerente de Produto", date: "2026-05-19", time: "14:30", type: "Análise de Perfil", status: "Agendada", format: "Zoom" },
  { id: "m-3", candidateId: "c-003", candidate: "Beatriz Almeida", position: "Analista de RH", date: "2026-05-18", time: "09:00", type: "Onboarding", status: "Realizada", format: "Presencial" },
  { id: "m-4", candidateId: "c-005", candidate: "Camila Souza", position: "Designer", date: "2026-05-20", time: "11:00", type: "Entrevista Inicial", status: "Agendada", format: "Google Meet" },
  { id: "m-5", candidateId: "c-007", candidate: "Juliana Martins", position: "Analista Financeiro", date: "2026-05-17", time: "16:00", type: "Análise de Perfil", status: "Cancelada", format: "Zoom" },
];

export const docTypes = [
  "RG", "CPF", "Comprovante de Residência", "Carteira de Trabalho",
  "Diploma", "ASO", "Foto 3x4", "Contrato Assinado",
];

const docStatuses = ["Pendente", "Enviado", "Aprovado", "Reprovado"] as const;
export type DocStatus = typeof docStatuses[number];

export const documents = candidates.flatMap((c, i) =>
  docTypes.slice(0, 4 + (i % 4)).map((t, j) => ({
    id: `${c.id}-d${j}`,
    candidateId: c.id,
    candidate: c.name,
    document: t,
    type: ["Identidade", "Identidade", "Residência", "Trabalho", "Educação", "Saúde", "Foto", "Contrato"][docTypes.indexOf(t)] ?? "Outros",
    requestedAt: c.testDate,
    status: docStatuses[(i + j) % 4],
  })),
);
