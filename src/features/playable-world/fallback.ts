import {
  interpretDilemmaFallback,
  type Ambiente,
  type DilemmaWorld,
} from "../../lib/interpret-dilemma.ts";

import type {
  ClimatePreset,
  ColorHint,
  DilemmaTheme,
  HotspotKind,
  PathId,
  PlayableDilemmaType,
  PropKind,
  RoomId,
  RoomIntent,
  RoomLayout,
  WorldIntent,
} from "./model.ts";

const THEME_KEYWORDS: Record<DilemmaTheme, string[]> = {
  career: ["emprego", "trabalho", "empresa", "cargo", "carreira", "startup", "chefe", "demitir"],
  relationship: [
    "namoro",
    "casamento",
    "separar",
    "terminar",
    "amor",
    "parceiro",
    "relacionamento",
    "familia",
  ],
  purpose: ["proposito", "sentido", "paixao", "missao", "felicidade", "sonho", "viver"],
  finance: ["dinheiro", "divida", "investir", "gastar", "poupar", "financeiro", "boleto"],
  health: ["saude", "corpo", "vicio", "habito", "medico", "doenca", "exercicio", "dieta"],
  general: [],
};

const ROOM_LAYOUT_BY_ID: Record<RoomId, RoomLayout> = {
  quarto: "sanctuary",
  sala: "crossroads",
  trabalho: "atelier",
  familia: "corridor",
};

const ROOM_CLIMATE_BY_ID: Record<RoomId, ClimatePreset> = {
  quarto: "mist",
  sala: "overcast",
  trabalho: "golden",
  familia: "night",
};

const PATH_HINT_BY_TONE: Record<string, ColorHint> = {
  arrependimento: "slate",
  esperanca: "aqua",
  ansiedade: "violet",
  paz: "sage",
  solidao: "mist",
  conexao: "rose",
  estagnacao: "slate",
  transformacao: "gold",
};

const HOTSPOT_KIND_BY_ROOM: Record<RoomId, HotspotKind> = {
  quarto: "body",
  sala: "relationship",
  trabalho: "work",
  familia: "support",
};

function detectTheme(dilema: string): DilemmaTheme {
  const lowered = dilema.toLowerCase();
  let winner: DilemmaTheme = "general";
  let bestScore = 0;

  (Object.keys(THEME_KEYWORDS) as DilemmaTheme[]).forEach((theme) => {
    const score = THEME_KEYWORDS[theme].reduce(
      (sum, keyword) => sum + (lowered.includes(keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      winner = theme;
    }
  });

  return winner;
}

function inferDilemmaType(dilema: string): PlayableDilemmaType {
  const lowered = dilema.toLowerCase();

  if (/(sei que|preciso|deveria|nao consigo|não consigo)/.test(lowered)) {
    return "avoidance";
  }

  if (/(familia|família).*(carreira|trabalho)|perto.*longe|segur.*liberdade/.test(lowered)) {
    return "values";
  }

  return "tradeoff";
}

function mapElementToPropKind(element: string): PropKind[] {
  const normalized = element.toLowerCase();

  if (/(cama|travesseiro|cobertor)/.test(normalized)) return ["bed"];
  if (/(mesa|planner|post-it|pitch|notebook|caderno|planilha)/.test(normalized))
    return ["desk", "notebook"];
  if (/(sofa|sofá|tv|controle)/.test(normalized)) return ["sofa"];
  if (/(planta|verde)/.test(normalized)) return ["plant"];
  if (/(janela|cortina)/.test(normalized)) return ["window"];
  if (/(foto|retrato)/.test(normalized)) return ["frame"];
  if (/(espelho)/.test(normalized)) return ["mirror"];
  if (/(mala|mochila)/.test(normalized)) return ["suitcase"];
  if (/(vinho|cafe|café|cha|chá|prato|jantar)/.test(normalized)) return ["dining-table", "mug"];
  if (/(cadeira)/.test(normalized)) return ["chair"];
  if (/(roupa|lavanderia|chao|chão)/.test(normalized)) return ["laundry"];
  if (/(musica|música|fone)/.test(normalized)) return ["music-player"];
  if (/(porta)/.test(normalized)) return ["door"];
  if (/(livro|biblioteca|estante)/.test(normalized)) return ["bookshelf"];

  return ["table"];
}

function uniquePropStory(ambiente: Ambiente): PropKind[] {
  const props = [
    ...ambiente.elementos.flatMap(mapElementToPropKind),
    ...mapElementToPropKind(ambiente.descricao),
  ];
  const deduped = Array.from(new Set(props));

  return deduped.slice(0, 5).length >= 3
    ? deduped.slice(0, 5)
    : [...deduped, "plant", "lamp", "chair"].slice(0, 3);
}

function createRoomIntent(roomId: RoomId, ambiente: Ambiente): RoomIntent {
  const primaryElement = ambiente.elementos[0] ?? ambiente.humor;
  const secondaryElement =
    ambiente.elementos[1] ?? ambiente.descricao.split(",")[0] ?? ambiente.humor;

  return {
    id: roomId,
    title: ambiente.humor,
    summary: ambiente.descricao,
    mood: ambiente.humor,
    layout: ROOM_LAYOUT_BY_ID[roomId],
    climate: ROOM_CLIMATE_BY_ID[roomId],
    propStory: uniquePropStory(ambiente),
    hotspots: [
      {
        kind: HOTSPOT_KIND_BY_ROOM[roomId],
        label: primaryElement,
        prompt: `Toque para sentir ${ambiente.humor}.`,
        insight: ambiente.descricao,
      },
      {
        kind: roomId === "familia" ? "relationship" : "future",
        label: secondaryElement,
        prompt: `O que esse sinal diz sobre voce agora?`,
        insight: `Esse detalhe aparece em ${ROOM_LAYOUT_BY_ID[roomId]} para traduzir ${ambiente.humor}.`,
      },
    ],
  };
}

function createWorldIntentFromLegacy(world: DilemmaWorld): WorldIntent {
  return {
    version: "world-intent-v1",
    theme: detectTheme(world.dilema),
    dilemmaType: inferDilemmaType(world.dilema),
    cameraPreset: "isometric-calm",
    card: {
      badge: "Mundo gerado",
      title: "Dois futuros pedem sua presenca",
      subtitle: "Explore cada atmosfera com calma antes de decidir o que ela revela.",
    },
    hub: {
      title: "Entre no limiar",
      subtitle: "Toque em um dos portais e sinta como cada caminho muda os espacos da sua vida.",
    },
    reflectionPrompt:
      "Depois de explorar os dois caminhos, escreva o que seu corpo entendeu antes mesmo de virar conclusao.",
    paths: [
      {
        id: "parado",
        label: world.caminhoParado.nome,
        title: world.caminhoParado.titulo,
        summary: world.caminhoParado.ambientes.trabalho.descricao,
        colorHint: PATH_HINT_BY_TONE[world.caminhoParado.tom] ?? "slate",
        closureLine: "Esse caminho mostra o custo silencioso de continuar igual.",
        rooms: [
          createRoomIntent("quarto", world.caminhoParado.ambientes.quarto),
          createRoomIntent("sala", world.caminhoParado.ambientes.sala),
          createRoomIntent("trabalho", world.caminhoParado.ambientes.trabalho),
          createRoomIntent("familia", world.caminhoParado.ambientes.familia),
        ],
      },
      {
        id: "mudanca",
        label: world.caminhoMudanca.nome,
        title: world.caminhoMudanca.titulo,
        summary: world.caminhoMudanca.ambientes.trabalho.descricao,
        colorHint: PATH_HINT_BY_TONE[world.caminhoMudanca.tom] ?? "gold",
        closureLine: "Esse caminho mostra a energia e o preco de se mover.",
        rooms: [
          createRoomIntent("quarto", world.caminhoMudanca.ambientes.quarto),
          createRoomIntent("sala", world.caminhoMudanca.ambientes.sala),
          createRoomIntent("trabalho", world.caminhoMudanca.ambientes.trabalho),
          createRoomIntent("familia", world.caminhoMudanca.ambientes.familia),
        ],
      },
    ],
  };
}

export function buildFallbackWorldIntent(dilema: string) {
  const legacyWorld = interpretDilemmaFallback(dilema);
  return createWorldIntentFromLegacy({
    ...legacyWorld,
    id: "legacy-fallback",
    geradoEm: new Date().toISOString(),
  });
}
