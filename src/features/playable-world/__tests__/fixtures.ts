import { compileWorldIntent } from "../compiler.ts";
import type { WorldIntent } from "../model.ts";

export function createWorldIntentFixture(): WorldIntent {
  return {
    version: "world-intent-v1",
    theme: "career",
    dilemmaType: "tradeoff",
    cameraPreset: "isometric-calm",
    card: {
      badge: "Mundo gerado",
      title: "Dois caminhos ganham forma",
      subtitle: "Cada espaco mostra o custo e o alivio escondidos na sua decisao.",
    },
    hub: {
      title: "Limiar da escolha",
      subtitle: "Toque em um portal para sentir a textura de cada futuro.",
    },
    reflectionPrompt:
      "Depois de explorar os dois caminhos, escreva o que seu corpo entendeu antes de transformar isso em decisao.",
    paths: [
      {
        id: "parado",
        label: "Seguranca conhecida",
        title: "Mesa quieta",
        summary: "O caminho preserva rotina e previsibilidade, mas abafa a energia vital.",
        colorHint: "slate",
        closureLine: "Nada explode aqui, mas muita coisa vai apagando devagar.",
        rooms: [
          {
            id: "quarto",
            title: "Acordar pesado",
            summary: "A cama segura mais do que descansa e o dia comeca sem impulso.",
            mood: "inercia",
            layout: "sanctuary",
            climate: "mist",
            propStory: ["bed", "laundry", "lamp"],
            hotspots: [
              {
                kind: "body",
                label: "Corpo cansado",
                prompt: "O que seu corpo esta tentando evitar aqui?",
                insight: "A lentidao do quarto mostra um cansaco que ja virou rotina.",
              },
              {
                kind: "future",
                label: "Luz fraca",
                prompt: "Que parte do seu futuro ficou difusa?",
                insight: "A luz nao some, mas tambem nao convida voce a sair.",
              },
            ],
          },
          {
            id: "sala",
            title: "Conforto que enrola",
            summary: "Tudo esta no lugar, mas a vida parece assistir a si mesma de longe.",
            mood: "acomodacao",
            layout: "crossroads",
            climate: "overcast",
            propStory: ["sofa", "table", "window"],
            hotspots: [
              {
                kind: "choice",
                label: "Controle parado",
                prompt: "O que voce segue adiando nesse descanso?",
                insight: "A sala segura o tempo sem devolver movimento.",
              },
              {
                kind: "relationship",
                label: "Janela fechada",
                prompt: "Quem fica do lado de fora quando voce se fecha?",
                insight: "A paisagem existe, mas voce quase nao se oferece a ela.",
              },
            ],
          },
          {
            id: "trabalho",
            title: "Ritmo sem eco",
            summary: "A mesa funciona, mas a tarefa ja nao devolve sentido.",
            mood: "apagamento",
            layout: "atelier",
            climate: "golden",
            propStory: ["desk", "chair", "notebook", "mug"],
            hotspots: [
              {
                kind: "work",
                label: "Planilha morna",
                prompt: "Qual parte de voce ficou automatica aqui?",
                insight: "O trabalho segue rodando, mas sem pedir presenca inteira.",
              },
              {
                kind: "calling",
                label: "Caderno fechado",
                prompt: "O que continua sem ganhar espaco?",
                insight: "Ha ideia, mas ela fica em espera porque o ambiente nao a chama.",
              },
            ],
          },
          {
            id: "familia",
            title: "Silencio gentil",
            summary:
              "As conversas protegem voce, mas tambem evitam o que mais precisa ser nomeado.",
            mood: "silencio",
            layout: "corridor",
            climate: "night",
            propStory: ["dining-table", "chair", "frame"],
            hotspots: [
              {
                kind: "support",
                label: "Mesa contida",
                prompt: "Que apoio voce imagina que precisa provar antes de pedir?",
                insight: "O afeto existe, mas chega filtrado pelo medo de preocupar.",
              },
              {
                kind: "relationship",
                label: "Retrato quieto",
                prompt: "Que papel voce continua representando aqui?",
                insight: "A familia enxerga voce, mas talvez ainda pelo personagem seguro.",
              },
            ],
          },
        ],
      },
      {
        id: "mudanca",
        label: "Chamado em movimento",
        title: "Primeiro clarim",
        summary: "O caminho tem risco real, mas devolve energia, presenca e autoria.",
        colorHint: "gold",
        closureLine: "O desconforto desse portal vem acompanhado de ar e direcao.",
        rooms: [
          {
            id: "quarto",
            title: "Acordar antes do alarme",
            summary: "O quarto ainda e simples, mas a energia ganhou direcao e intencao.",
            mood: "antecipacao",
            layout: "sanctuary",
            climate: "dawn",
            propStory: ["bed", "suitcase", "notebook", "plant"],
            hotspots: [
              {
                kind: "body",
                label: "Respiracao aberta",
                prompt: "O que seu corpo ja sabe quando voce aceita se mover?",
                insight: "A tensao ainda existe, mas ela ja convive com vontade.",
              },
              {
                kind: "ritual",
                label: "Caderno acordado",
                prompt: "Que pequena pratica esta sustentando esse impulso?",
                insight: "A repeticao deixa de anestesiar e passa a apoiar.",
              },
            ],
          },
          {
            id: "sala",
            title: "Casa em rearranjo",
            summary: "O espaco ganhou rastros de projeto, conversa e vida em processo.",
            mood: "movimento",
            layout: "crossroads",
            climate: "golden",
            propStory: ["table", "plant", "music-player", "window"],
            hotspots: [
              {
                kind: "choice",
                label: "Mesa viva",
                prompt: "Qual parte dessa desordem finalmente parece certa?",
                insight: "A sala nao esta pronta, mas pela primeira vez parece sua.",
              },
              {
                kind: "future",
                label: "Janela aberta",
                prompt: "Que possibilidade ficou respiravel aqui?",
                insight: "A paisagem nao promete nada; ela apenas voltou a convidar.",
              },
            ],
          },
          {
            id: "trabalho",
            title: "Foco com risco",
            summary: "O trabalho pede mais coragem, mas tambem devolve mais significado.",
            mood: "presenca",
            layout: "atelier",
            climate: "golden",
            propStory: ["desk", "notebook", "lamp", "mug"],
            hotspots: [
              {
                kind: "work",
                label: "Mesa desperta",
                prompt: "O que nesse risco finalmente parece valer seu esforco?",
                insight: "O desafio cansa, mas ele puxa voce para frente em vez de achatar.",
              },
              {
                kind: "calling",
                label: "Luz de oficio",
                prompt: "Qual habilidade sua fica mais viva aqui?",
                insight: "Ha friccao, mas ela vem ao lado de uma sensacao de autoria.",
              },
            ],
          },
          {
            id: "familia",
            title: "Conversa que muda o ar",
            summary: "Ainda existe medo, mas agora ele divide a mesa com verdade e apoio.",
            mood: "abertura",
            layout: "corridor",
            climate: "night",
            propStory: ["dining-table", "chair", "frame", "plant"],
            hotspots: [
              {
                kind: "support",
                label: "Mesa honesta",
                prompt: "O que se torna possivel quando voce se mostra sem roteiro?",
                insight: "Nem toda aprovacao chega na hora, mas a relacao fica mais real.",
              },
              {
                kind: "relationship",
                label: "Retrato em movimento",
                prompt: "Quem voce pode ser aqui sem se encolher?",
                insight:
                  "O vinculo amadurece quando para de depender da versao mais segura de voce.",
              },
            ],
          },
        ],
      },
    ],
  };
}

export function createPlayableWorldFixture() {
  return compileWorldIntent({
    id: "playable-world-fixture",
    dilema: "Devo seguir na carreira segura ou me mover em direcao ao trabalho que me chama?",
    geradoEm: "2026-05-04T10:00:00.000Z",
    intent: createWorldIntentFixture(),
  });
}
