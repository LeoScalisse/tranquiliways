import { z } from "zod";

import {
  PlayableWorldV1Schema,
  type PlayableWorldV1,
  type WorldCardMeta,
} from "../features/playable-world/model.ts";
import { DilemmaWorldSchema, type LegacyDilemmaWorld } from "./interpret-dilemma.ts";

export type JourneyWorld = LegacyDilemmaWorld | PlayableWorldV1;

export const JourneyWorldSchema = z.union([DilemmaWorldSchema, PlayableWorldV1Schema]);

export function isPlayableWorld(world: unknown): world is PlayableWorldV1 {
  return PlayableWorldV1Schema.safeParse(world).success;
}

export function isLegacyDilemmaWorld(world: unknown): world is LegacyDilemmaWorld {
  return DilemmaWorldSchema.safeParse(world).success;
}

export function isJourneyWorld(world: unknown): world is JourneyWorld {
  return JourneyWorldSchema.safeParse(world).success;
}

const LEGACY_IMAGE_QUERIES: Record<string, string> = {
  career: "career crossroads professional path office",
  relationship: "relationship connection two people bond",
  purpose: "life purpose meaning compass journey",
  finance: "financial decision money balance scale",
  health: "health wellbeing body nature healing",
  general: "crossroads decision two paths fog",
  tradeoff: "crossroads decision two paths diverging",
  avoidance: "fog uncertainty hiding shadows retreat",
  values: "moral compass integrity inner light",
};

export function getWorldCardMeta(world: JourneyWorld): WorldCardMeta {
  if (isPlayableWorld(world)) {
    return world.card;
  }

  const tipoDilema = (world as { tipoDilema?: string }).tipoDilema ?? "general";
  const cardImageQuery = LEGACY_IMAGE_QUERIES[tipoDilema] ?? LEGACY_IMAGE_QUERIES.general;

  return {
    badge: "Mundo salvo",
    title: "Dois caminhos para revisitar",
    subtitle: world.dilema,
    accentGradient: [world.caminhoParado.gradiente[0], world.caminhoMudanca.gradiente[0]],
    leftPath: {
      label: world.caminhoParado.nome,
      title: world.caminhoParado.titulo,
      color: world.caminhoParado.corDominante,
    },
    rightPath: {
      label: world.caminhoMudanca.nome,
      title: world.caminhoMudanca.titulo,
      color: world.caminhoMudanca.corDominante,
    },
    cardImageQuery,
  };
}
