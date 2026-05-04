import { z } from "zod";

// Interpreta o dilema do usuário e gera um DilemmaWorld com dois caminhos navegáveis.
// O campo `world` é gerado server-side pela Gemini API; este módulo define os tipos,
// os schemas Zod de validação e a função de fallback heurístico.

export type TipoDilema = "tradeoff" | "avoidance" | "values";

export type TomEmocional =
  | "arrependimento"
  | "esperanca"
  | "ansiedade"
  | "paz"
  | "solidao"
  | "conexao"
  | "estagnacao"
  | "transformacao";

export interface Ambiente {
  /** O que o usuário vê ao olhar para este espaço */
  descricao: string;
  /** Elementos visuais concretos presentes no ambiente */
  elementos: string[];
  /** Cor dominante do ambiente em hex */
  cor: string;
  /** Rótulo emocional curto (ex: "arrependimento pesado") */
  humor: string;
}

export interface CaminhoMundo {
  /** "Ficou parado" ou "Seguiu em frente" */
  nome: string;
  /** Título poético do caminho */
  titulo: string;
  tom: TomEmocional;
  /** Cor dominante do caminho inteiro em hex */
  corDominante: string;
  /** Gradiente [topo, base] do céu/fundo do caminho */
  gradiente: [string, string];
  ambientes: {
    quarto: Ambiente;
    sala: Ambiente;
    trabalho: Ambiente;
    familia: Ambiente;
  };
}

export interface DilemmaWorld {
  id: string;
  dilema: string;
  tipoDilema?: TipoDilema;
  caminhoParado: CaminhoMundo;
  caminhoMudanca: CaminhoMundo;
  geradoEm: string;
}

// ---------------------------------------------------------------------------
// Schemas Zod — validam a resposta JSON do Gemini antes de usar
// ---------------------------------------------------------------------------

const TomEmocionalSchema = z.enum([
  "arrependimento", "esperanca", "ansiedade", "paz",
  "solidao", "conexao", "estagnacao", "transformacao",
]);

const AmbienteSchema = z.object({
  descricao: z.string(),
  elementos: z.array(z.string()),
  cor: z.string(),
  humor: z.string(),
});

const CaminhoMundoSchema = z.object({
  nome: z.string(),
  titulo: z.string(),
  tom: TomEmocionalSchema,
  corDominante: z.string(),
  gradiente: z.tuple([z.string(), z.string()]),
  ambientes: z.object({
    quarto: AmbienteSchema,
    sala: AmbienteSchema,
    trabalho: AmbienteSchema,
    familia: AmbienteSchema,
  }),
});

export const GeminiWorldResponseSchema = z.object({
  tipo: z.enum(["tradeoff", "avoidance", "values"]),
  caminhoParado: CaminhoMundoSchema,
  caminhoMudanca: CaminhoMundoSchema,
});

export const GeminiQuestionsResponseSchema = z.object({
  perguntas: z.array(z.string()).max(3),
});

export const GeminiGuardrailSchema = z.object({
  guardrail: z.literal(true),
});

// ---------------------------------------------------------------------------
// Fallback heurístico — usado quando ANTHROPIC_API_KEY não está disponível
// ---------------------------------------------------------------------------

type DilemaTema = "carreira" | "relacionamento" | "proposito" | "financeiro" | "saude" | "geral";

const KEYWORDS_TEMA: Record<DilemaTema, string[]> = {
  carreira: ["emprego", "trabalho", "cargo", "chefe", "empresa", "negocio", "startup", "demitir", "promoc"],
  relacionamento: ["namoro", "casamento", "separar", "terminar", "amor", "parceiro", "relacionamento", "familia"],
  proposito: ["proposito", "sentido", "felicidade", "sonho", "paixao", "viver", "significado", "missao"],
  financeiro: ["dinheiro", "divida", "investir", "gastar", "poupar", "rico", "financeiro", "custo"],
  saude: ["saude", "exercicio", "dieta", "medico", "doenca", "vicio", "habito", "corpo"],
  geral: [],
};

function detectTema(dilema: string): DilemaTema {
  const d = dilema.toLowerCase();
  let best: DilemaTema = "geral";
  let bestScore = 0;
  (Object.keys(KEYWORDS_TEMA) as DilemaTema[]).forEach((tema) => {
    const score = KEYWORDS_TEMA[tema].reduce((acc, kw) => acc + (d.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = tema; }
  });
  return best;
}

const FALLBACKS: Record<DilemaTema, { parado: Omit<CaminhoMundo, "nome">; mudanca: Omit<CaminhoMundo, "nome"> }> = {
  carreira: {
    parado: {
      titulo: "Mesa vazia",
      tom: "arrependimento",
      corDominante: "#6b7a8d",
      gradiente: ["#c9d0d8", "#8a96a3"],
      ambientes: {
        quarto: { descricao: "Manhã pesada, alarme ignorado, roupa do dia anterior ainda no chão", elementos: ["cama desfeita", "cortinas fechadas", "phone virado"], cor: "#8a96a3", humor: "inércia" },
        sala: { descricao: "TV ligada no canal de negócios, o sucesso do colega em destaque", elementos: ["TV passando notícia", "sofá amassado", "café frio"], cor: "#7a8693", humor: "arrependimento" },
        trabalho: { descricao: "Mesmo lugar, mesmo cargo, colegas passando por você rumo à reunião importante", elementos: ["mesa desordenada", "email sem resposta", "cadeira dos outros vazia"], cor: "#6b7a8d", humor: "estagnação" },
        familia: { descricao: "Jantar em silêncio, perguntas que ninguém faz, olhares que dizem tudo", elementos: ["prato pela metade", "cadeira do lado vazia", "TV ao fundo"], cor: "#7d8a9a", humor: "distância" },
      },
    },
    mudanca: {
      titulo: "Primeiro dia",
      tom: "transformacao",
      corDominante: "#4a7fa5",
      gradiente: ["#a8d4ef", "#5b9ec9"],
      ambientes: {
        quarto: { descricao: "Alarme às 6h, você acorda antes dele. Roupa nova separada na noite anterior", elementos: ["luz entrando", "mochila pronta", "café fresco"], cor: "#7ab8d4", humor: "antecipação" },
        sala: { descricao: "Planner na mesa, metas na parede, ligação com sócio marcada pra hoje", elementos: ["post-its coloridos", "caderno aberto", "janela aberta"], cor: "#5a9ab5", humor: "foco" },
        trabalho: { descricao: "Novo espaço, novo nome na porta, desafio que te faz crescer", elementos: ["mesa arrumada", "planta verde", "pitch deck aberto"], cor: "#4a7fa5", humor: "propósito" },
        familia: { descricao: "Jantar com história pra contar, olhos que brilham, orgulho que não precisa ser dito", elementos: ["mesa cheia", "vinho aberto", "risadas"], cor: "#5a8fba", humor: "conexão" },
      },
    },
  },
  relacionamento: {
    parado: {
      titulo: "Foto antiga",
      tom: "solidao",
      corDominante: "#9a8fa0",
      gradiente: ["#d4c9d8", "#a09098"],
      ambientes: {
        quarto: { descricao: "Cama do lado direito intocada há meses, perfume que ainda não foi jogado fora", elementos: ["lado vazio da cama", "foto virada", "silêncio"], cor: "#a09098", humor: "saudade" },
        sala: { descricao: "Dois copos no escorredor, rotina que não mudou, conversas que foram", elementos: ["mesa de dois lados", "plantas precisando de água", "livro parado"], cor: "#9a8fa0", humor: "vazio" },
        trabalho: { descricao: "Mente dividida, produtividade caindo, colegas percebendo seu peso", elementos: ["tela em branco", "fone de ouvido", "post-it com nome"], cor: "#8a8090", humor: "dispersão" },
        familia: { descricao: "Perguntas sobre ela/ele, respostas curtas, amor que protege a dor", elementos: ["pergunta no ar", "assunto mudado", "abraço de mãe"], cor: "#9a9088", humor: "proteção" },
      },
    },
    mudanca: {
      titulo: "Janela aberta",
      tom: "transformacao",
      corDominante: "#c4876a",
      gradiente: ["#f0c8a8", "#d49878"],
      ambientes: {
        quarto: { descricao: "Espaço reorganizado, livros novos, manhã que é só sua", elementos: ["cama inteira sua", "luz boa", "diário aberto"], cor: "#d4a888", humor: "liberdade" },
        sala: { descricao: "Amigos que voltaram, risadas que voltaram, você que voltou", elementos: ["sofá cheio", "mesa com petiscos", "música tocando"], cor: "#c4876a", humor: "reconexão" },
        trabalho: { descricao: "Cabeça presente, projeto novo, energia que estava guardada", elementos: ["tela com projeto", "caneta girando", "café quente"], cor: "#b47858", humor: "presença" },
        familia: { descricao: "Honestidade na mesa, conselhos recebidos, peso dividido", elementos: ["conversa real", "olhos atentos", "mão no ombro"], cor: "#c49878", humor: "apoio" },
      },
    },
  },
  proposito: {
    parado: {
      titulo: "Domingo pesado",
      tom: "estagnacao",
      corDominante: "#7a8a7a",
      gradiente: ["#b8c4b8", "#8a9a8a"],
      ambientes: {
        quarto: { descricao: "Domingo à tarde, cortinas fechadas, sensação de que algo está errado sem saber o quê", elementos: ["luz morta", "celular na mão", "silêncio inquieto"], cor: "#8a9a8a", humor: "vazio" },
        sala: { descricao: "Série em loop, chip de bater o tempo, pergunta que não sai da cabeça", elementos: ["controle na mão", "tela brilhando", "relógio na parede"], cor: "#7a8a7a", humor: "anestesia" },
        trabalho: { descricao: "Reuniões que não importam, relatórios que ninguém lê, você invisível", elementos: ["apresentação genérica", "cafezinho por educação", "relógio no canto"], cor: "#6a7a6a", humor: "irrelevância" },
        familia: { descricao: "Pergunta 'como você tá?' sem resposta real, distância que vira costume", elementos: ["resposta automática", "sorriso de fachada", "assunto seguro"], cor: "#7a8878", humor: "superfície" },
      },
    },
    mudanca: {
      titulo: "Chama acesa",
      tom: "transformacao",
      corDominante: "#d4845a",
      gradiente: ["#f0c090", "#e0906a"],
      ambientes: {
        quarto: { descricao: "Manhã com propósito, caderno de ideias na cabeceira, vontade de começar", elementos: ["luz natural", "caderno aberto", "planta crescendo"], cor: "#e0a078", humor: "intenção" },
        sala: { descricao: "Projeto no chão, post-its na parede, aquela coisa que te faz perder noção do tempo", elementos: ["papéis espalhados", "cores", "energia viva"], cor: "#d4845a", humor: "flow" },
        trabalho: { descricao: "Contribuição que importa, voz que é ouvida, impacto que você vê acontecer", elementos: ["apresentação sua", "aplauso real", "nome lembrado"], cor: "#c47448", humor: "significado" },
        familia: { descricao: "Conto que faz sentido, curiosidade genuína deles, orgulho mútuo", elementos: ["história que encanta", "olhos arregalados", "perguntas verdadeiras"], cor: "#d49060", humor: "inspiração" },
      },
    },
  },
  financeiro: {
    parado: {
      titulo: "Conta no vermelho",
      tom: "ansiedade",
      corDominante: "#8a7060",
      gradiente: ["#c8b8a8", "#9a8878"],
      ambientes: {
        quarto: { descricao: "App do banco aberto às 2h, cálculos que não fecham, sono que não vem", elementos: ["tela do banco", "calculadora", "escuridão"], cor: "#9a8878", humor: "peso" },
        sala: { descricao: "Compras parceladas que esqueceu, boleto na geladeira, escolhas que somam", elementos: ["boleto impresso", "cartão na mesa", "geladeira vazia"], cor: "#8a7060", humor: "pressão" },
        trabalho: { descricao: "Horas extras que não vão resolver, salário que some antes do dia 15", elementos: ["planilha vermelha", "hora extra marcada", "café sem açúcar"], cor: "#7a6050", humor: "sufocamento" },
        familia: { descricao: "Pedido de ajuda que dói pedir, orgulho que custa caro", elementos: ["ligação difícil", "silêncio antes de falar", "alívio misturado com vergonha"], cor: "#8a7868", humor: "vulnerabilidade" },
      },
    },
    mudanca: {
      titulo: "Conta no verde",
      tom: "paz",
      corDominante: "#4a8a6a",
      gradiente: ["#a8d4b8", "#5aaa7a"],
      ambientes: {
        quarto: { descricao: "Plano de ação no notebook, meta de 6 meses clara, sono que voltou", elementos: ["caderno com metas", "alarme para estudar", "paz"], cor: "#6aaa8a", humor: "controle" },
        sala: { descricao: "Curso de finanças no tablet, hábito novo, satisfação de entender", elementos: ["tablet com aula", "café da manhã simples", "luz boa"], cor: "#4a8a6a", humor: "aprendizado" },
        trabalho: { descricao: "Segunda renda funcionando, habilidade monetizada, liberdade crescendo", elementos: ["projeto paralelo", "transferência recebida", "sorriso real"], cor: "#3a7a5a", humor: "expansão" },
        familia: { descricao: "Ajuda que volta como presente, orgulho que não precisou de palavras", elementos: ["presente simples", "jantar que você pagou", "gratidão silenciosa"], cor: "#4a8a6a", humor: "abundância" },
      },
    },
  },
  saude: {
    parado: {
      titulo: "Cansaço antigo",
      tom: "estagnacao",
      corDominante: "#8a8070",
      gradiente: ["#c4bab0", "#9a9080"],
      ambientes: {
        quarto: { descricao: "Acorda cansado, corpo pesado, mais um dia igual ao anterior", elementos: ["cama difícil de sair", "espelho evitado", "roupa de academia nunca usada"], cor: "#9a9080", humor: "resistência" },
        sala: { descricao: "Delivery novamente, série mais uma vez, amanhã começo", elementos: ["caixa de delivery", "controle na mão", "amanhã que não vem"], cor: "#8a8070", humor: "adiamento" },
        trabalho: { descricao: "Energia baixa, dor de cabeça crônica, rendimento que vai caindo", elementos: ["café duplo", "postura ruim", "tela cansando os olhos"], cor: "#7a7060", humor: "depleção" },
        familia: { descricao: "Preocupação que eles disfarçam, conselho que você rejeita, medo deles que você sente", elementos: ["olhar preocupado", "sugestão rejeitada", "amor impotente"], cor: "#8a8878", humor: "negação" },
      },
    },
    mudanca: {
      titulo: "Corpo novo",
      tom: "transformacao",
      corDominante: "#5a9a7a",
      gradiente: ["#a8d8b8", "#6ab888"],
      ambientes: {
        quarto: { descricao: "Acorda antes do alarme, corpo que quer se mover, manhã que pertence a você", elementos: ["luz natural", "roupa de treino pronta", "garrafa de água cheia"], cor: "#7ab898", humor: "vitalidade" },
        sala: { descricao: "Refeição que você preparou, orgulho do processo, prazer simples", elementos: ["prato colorido", "mesa arrumada", "momento presente"], cor: "#5a9a7a", humor: "cuidado" },
        trabalho: { descricao: "Mente clara, energia até o fim do dia, decisões melhores", elementos: ["hidratação na mesa", "postura correta", "foco genuíno"], cor: "#4a8a6a", humor: "presença" },
        familia: { descricao: "Jogo com sobrinho, caminhada com mãe, exemplo que inspira sem forçar", elementos: ["movimento compartilhado", "risada física", "saúde que contagia"], cor: "#5a9878", humor: "vitalidade compartilhada" },
      },
    },
  },
  geral: {
    parado: {
      titulo: "Peso familiar",
      tom: "estagnacao",
      corDominante: "#7a8a9a",
      gradiente: ["#b8c4cc", "#8a9aaa"],
      ambientes: {
        quarto: { descricao: "Pensamentos em loop, decisão que não sai do papel, medo disfarçado de prudência", elementos: ["teto que você olha", "pensamento circular", "silêncio pesado"], cor: "#8a9aaa", humor: "paralisia" },
        sala: { descricao: "Vida passando na tela dos outros, você imóvel no sofá", elementos: ["scroll infinito", "vidas que não são a sua", "tempo que passa"], cor: "#7a8a9a", humor: "estagnação" },
        trabalho: { descricao: "Dias que se repetem, potencial guardado, energia conservada pra nada", elementos: ["agenda vazia de sentido", "capacidade desperdiçada", "relógio na parede"], cor: "#6a7a8a", humor: "desperdício" },
        familia: { descricao: "Pergunta que eles não fazem mais, preocupação que virou silêncio", elementos: ["assunto que ninguém toca", "sorriso gentil", "distância respeitosa"], cor: "#7a8898", humor: "afastamento" },
      },
    },
    mudanca: {
      titulo: "Passo dado",
      tom: "esperanca",
      corDominante: "#5a7fa5",
      gradiente: ["#a8c4e0", "#6a9abf"],
      ambientes: {
        quarto: { descricao: "Decisão tomada, leveza que não esperava, manhã com sabor diferente", elementos: ["diário aberto", "plano escrito", "alivio físico"], cor: "#7a9fc0", humor: "resolução" },
        sala: { descricao: "Conversa honesta com você mesmo, clareza chegando devagar", elementos: ["silêncio produtivo", "chá quente", "luz diferente"], cor: "#5a7fa5", humor: "clareza" },
        trabalho: { descricao: "Movimento real, pequeno mas real, momentum que se acumula", elementos: ["primeiro email enviado", "reunião marcada", "resposta chegando"], cor: "#4a6f95", humor: "momentum" },
        familia: { descricao: "Partilha honesta, apoio que não esperava, você menos sozinho", elementos: ["vulnerabilidade corajosa", "abraço real", "peso dividido"], cor: "#5a7fa5", humor: "pertencimento" },
      },
    },
  },
};

export function interpretDilemmaFallback(dilema: string): Omit<DilemmaWorld, "id" | "geradoEm"> {
  const tema = detectTema(dilema);
  const f = FALLBACKS[tema];
  return {
    dilema,
    caminhoParado: { nome: "Ficou parado", ...f.parado },
    caminhoMudanca: { nome: "Seguiu em frente", ...f.mudanca },
  };
}
