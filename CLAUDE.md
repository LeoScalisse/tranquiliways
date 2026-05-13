# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🌱 North Star — Lembrar a cada mensagem

Antes de propor qualquer mudança, responda mentalmente: **"Isso serve ao porquê e aos objetivos abaixo?"** Se não, realinhe.

### Por que o TranquiliWays existe

Jovens de 18 a 27 anos vivem **perdidos, ansiosos e paralisados** diante de decisões importantes — pressão familiar, comparação nas redes, baixa autoeficácia, medo de "perder tempo". O problema não é falta de informação. É **falta de clareza visceral** sobre o que as escolhas de hoje constroem amanhã.

O app não diz o que fazer. Ele **torna o futuro tangível no presente** através de mundos 2.5D/3D gerados por IA, onde a pessoa **vive** o dilema em vez de só pensar nele. O resultado desejado pós-sessão: **inspirada, motivada, mente clara**.

### Princípios inegociáveis

1. **Clarificar, nunca concluir pelo usuário.** Mostrar possibilidades, não prescrever.
2. **Plausível, nunca fantasioso.** Futuros aterrados, não promessa milagrosa.
3. **Bem-estar antes de engajamento ou monetização.** Sem truques, sem pressão.
4. **70% contemplativo + inspirador / 30% prático + acionável.**
5. **Voz: amigo mais velho e sábio, acolhedor, sem julgamento.** Nunca frio, clínico ou corporativo.
6. **Tom Tranquili+: vida +leve, +feliz, +calma.** Calma, gentileza, sabedoria, analogias quando ajudam.

### Objetivos atuais (MVP)

- **Provar a coisa central:** gerar primeiros mundos interativos consistentes com o dilema do usuário.
- **Android-first.** Web/iOS suportam, mas Android decide empates.
- **Loading inteligente até 1m30s** — bonito, imersivo, emocionalmente relevante. Espera longa é OK se a experiência da espera valer.
- **Recorrência alvo:** 1-3× por semana, mínimo 1× por mês.
- **Freemium:** 1-3 gerações grátis/semana. Premium = mais gerações, chat sobre o mundo, histórico ilimitado.
- **Métricas:** retenção, gerações concluídas, retorno.

### Filtro de decisão para qualquer feature

1. Torna o futuro mais tangível?
2. Aumenta clareza sem decidir pelo usuário?
3. Sente seguro emocionalmente e plausível?
4. Suporta identidade contemplativa e imersiva?
5. Ajuda o MVP a provar valor core, ou é ruído?

Se a resposta for "não" para várias, a feature provavelmente ainda não pertence.

### Fontes da verdade

- **Detalhamento completo:** `docs/product-context.md` (leitura obrigatória antes de mudanças de produto/UX/AI/monetização).
- **Segundo cérebro Obsidian (cofre da marca Tranquili+):** `C:\Users\Erika Scalisse\OneDrive\Área de Trabalho\Tranquili Knowlage\Tranquili\`
  - [`Tranquili+/Tranquili+ - Essência da Marca.md`](../../../Tranquili%20Knowlage/Tranquili/Tranquili+/Tranquili%2B%20-%20Essência%20da%20Marca.md) — filosofia, valores, tom, ética
  - [`Tranquili+/TranquiliBrand/TranquiliWays.md`](../../../Tranquili%20Knowlage/Tranquili/Tranquili+/TranquiliBrand/TranquiliWays.md) — base do produto
  - [`Tranquili+/🗺️ Índice - Tranquili+.md`](../../../Tranquili%20Knowlage/Tranquili/Tranquili+/🗺️%20Índice%20-%20Tranquili+.md) — índice do cofre
  - PDFs: Personas (45 perfis), Mentalidade de Trampolim, Empatia, Instruções para IA Tranquilinha
  - Resumos de livros que moldaram a filosofia: *A Coragem de Não Agradar*, *O Poder do Subconsciente*, *Sinal Verde*, *Almanaque de Naval Ravikant*

**Quando uma mudança tocar marca, voz, filosofia, persona, ética ou identidade emocional → consultar o cofre antes de escrever.**

## Skill Automation Rules

These rules are mandatory. Claude must apply the correct skill automatically — no user prompt required.

### Always active

- **Every response:** invoke `caveman` to compress context and keep token usage lean before writing substantive answers or code.
- **Every new task:** invoke `find-skills` first to discover whether a more specific skill applies, then invoke that skill if found.

### Trigger map (invoke the skill when the condition matches)

| Condition | Skill |
| --- | --- |
| Building or changing any UI component, page, or visual element | `frontend-design` or `ui-ux-pro-max` |
| Adding animations, transitions, or micro-interactions | `animate` |
| Any creative or feature-building work before implementation | `superpowers:brainstorming` |
| Multi-step implementation task with a spec or requirements | `superpowers:writing-plans` then `superpowers:executing-plans` |
| Any bug, test failure, or unexpected behavior | `superpowers:systematic-debugging` |
| Before declaring a feature complete | `superpowers:verification-before-completion` |
| Code review requested or a dev branch is finished | `superpowers:requesting-code-review` |
| Security changes, auth flows, encryption, or API exposure | `security-review` |
| Code simplification or quality cleanup | `simplify` |
| Pushed commits or finished branch | `superpowers:finishing-a-development-branch` |
| Designing a new world/way experience or world concept | `game-designer` then `worldlabs` |
| Architecting or restructuring world/way generation system | `game-architecture` |
| Creating a new way or world from scratch (implementation) | `make-game` |
| Building or changing 3D world scenes, Three.js components | `threejs-game` then `add-3d-assets` |
| Adding 3D assets, environments, or visual elements to worlds | `game-3d-assets` or `add-3d-assets` |
| Improving world feel, immersion, or user experience | `improve-game` |
| QA or testing a world/way generation flow | `game-qa` |
| Reviewing a completed world feature | `review-game` |
| Adding audio/ambient sound to a world | `game-audio` or `add-audio` |

### Priority order when multiple skills apply

1. Process skills first (`superpowers:brainstorming`, `superpowers:systematic-debugging`)
2. World/game design skills second (`game-designer`, `game-architecture`, `worldlabs`)
3. Implementation skills third (`threejs-game`, `make-game`, `frontend-design`, `animate`, etc.)

## Required Reading

Before making edits or updates that affect product direction, UX, UI copy, AI behavior, loading flows, monetization, retention, or platform priorities, read `docs/product-context.md`.

If a proposed change conflicts with that document, stop and realign before implementing.

## Project Overview

TranquiliWays is a full-stack web app (with iOS/Android via Capacitor) that helps young users explore life dilemmas by generating AI-powered visual worlds that make possible futures feel tangible. The product should clarify possibilities without deciding for the user. The UI is in Portuguese (pt-BR).

## Commands

```bash
npm run dev              # Start local dev server
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm run format           # Run Prettier

# Mobile (requires a prior build)
npm run mobile:sync      # Build + sync to native (Capacitor)
npm run mobile:open:android   # Open Android project in IDE
npm run mobile:open:ios       # Open iOS project in IDE
```

TypeScript type-check (no emit):

```bash
npx tsc --noEmit
```

## Tech Stack

- **Framework:** React 19 + TanStack Start (full-stack) + TanStack Router (file-based routing)
- **Styling:** Tailwind CSS 4 + shadcn/ui (new-york style, slate base, Radix UI primitives)
- **Data fetching:** TanStack Query 5
- **Forms/validation:** React Hook Form + Zod
- **Animations:** Framer Motion / Motion
- **Backend:** TanStack Start server functions + Cloudflare Workers (via Wrangler)
- **AI:** gemini API for dilemma interpretation
- **Mobile:** Capacitor 7 (app ID: `com.tranquiliways.app`)
- **Build:** Vite 7 via `@lovable.dev/vite-tanstack-config` preset

Path alias: `@/*` → `./src/*`

## Architecture

### Routing (file-based, `src/routes/`)

| File                  | Route                   | Purpose                                             |
| --------------------- | ----------------------- | --------------------------------------------------- |
| `__root.tsx`          | —                       | HTML shell and root layout                          |
| `index.tsx`           | `/`                     | Landing page — dilemma input form                   |
| `ways.tsx`            | `/ways`                 | Gallery of locally saved TranquiliWays              |
| `ways/$sessionId.tsx` | `/ways/:id`             | Detail view of a generated or migrated DilemmaWorld |
| `api/sessions.ts`     | `POST /api/sessions`    | Create a journey session                            |
| `api/sessions/$id.ts` | `GET /api/sessions/:id` | Fetch a session                                     |

`routeTree.gen.ts` is auto-generated by TanStack Router — do not edit.

### Core Data Flow

1. User submits a dilemma on `/`
2. `POST /api/sessions` calls `interpret-dilemma.ts` which invokes the Claude API
3. Claude returns a **DilemmaWorld** with two paths and four environments each
4. The session is AES-GCM encrypted (`journey-session.ts`) and returned as a secure token
5. The generated session is saved locally in the way history store
6. User is redirected to `/ways/$sessionId` to view or revisit the world

### Key Data Model

```
DilemmaWorld
├── caminhoParado    (staying path)  — tone, colorScheme, 4× Ambiente
└── caminhoMudanca   (change path)  — tone, colorScheme, 4× Ambiente

Ambiente: visual description + symbolic elements (not literal text)
JourneySession: encrypted user input + DilemmaWorld + security token
```

### Key Files in `src/lib/`

| File                   | Responsibility                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| `interpret-dilemma.ts` | Claude API call + fallback heuristics if API unavailable              |
| `interpret-way.ts`     | Way interpretation logic                                              |
| `journey-session.ts`   | AES-GCM session encryption/decryption (Web Crypto API)                |
| `journey-api.ts`       | Client-side API call wrappers                                         |
| `way-history.ts`       | Local way history storage, migration, and session persistence helpers |
| `tranquili-native.ts`  | Capacitor native bindings (status bar, keyboard, haptics)             |
| `tranquili-voice.ts`   | Voice input capture                                                   |

### Design Conventions

- Mobile-first layout with safe-area support (`viewport-fit: cover`)
- Liquid glass button aesthetic, gradient-based path differentiation
- shadcn/ui components live in `src/components/ui/`; custom components alongside them in `src/components/`
- Custom hooks in `src/hooks/`
- Free tier: 3 AI generations per week enforced client-side

## Cloudflare / Deployment

`wrangler.jsonc` configures the Cloudflare Workers deployment. Node.js compatibility mode is enabled. The Vite config preset handles Cloudflare adapter wiring automatically.
