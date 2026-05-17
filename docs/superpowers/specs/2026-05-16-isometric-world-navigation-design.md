# Design: Mundo Isométrico 2.5D — Navegação por Personagem

**Data:** 2026-05-16  
**Status:** Aprovado pelo usuário  
**Escopo:** Substituir navegação por botões do mundo playable por exploração isométrica com personagem customizável

---

## 1. Visão Geral

Substituir o sistema atual de seleção de caminho por botões por um mundo 2.5D isométrico navegável via D-pad (+) no mobile e WASD/setas no desktop. O usuário controla um avatar customizável que explora hubs e ambientes gerados por IA em Three.js, representando os possíveis futuros do seu dilema.

---

## 2. Estrutura do Mundo

### Hierarquia de cenas

```
HUB NUVEM (ponto de entrada, fixo, não gerado por IA)
├── Porta PARADO → HUB PARADO (gerado por IA, temático ao dilema)
│   ├── Ambiente 1
│   ├── Ambiente 2
│   └── ... (2–5 ambientes, IA decide)
└── Porta MUDANÇA → HUB MUDANÇA (gerado por IA, temático ao dilema)
    ├── Ambiente 1
    ├── Ambiente 2
    └── ... (2–5 ambientes, IA decide)
```

### Hub Nuvem

- Estético branco/etéreo — clouds, tudo claro, sem elementos AI
- Duas portas com glow colorido: azul (parado) e dourado (mudança)
- Labels de caminho (ex: "Manter as coisas como estão" / "Sair da zona de conforto")
- Ponto de partida sempre que o usuário entra no mundo
- Fixo — não varia por dilema

### Hubs de Caminho

- Gerados por IA com base no dilema específico
- Funcionam como antessala temática dos ambientes daquele lado
- Ex: dilema de emprego → hub parado = escritório familiar; hub mudança = novo espaço desconhecido

### Ambientes

- 2–5 por caminho (IA determina conforme profundidade do dilema)
- Cada ambiente = cena isométrica que representa consequência/etapa daquele caminho
- Acessíveis a partir do hub do caminho
- Usuário tem liberdade total: pode voltar, mudar de lado, revisitar qualquer cena

### Navegação livre

- Hub Nuvem ↔ Hub Caminho ↔ Ambientes: bidirecional em qualquer ordem
- Sem linearidade obrigatória

---

## 3. Controles

### Mobile (touch)

- D-pad em formato `+` (Tranquili+ brand)
- Opacity: ~0.4 (levemente transparente)
- Aparece imediatamente ao toque
- Desaparece suavemente (transition 600ms) após **5 segundos** sem toque
- Posição: canto inferior esquerdo (overlay)

### Desktop

- Invisível — sem D-pad visual
- Navegação via `ArrowUp/Down/Left/Right` ou `W A S D`
- Listener `keydown` via `use-directional-input`

### Hook unificado: `use-directional-input`

Emite `{ dx: -1 | 0 | 1, dy: -1 | 0 | 1 }` independente de touch vs teclado. Consumido por `IsometricWorld`.

---

## 4. Modelo de Dados

### DilemmaWorld (atualizado)

```ts
type Ambiente = {
  visualDescription: string
  symbolicElements: string[]
}

type Caminho = {
  tone: string
  colorScheme: string
  hubDescription: string   // NOVO — descreve o hub temático do caminho
  ambientes: Ambiente[]    // ALTERADO — array 2–5 (era tuple fixo de 4)
}

type DilemmaWorld = {
  hubNuvem: {              // NOVO — hub central fixo
    portaParado: { label: string; color: string }
    portaMudanca: { label: string; color: string }
  }
  caminhoParado: Caminho
  caminhoMudanca: Caminho
}
```

### Scene state

```ts
type Scene =
  | { type: "hub-nuvem" }
  | { type: "hub-caminho"; path: PathId }
  | { type: "ambiente"; path: PathId; index: number }
```

### CharacterCustomization (localStorage)

```ts
type CharacterCustomization = {
  skinColor: string
  hairStyle: string
  hairColor: string
  eyeColor: string
  shirt: string
  shirtColor: string
  pants: string
  pantsColor: string
  shoes: string
  shoeColor: string
}
```

---

## 5. Mudanças na IA (interpret-dilemma.ts)

- Prompt instrui a IA a gerar `hubDescription` para cada caminho
- Prompt instrui a IA a decidir número de ambientes (2–5) conforme complexidade do dilema:
  - Dilema simples/objetivo → 2–3 ambientes
  - Dilema complexo/multifacetado → 4–5 ambientes
- `hubNuvem.portaParado.label` e `portaMudanca.label` = frases curtas geradas por IA descrevendo cada caminho
- Hub nuvem em si não é gerado — apenas os labels das portas

---

## 6. Arquitetura de Componentes

### Novos arquivos

```
src/features/playable-world/ui/
  isometric-world.tsx           — renderiza hub + cenas 2.5D, gerencia currentScene
  directional-pad.tsx           — controle + com lógica touch/auto-hide

src/components/
  character-customizer.tsx      — modal de customização (balloons + arrows)
  character-avatar.tsx          — avatar 2.5D renderizado (CSS/SVG/sprite)

src/hooks/
  use-character-customization.ts  — lê/escreve localStorage
  use-directional-input.ts        — unifica touch + WASD/arrows → direção
```

### Arquivos modificados

```
src/features/playable-world/ui/playable-world-experience.tsx  — usa IsometricWorld
src/features/playable-world/model.ts   — DilemmaWorld atualizado
src/lib/interpret-dilemma.ts           — prompt + tipos novos
src/routes/index.tsx                   — adiciona botão personagem (liquid glass pill)
```

### Hierarquia de componentes no mundo

```
WorldExplorationPage
  └── PlayableWorldExperience
        ├── IsometricWorld (currentScene: Scene)
        │     ├── SceneHubNuvem
        │     ├── SceneHubCaminho (path)
        │     └── SceneAmbiente (path, index)
        └── DirectionalPad (mobile overlay)
```

---

## 7. Customização de Personagem

### Acesso

Botão liquid glass pill no canto superior direito da home (`/`), espelhando o botão "Ways" (esquerda superior). Abre modal fullscreen.

### UI do modal

- Avatar centralizado na tela
- Balloons flutuantes apontando para partes do corpo (cabelo, olhos, roupa, calça, sapatos)
- Tap num balloon → ativa aquele atributo → exibe ◀ ▶ nas laterais do avatar
- Somente um atributo ativo por vez
- ◀ ▶ cycla pelas opções do atributo (estilo + cor)

### Atributos

`skinColor` · `hairStyle` · `hairColor` · `eyeColor` · `shirt` · `shirtColor` · `pants` · `pantsColor` · `shoes` · `shoeColor`

### Persistência

`use-character-customization` lê/escreve em `localStorage`. Avatar reflete customização em todas as cenas do mundo.

---

## 8. Transições entre Cenas

| De → Para | Transição |
|-----------|-----------|
| Hub nuvem → Hub caminho | personagem caminha até porta → fade dissolve |
| Hub caminho → Ambiente | personagem caminha p/ borda → slide lateral |
| Ambiente N → Ambiente N+1 | slide lateral (sentido do movimento) |
| Qualquer → Hub (voltar) | slide reverso + fade leve |

- Biblioteca: `motion/react` (AnimatePresence)
- Duração: ~400ms
- Easing: `[0.16, 1, 0.3, 1]` (consistente com o resto do app)

---

## 9. Stack Técnico — Three.js + World Labs + Meshy AI

### Engine: Three.js

- **Renderer**: `THREE.WebGLRenderer({ antialias: false })` — `antialias: false` porque SparkJS tem AA próprio
- **Loop**: `renderer.setAnimationLoop()` — pausa em aba escondida, compatível com WebXR
- **Delta cap**: `Math.min(clock.getDelta(), 0.1)` — evita death spirals
- **Pixel ratio**: `Math.min(devicePixelRatio, 2)` — protege GPU em high-DPI

**Arquitetura obrigatória (threejs-game skill):**

```text
src/features/playable-world/
  core/
    EventBus.ts       — pub/sub entre módulos (nunca import direto)
    GameState.ts      — estado centralizado + reset()
    Constants.ts      — zero magic numbers no código
  systems/
    InputSystem.ts    — WASD/arrows + touch D-pad → dx/dy unificado
  level/
    AssetLoader.ts    — GLTFLoader + SkeletonUtils.clone()
    WorldLoader.ts    — SparkRenderer + SplatMesh (World Labs)
  ui/
    IsometricWorld.tsx
    DirectionalPad.tsx
```

### Ambientes: World Labs (Gaussian Splat)

- **API**: World Labs Marble API → gera `.spz` (visual) + `.glb` (collider) por cena
- **Renderer**: `@sparkjsdev/spark@^2.0.0` — `SparkRenderer` + `SplatMesh`
- **Cenas geradas por IA**: hub de cada caminho + cada ambiente (2–5 por caminho)
- **Hub Nuvem**: cena Three.js manual (branco/etéreo, nuvens volumétricas) — não usa World Labs
- **Input para geração**: `hubDescription` e `visualDescription` do `DilemmaWorld` viram prompts da World Labs API
- **Resolução**: 500k SPZ (desktop) / 100k SPZ (mobile via Capacitor)
- **Collider**: malha GLB invisível para raycasting de ground/paredes

### Personagem: Meshy AI

- **Geração**: `meshy-generate.mjs --mode text-to-3d` → personagem base low-poly
- **Rig**: `--mode rig` → skeleton humanóide automático
- **Animações**: idle, walk (geradas via pipeline Meshy)
- **Customização de cor/material**: `MeshStandardMaterial.color` por parte do corpo (cabeça, torso, pernas, pés) — sem regenerar o GLB
- **Variantes de estilo** (hairStyle, shirt, pants): conjunto pequeno de GLBs pré-gerados
- **Clone**: `SkeletonUtils.clone()` — nunca `.clone()` direto em modelo animado

### Skills a invocar durante implementação

| Fase                    | Skill                          |
| ----------------------- | ------------------------------ |
| Arquitetura Three.js    | `threejs-game`                 |
| Geração de ambientes    | `worldlabs`                    |
| Geração/rig do avatar   | `meshyai` → `add-3d-assets`    |
| Performance             | `threejs-perf`                 |
| Polimento visual        | `improve-game`                 |
| QA do mundo             | `game-qa`                      |

---

## 10. Visual Target

- Estilo: 2.5D isométrico low-poly 3D, paleta suave, iluminação quente
- Referência: imagem fornecida (hub com personagem, duas portas com glow, caminhos de pedra, árvores)
- Hub Nuvem: branco/etéreo — Three.js puro (fog, PointLight branco, plano de nuvens)
- Hubs de caminho + ambientes: Gaussian Splat via World Labs

---

## 11. Fora de Escopo (MVP)

- Som ambiente (deferido — skill `game-audio` na próxima fase)
- Walk cycle completo (idle + walk suficientes agora)
- WebGPURenderer / TSL shaders (avaliado após MVP)
- Interações com objetos dentro dos ambientes
- Postprocessing (bloom, SSAO) — apenas após validar perf mobile
