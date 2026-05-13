// Heurística local: interpreta o prompt do usuário e devolve uma "atmosfera"
// (paleta de céu/oceano/colinas, tipo de clima, título poético, localização poética).
// Sem chamada de IA — puro mapeamento de palavras-chave.

export type WeatherKind = "sunny" | "cloudy" | "sunset" | "night" | "misty" | "calm";

export interface WayPalette {
  skyTop: string;
  skyBottom: string;
  oceanTop: string;
  oceanBottom: string;
  hillFront: string;
  hillBack: string;
  hillFar1: string;
  hillFar2: string;
  sunColor: string;
}

export interface InterpretedWay {
  id: string;
  prompt: string;
  title: string;
  location: string;
  date: string;
  temperature: string;
  weather: WeatherKind;
  palette: WayPalette;
  forecast: { label: string; value: string }[];
  createdAt: number;
}

// Paletas curadas por humor
const PALETTES: Record<WeatherKind, WayPalette> = {
  sunny: {
    skyTop: "#ffd86b",
    skyBottom: "#ff8a5b",
    oceanTop: "#f7da96",
    oceanBottom: "#f1c07d",
    hillFront: "#b77873",
    hillBack: "#a16773",
    hillFar1: "#e6b29d",
    hillFar2: "#c29182",
    sunColor: "#ffffff",
  },
  cloudy: {
    skyTop: "#cdd9e3",
    skyBottom: "#8aa3b8",
    oceanTop: "#a8b8c5",
    oceanBottom: "#6f8497",
    hillFront: "#5d6d75",
    hillBack: "#4a5860",
    hillFar1: "#9aa9b3",
    hillFar2: "#7a8a93",
    sunColor: "#e8ecef",
  },
  sunset: {
    skyTop: "#f7e157",
    skyBottom: "#e96594",
    oceanTop: "#f7da96",
    oceanBottom: "#f1c07d",
    hillFront: "#b77873",
    hillBack: "#a16773",
    hillFar1: "#e6b29d",
    hillFar2: "#c29182",
    sunColor: "#ffffff",
  },
  night: {
    skyTop: "#1b2447",
    skyBottom: "#3a3669",
    oceanTop: "#2d3a66",
    oceanBottom: "#1a2240",
    hillFront: "#3a2f55",
    hillBack: "#2a2240",
    hillFar1: "#5a4d7a",
    hillFar2: "#473a66",
    sunColor: "#f5f0c8",
  },
  misty: {
    skyTop: "#dfe9f0",
    skyBottom: "#b9c7d2",
    oceanTop: "#c3cfd8",
    oceanBottom: "#9eaeba",
    hillFront: "#7c8a93",
    hillBack: "#62707a",
    hillFar1: "#aeb9c1",
    hillFar2: "#8e9aa3",
    sunColor: "#f4f7fa",
  },
  calm: {
    skyTop: "#a8dcff",
    skyBottom: "#5cc3ff",
    oceanTop: "#bfe4ff",
    oceanBottom: "#7ec8f0",
    hillFront: "#7aa8b8",
    hillBack: "#5d8a9a",
    hillFar1: "#a8c9d4",
    hillFar2: "#86afba",
    sunColor: "#ffffff",
  },
};

// Mapeia palavras-chave -> humor
const KEYWORDS: Record<WeatherKind, string[]> = {
  sunny: ["sol", "energia", "feliz", "alegre", "vibrante", "anim", "radiant", "vivo"],
  cloudy: ["nublad", "introspec", "pensativ", "reflex", "melanc", "saudade"],
  sunset: ["amor", "romant", "pôr do sol", "por do sol", "entardecer", "nostal", "quent"],
  night: ["noite", "escur", "sonh", "misterio", "profund", "silenc", "estrel"],
  misty: ["névoa", "nevoa", "neblina", "indecis", "confus", "sutil", "delicad"],
  calm: ["calm", "paz", "tranquil", "sereno", "sereni", "leve", "respir", "alivio", "alívio"],
};

const POETIC_TITLES: Record<WeatherKind, string[]> = {
  sunny: ["Manhã clara", "Sol pleno", "Vivo agora", "Luz viva"],
  cloudy: ["Pensar devagar", "Cinza sereno", "Olhar dentro", "Brisa cinza"],
  sunset: ["Doce final", "Hora dourada", "Cor do fim", "Quase noite"],
  night: ["Silêncio fundo", "Noite calma", "Sob estrelas", "Sonho quieto"],
  misty: ["Bruma leve", "Entre véus", "Devagar", "Quase nada"],
  calm: ["Calmaria", "Respira", "Mar parado", "Paz simples"],
};

const POETIC_LOCATIONS = [
  "Aqui",
  "Agora",
  "Dentro",
  "Quase lá",
  "No meio",
  "Hoje",
  "Em mim",
  "Comigo",
];

function detectWeather(prompt: string): WeatherKind {
  const p = prompt.toLowerCase();
  let best: WeatherKind = "calm";
  let bestScore = 0;
  (Object.keys(KEYWORDS) as WeatherKind[]).forEach((kind) => {
    const score = KEYWORDS[kind].reduce((acc, kw) => acc + (p.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = kind;
    }
  });
  return best;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });
}

export function interpretWay(prompt: string): InterpretedWay {
  const weather = detectWeather(prompt);
  const palette = PALETTES[weather];
  const seed = Math.abs(prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const title = pick(POETIC_TITLES[weather], seed);
  const location = pick(POETIC_LOCATIONS, seed >> 2);
  const now = new Date();
  const tempBase =
    weather === "night" ? 16 : weather === "sunny" ? 28 : weather === "sunset" ? 24 : 20;
  const temperature = `${tempBase + (seed % 4)}°`;

  const forecast = [1, 2, 3].map((offset) => {
    const d = new Date(now.getTime() + offset * 86400000);
    return {
      label: fmtDate(d),
      value: `${tempBase + ((seed + offset) % 5)}°`,
    };
  });

  return {
    id: `${now.getTime()}-${seed}`,
    prompt,
    title,
    location,
    date: fmtDate(now),
    temperature,
    weather,
    palette,
    forecast,
    createdAt: now.getTime(),
  };
}
