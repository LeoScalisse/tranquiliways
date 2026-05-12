# Design Spec: Mundo Isométrico 2.5D

> **SUPERSEDIDA — 2026-05-11**
> Esta spec nunca foi implementada. O projeto adotou React Three Fiber (`src/features/playable-world/`) com câmera ortográfica, hub + salas 3D sequenciais e state machine em `simulation.ts`. A abordagem Canvas 2D isométrica abaixo é mantida apenas como histórico de design.

**Data:** 2026-05-11
**Status:** Aprovado
**Referência visual:** [Creative Web Development with Three.js and Blender – 3D Portfolio for Beginners](https://www.youtube.com/watch?v=yhtdkuw9mbM) — molde de navegação: personagem anda pelo mundo, câmera segue, objetos interativos espalhados no mapa
**Substitui:** spec `2026-05-11-2.5d-world-exploration-design.md` (exploração com salas CSS separadas)

---

## Problema

O spec anterior criava 5 telas separadas (CharacterSelect → WorldHub → PathCorridor → AmbienteRoom → ElementDialogue) com navegação por clique em portas. A sensação de "mundo" era fragmentada — o usuário nunca via o mundo inteiro, apenas entrava e saía de cômodos isolados. Faltava a sensação de **explorar um espaço contínuo**.

---

## Solução

Substituir WorldHub + PathCorridor + AmbienteRoom por um **mapa isométrico único bifurcado** renderizado em Canvas 2D. O personagem anda livremente pelo mapa via tap-to-move. Os dois caminhos (Ficar/Mudar) formam zonas visíveis no mesmo mapa. Objetos cotidianos pixel art espalhados pelas zonas carregam os insights do DilemmaWorld.

---

## Decisões de Design

| Dimensão | Decisão |
| --- | --- |
| Perspectiva | Isométrica 2.5D (top-down 45° — estilo Pokémon/Stardew Valley) |
| Estrutura do mundo | Mapa único bifurcado — hub central + zona Ficar (dourado) + zona Mudar (violeta) |
| Movimento | Tap-to-move — toca no tile, personagem pathfinda e anda até lá |
| Hotspots | Objetos cotidianos pixel art (livro, planta, computador, mochila, espelho...) |
| Renderer | Canvas 2D nativo — sem Three.js, sem PixiJS |

---

## Arquitetura

### Fluxo de telas

```text
CharacterSelect  →  IsometricWorld (canvas)  →  ElementDialogue (overlay)
   (permanece)           (novo)                      (permanece)
```

### State machine — `useWorldStateMachine`

```ts
type WorldScreen =
  | { type: "character-select" }
  | { type: "world-map" }
  | { type: "element-dialogue"; hotspotId: string }
```

Três estados apenas. `world-map` cobre todo o tempo de exploração no canvas.

### Arquivos novos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/components/world/isometric-world.tsx` | Container do `<canvas>` + overlays React (anel de proximidade, labels) |
| `src/hooks/use-isometric-canvas.ts` | Game loop, rendering, câmera com lerp |
| `src/hooks/use-isometric-pathfinding.ts` | A* e movimentação do personagem |
| `src/lib/map-generator.ts` | `DilemmaWorld` → `MapData` (tiles + objetos posicionados) |

### Arquivos removidos

| Arquivo | Motivo |
| --- | --- |
| `src/components/world/world-hub.tsx` | Substituído pelo hub zone no canvas |
| `src/components/world/path-corridor.tsx` | Substituído pelas zonas no canvas |
| `src/components/world/ambiente-room.tsx` | Substituído pelos objetos no canvas |

### Arquivos intactos

`character-select.tsx`, `pixel-character.tsx`, `element-dialogue.tsx`, `world-explorer.tsx` (simplificado), `use-world-state-machine.ts` (simplificado), rota `/ways/$sessionId/world`, `interpret-dilemma.ts`, `model.ts`, `generation.ts`.

---

## Layout do Mapa

### Grid

- **Dimensões:** 28 colunas × 18 linhas
- **Tile size:** 64×32px (proporção 2:1 — padrão isométrico)
- **Viewport:** câmera mostra ~9×7 tiles de cada vez (otimizado para Android 360px)

### Divisão das zonas

```text
col:  0        12      14       28
      |---------|------|---------|
      |  ZONA FICAR   |  ZONA MUDAR  |
      |  (âmbar/      |  (violeta/   |
      |   dourado)    |   índigo)    |
      |       [ H U B ]              |
      |  col 12-16, row 7-11         |
      |-------------------------------|
```

- **Hub (col 12-16, row 7-11):** tiles neutros, ponto de entrada do personagem
- **Zona Ficar (col 0-13):** tiles com tint âmbar/dourado
- **Zona Mudar (col 15-28):** tiles com tint violeta/índigo
- **Fronteira (col 13-15):** 2 tiles de transição com gradiente de cor entre as zonas
- **Borda externa:** tiles `blocked` intransponíveis — criam limite natural sem muro visível

### Tipos de tile

```ts
type TileType = "hub" | "ficar" | "mudar" | "border" | "blocked"
```

### Câmera

- Segue o personagem com **lerp** (fator 0.1 por frame) — movimento suave e contemplativo
- Limitada aos bounds do mapa — nunca mostra área além do grid
- Escala fixa — sem zoom no MVP

---

## Rendering Pipeline

### Game loop

```ts
// use-isometric-canvas.ts
useEffect(() => {
  const loop = () => {
    update(delta)   // avança personagem ao longo do path
    render(ctx)     // desenha tudo
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(rafId)
}, [])
```

### Ordem de rendering (painters algorithm — depth sort por col + row)

```text
1. Ground tiles      — todos os losangos de chão (cor por TileType)
2. Zone tint overlay — camada semitransparente dourada/violeta por zona
3. Objects           — objetos pixel art, depth-sorted
4. Character         — sprite do personagem (por cima dos objetos)
5. Labels + rings    — desenhados no próprio canvas (ctx.strokeStyle, ctx.font)
```

Labels e proximity rings são desenhados **no canvas** (não como overlay React), o que elimina a necessidade de sincronizar coordenadas entre canvas e DOM. O `useIsometricCanvas` expõe via ref apenas `nearbyHotspotId: string | null` — quando não-nulo, o `IsometricWorld` renderiza o `ElementDialogue` como overlay React sobre o canvas inteiro.

### Tile drawing

```ts
function drawTile(ctx, screenX, screenY, type: TileType) {
  ctx.beginPath()
  ctx.moveTo(screenX,      screenY - 16)  // topo
  ctx.lineTo(screenX + 32, screenY)       // direita
  ctx.lineTo(screenX,      screenY + 16)  // base
  ctx.lineTo(screenX - 32, screenY)       // esquerda
  ctx.closePath()
  ctx.fillStyle = TILE_COLORS[type]
  ctx.fill()
  ctx.strokeStyle = TILE_STROKE[type]
  ctx.lineWidth = 0.5
  ctx.stroke()
}
```

### Fórmulas de conversão ISO ↔ Screen

```ts
// ISO → Screen
screenX = (col - row) * 32   // TILE_W / 2
screenY = (col + row) * 16   // TILE_H / 2

// Screen → ISO (para tap-to-move)
col = (screenX / 32 + screenY / 16) / 2
row = (screenY / 16 - screenX / 32) / 2
```

---

## Sistema de Objetos

### MapObject

```ts
type MapObject = {
  col: number
  row: number
  sprite: SpriteName
  label: string           // ex: "diário", "decisão"
  hotspot: HotspotData    // prompt + insight do DilemmaWorld
  pathId: "parado" | "mudanca"
}
```

### Mapeamento ambiente → objetos

Cada `RoomId` define 2–3 sprites. O `mapGenerator.ts` seleciona e posiciona os objetos nas zonas correspondentes ao caminho:

```ts
const ROOM_OBJECTS: Record<RoomId, SpriteName[]> = {
  quarto:    ["bed", "book", "mirror"],
  cafe:      ["cup", "laptop", "plant"],
  biblioteca:["bookshelf", "lamp", "globe"],
  trabalho:  ["computer", "folder", "clock"],
  familia:   ["photo", "plant", "sofa"],
  academia:  ["weights", "bottle", "sneaker"],
  jardim:    ["flower", "bench", "bird"],
  cozinha:   ["pot", "fruit", "knife"],
  varanda:   ["chair", "mug", "string-light"],
  carro:     ["wheel", "map", "sunglasses"],
  escola:    ["pencil", "backpack", "chalkboard"],
  escritorio:["briefcase", "monitor", "stapler"],
  hospital:  ["pillow", "medicine", "flower"],
  praia:     ["shell", "towel", "wave"],
  sala:      ["remote", "sofa", "clock"],
}
```

Sprites são desenhados diretamente no canvas via **canvas 2D API** (`fillRect`, `arc`, `beginPath`) — formas geométricas simples que formam a silhueta do objeto. Sem sprite sheet externo, sem assets de imagem. O `PixelCharacter` CSS existente é reaproveitado apenas na tela `CharacterSelect`; dentro do canvas o personagem também é desenhado via canvas API.

### Posicionamento no mapa

O `mapGenerator` recebe o `DilemmaWorld` e distribui os objetos de cada caminho na zona correspondente, evitando sobreposição e mantendo espaço para o personagem caminhar:

- Zona Ficar: objetos dos ambientes do `caminhoParado` distribuídos em cluster no terço esquerdo
- Zona Mudar: objetos dos ambientes do `caminhoMudanca` distribuídos no terço direito
- Hub: sem objetos — espaço de chegada neutro

---

## Sistema de Interação

### Tap-to-move

```text
Toque no canvas
  → screen coords → ISO coords (arredondamento para tile inteiro)
  → tile walkable?
    ├── sim → A* calcula path → personagem anda
    └── não → snap para tile walkable vizinho mais próximo
```

### A* pathfinding

Grid 28×18 = 504 nós — A* completo roda em <1ms. Custo:

```ts
// Tiles normais:  custo 1
// Tiles com objeto: custo 999 (intransponível — personagem contorna)
// Tiles blocked:  excluídos do grafo
```

### Movimento do personagem

```ts
type CharacterState = {
  pos: IsoCoord        // posição atual (fracionária durante movimento)
  path: IsoCoord[]     // tiles restantes
  facing: "left" | "right"
  moving: boolean
}
```

- **Velocidade:** 1 tile a cada ~200ms — ritmo contemplativo
- **Interpolação:** linear entre tiles (sem aceleração/desaceleração — mantém leveza)
- Ao completar cada tile: verifica proximidade de hotspots

### Detecção de proximidade

```ts
function checkProximity(pos: IsoCoord, objects: MapObject[]) {
  return objects.find(obj =>
    Math.abs(obj.col - pos.col) + Math.abs(obj.row - pos.row) <= 1
  )
}
```

Objeto próximo → anel pulsante (Framer Motion, React overlay) aparece sobre o objeto.

### Tap direto num objeto

- Personagem **longe** → anda até adjacente, então abre diálogo automaticamente
- Personagem **já adjacente** → abre diálogo imediatamente

### Gestos adicionais (Android)

- **Swipe no canvas** → pan leve da câmera sem mover personagem (para explorar visualmente)
- **Double tap no personagem** → centraliza câmera nele
- Sem botões extras durante exploração — máxima área de canvas visível

---

## Fluxo de Dados Completo

```text
DilemmaWorld (gerado pela IA Gemini)
  ↓ mapGenerator.ts
MapData {
  tiles: TileType[][]
  objects: MapObject[]     ← cada objeto carrega hotspot do DilemmaWorld
  characterStart: IsoCoord ← hub center
}
  ↓ useIsometricCanvas + useIsometricPathfinding
Canvas interativo
  ↓ proximidade / tap em objeto
useWorldStateMachine → { type: "element-dialogue", hotspotId }
  ↓
ElementDialogue (overlay React)
  exibe hotspot.prompt + revela hotspot.insight letra por letra
```

---

## O que NÃO está no escopo desta spec

- Joystick virtual (pode ser adicionado depois como complemento ao tap-to-move)
- Sons / trilha sonora
- Animação de walking em spritesheet (personagem usa float animation atual)
- Geração de sprites por IA
- Persistência de quais objetos foram visitados
- Modo multiplayer

---

## Ordem de Implementação Sugerida

1. `map-generator.ts` — lógica pura, testável sem canvas
2. `use-isometric-pathfinding.ts` — A* independente de rendering
3. `use-isometric-canvas.ts` — game loop + rendering de tiles
4. Rendering de objetos no canvas (sprites pixel art)
5. `isometric-world.tsx` — integra canvas + overlays React
6. Tap-to-move wired + movimento do personagem
7. Detecção de proximidade + anel pulsante
8. Simplificar `use-world-state-machine.ts` (remover estados hub/corredor/sala)
9. Simplificar `world-explorer.tsx`
10. Remover `world-hub.tsx`, `path-corridor.tsx`, `ambiente-room.tsx`
