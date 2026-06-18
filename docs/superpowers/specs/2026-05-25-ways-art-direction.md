# Direção de Arte — TranquiliWays

**Data:** 2026-05-25
**Status:** Proposta (aguardando aprovação)
**Origem:** Análise do app Rooms.xyz (a16z, $10M seed) — editor 3D voxel-cozy com feed comunitário.
**Convergência:** A spec `2026-05-18-world-visual-richness-design.md` já estabeleceu `PropFactory` com primitivas voxel. Esta spec aprofunda e codifica a linguagem visual completa, alinhando com a marca Tranquili+.

> **Princípio organizador:** 70% contemplativo + inspirador, 30% prático + acionável. Tudo o que segue deve servir a esse balanço. Se uma escolha visual aumenta engajamento mas reduz contemplação, ela está errada.

---

## 1. Por que essa direção (filtro de decisão de produto)

| Filtro do produto | Como o voxel-cozy responde |
|-------------------|----------------------------|
| Torna o futuro tangível? | Volumes 3D explorados em primeira pessoa virtual são mais tangíveis que ilustrações 2D — você "anda dentro". |
| Aumenta clareza sem decidir? | Ambientes simbólicos abstratos (não narrativos) sugerem sem prescrever. |
| Sente seguro e plausível? | Estilo "de brinquedo" reduz peso emocional vs realismo fotográfico, que pode parecer manipulador. |
| Suporta identidade contemplativa? | Paleta dessaturada + escala íntima + movimento lento criam respiração visual. |
| Ajuda o MVP a provar valor? | Composição via biblioteca de primitivas = geração rápida + previsível dentro do budget de 1m30s. |

Estilo realista (Gaussian Splat / World Labs) foi avaliado em 2026-05-16 mas o repo pivotou (commit `de1f475` removeu `WorldLoader`/`SparkRenderer`) — fotorrealismo conflita com o filtro "plausível, nunca fantasioso" porque vira "promessa visual" do futuro em vez de "símbolo do futuro".

---

## 2. Matriz Rooms.xyz × TranquiliWays

| Dimensão | Rooms faz | Ways toma emprestado? | Por quê |
|----------|-----------|------------------------|---------|
| Primitivas voxel/cubo compostas | ✅ Sim | ✅ **Adotar** | Pipeline mobile-friendly, geração rápida, estética acolhedora |
| Paleta pastel cozy | ✅ Sim | ✅ **Adotar com sistema** | Marca Tranquili+ ("+leve, +calma") — mas paleta deve responder ao dilema, não ser fixa |
| Câmera flythrough orbital | ✅ Sim | ✅ **Adotar parcialmente** | Substituir orbital pelo modo "contemplativo" (ver §5) |
| Escala íntima de "quarto" | ✅ Sim | 🔄 **Reduzir escala atual** | Hoje 14×14 plano = diorama; alvo é 6×6 a 8×8 = espaço habitável |
| Biblioteca curada de assets | ✅ +20k user-gen | ✅ **Adotar (curada por nós)** | Garante coerência estética e segurança simbólica |
| Lua scripting de objetos | ✅ Sim | ❌ **Ignorar** | Adiciona complexidade sem servir clareza emocional |
| Feed vertical estilo TikTok | ✅ Sim | ❌ **Rejeitar** | Viola "bem-estar antes de engajamento" |
| Remix social / community | ✅ Sim | ❌ **Rejeitar** | Dilema é íntimo; expor à comunidade quebra segurança emocional |
| Gamificação (achievements, scores) | ⚠️ Leve | ❌ **Rejeitar** | Conflita com identidade contemplativa |
| Animação de personagens chibi | ✅ Sim | 🔄 **Avaliar** | Hoje personagem é estático (commit `3291ac8`); pode reintroduzir movimento sutil de respiração/idle |

**Síntese:** absorver técnica visual, rejeitar mecânicas de produto. Ways é Rooms purificado da camada social/game.

---

## 3. Sistema de paletas (per-mood)

A paleta sai do `colorScheme` que a IA já gera em cada `Caminho`. Codificamos 6 paletas-âncora; a IA mapeia o caminho para a mais próxima ou interpola.

### Estrutura de cada paleta

```ts
type RoomPalette = {
  skyTop: string      // hemisphere superior — tom emocional do "céu"
  ground: string      // hemisphere inferior — base do espaço
  prop: string        // cor dominante dos objetos
  accent: string      // detalhe (almofada, lâmpada, livro destacado)
  glow: string        // luz pontual quente
  fog: string         // distância — neblina suave
  surface: string     // piso/tatame
}
```

### Paletas âncora

| ID | Mood emocional | skyTop | ground | prop | accent | glow |
|----|----------------|--------|--------|------|--------|------|
| `acolhimento` | Conforto, segurança, "ficar" saudável | `#F5E6D3` (creme rosado) | `#E8D5C4` (areia clara) | `#D4A574` (madeira clara) | `#A8C4B0` (verde sálvia) | `#FFCB91` (sol manhã) |
| `inercia` | Estagnação, "ficar" doloroso | `#9CA8A8` (cinza-azul) | `#7D8585` (cinza médio) | `#8B8378` (taupe morto) | `#5C6670` (azul-cinza) | `#B8A88C` (luz sem calor) |
| `despertar` | Movimento inicial, possibilidade | `#FDE4CF` (pêssego) | `#F5C9A8` (areia quente) | `#E89B6C` (terracota) | `#7FB7BE` (turquesa pálido) | `#FFD56B` (sol pleno) |
| `transformacao` | Mudança plena, vitalidade | `#C8E4DD` (verde-água) | `#A8C9C0` (verde mineral) | `#9DBBAF` (verde sábio) | `#D49A6A` (cobre) | `#F4C75E` (mel) |
| `incerteza` | Mudança ansiosa, vertigem | `#D8C3DB` (lavanda) | `#A89BB5` (violeta neutro) | `#8F7FA8` (ametista fosca) | `#E8B5C2` (rosa empoeirado) | `#C9A8E0` (luz lilás) |
| `chama` | Direção clara, propósito | `#F4D4A8` (dourado quente) | `#E8B584` (caramelo) | `#D49555` (âmbar) | `#7B8B5F` (oliva profundo) | `#FFB860` (chama doce) |

**Regras invioláveis:**
- Nenhuma cor `#000000` ou `#FFFFFF` puros — sempre matizado
- Saturação máxima: 40% (sem cores "shock")
- Contraste piso↔prop ≥ 1.5 mas ≤ 3.0 (visível mas suave)
- O `accent` aparece em ≤ 15% dos props da cena (regra 80/15/5)

---

## 4. Iluminação

A spec atual (`2026-05-18`) já estabeleceu `HemisphereLight` + `DirectionalLight` com PCFSoftShadowMap. Esta direção refina:

```ts
// Hemisphere — base ambiental
new THREE.HemisphereLight(palette.skyTop, palette.ground, 0.7)
// (era 0.9 → reduzir para deixar a directional brilhar mais)

// Directional — sol baixo (golden hour permanente)
const sun = new THREE.DirectionalLight(palette.glow, 1.2)
sun.position.set(4, 6, 5)  // mais baixo que antes (era 6,10,4) — sombras longas
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.normalBias = 0.08
sun.shadow.bias = -0.0005

// Fog — fundo do espaço se dissolve, reforça intimidade
scene.fog = new THREE.Fog(palette.fog, 8, 22)

// Renderer
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.3  // era 1.4 → leve redução evita lavar
```

**Princípio:** "golden hour permanente". Nunca meio-dia (sombras curtas = clínico) nem noite (sombras duras = ameaçador). Sempre 16h-18h.

---

## 5. Câmera

### Modo padrão: contemplativo

- Câmera ortográfica isométrica (mantém o que já existe)
- **Drift sutil:** após 3s parada, câmera oscila ±0.3 unidades em X/Z numa senoide de 8s — sensação de respiração, nunca robótica
- Lerp factor para acompanhar personagem: `0.06` (era `0.1`) — mais lento, mais contemplativo

### Modo flythrough (novo — para abertura de cena)

- 4 segundos quando a Ambiente carrega: câmera começa elevada e distante, desce e aproxima até a posição padrão
- Curva: `easeOutCubic`
- Personagem entra com fade-in no segundo 2
- Durante o flythrough: input bloqueado, label do ambiente aparece centralizado, sai com fade

### O que NÃO fazer

- Sem zoom no MVP (rompe a leitura isométrica)
- Sem rotação livre (vira game; quebra contemplação)
- Sem first-person (quebra a leitura simbólica de "ver minha vida de fora")

---

## 6. Props — princípios de design

A spec `2026-05-18` lista 15 tipos. Esta direção adiciona **regras de forma** que todos devem seguir.

### Regras de silhueta

1. **Exagero "de brinquedo":** props 20–30% maiores do que o realista. Uma cadeira de 0.4×0.07×0.4 vira 0.5×0.10×0.5. Assinatura visual reconhecível.
2. **Cantos arredondados (futuro):** quando trocar `BoxGeometry` por `RoundedBoxGeometry`, raio = 8% do menor lado. Suaviza sem perder o voxel.
3. **Variação por seed do prop:** posição com jitter ±5%, rotação Y ±8°. Quebra o "AI gerado em grid".
4. **Cluster, nunca espalhado uniforme:** props gravitam em grupos de 2–4 (livros perto da cadeira, planta perto da janela). Cenário tem "pontos de descanso visual".

### Hierarquia simbólica

Cada Ambiente recebe da IA um `symbolicElements: string[]` (já no modelo). Convenção visual:

- **Símbolo central (1 por cena):** prop maior, sob a `DirectionalLight`, em `palette.accent`. É o ponto que diz "olhe aqui".
- **Símbolos de suporte (2–3):** props médios, em `palette.prop`. Contam o entorno.
- **Ambiente (resto):** props pequenos, em `palette.prop` matizado com `lerp(palette.ground, 0.3)`. Existem para a cena respirar, não para ler.

### Anti-pattern: prop "literal demais"

Se a IA pede `monumento-do-emprego-anterior`, o `PropFactory` retorna fallback cúbico — não inventa modelo literal. **Símbolo > literalidade.** Manter a curadoria fechada nos 15 tipos atuais até MVP validar.

---

## 7. Movimento e som ambiente (preparação)

Esta spec **não** implementa, mas codifica o que entra depois:

| Camada | Quando | Onde |
|--------|--------|------|
| Idle do personagem (respiração) | Próxima iteração visual | `add-3d-assets` (reintroduzir animação leve sem walk completo) |
| Particles sutis (poeira, faíscas) | Pós-MVP | `THREE.Points` com 20–40 partículas, opacidade ≤ 0.4 |
| Ambient audio (Web Audio API) | Skill `add-audio` | 1 loop por mood (6 paletas → 6 ambient pads), volume default 0.3 |
| Reactive sound em proximidade de prop | Pós-MVP | Tick discreto ao entrar no anel de proximidade |

Princípio: cada camada adicionada deve passar pelo filtro contemplativo. Som que "premia" interação está fora — som que "acompanha presença" está dentro.

---

## 8. Hub Nuvem (cena fixa de entrada)

Mantém a especificação do `2026-05-16` mas alinha:

- Fundo `#F5F0EA` (branco quente — nunca `#FFFFFF`)
- Fog `#E8DFCE` densa entre 4 e 12 unidades
- Sem `DirectionalLight` — apenas `HemisphereLight(#FFF7E8, #E0D4C0, 1.0)` (luz difusa de "estar dentro de uma nuvem")
- Portas com glow correspondente à paleta dominante do caminho (não cor fixa azul/dourado)

---

## 9. Tipografia e UI dentro do mundo

Labels que aparecem sobre o canvas (nome do ambiente, frases-âncora):

- Fonte: a mesma do app (manter consistência)
- Peso: 300 (light) sempre — nunca bold dentro do mundo
- Cor: `palette.accent` com opacidade 0.85
- Anti-fundo: backdrop blur 8px + camada `palette.skyTop` a 0.3 alpha (legibilidade sem placa retangular dura)
- Animação de entrada: fade + translate Y 8px, duração 600ms, easing `[0.16, 1, 0.3, 1]` (já é o padrão do app)

---

## 10. Anti-padrões — o que recusar mesmo se pedirem

| Tentação | Por que recusar |
|----------|------------------|
| Adicionar HUD com tempo/score/coleta | Vira game; quebra contemplação |
| Compartilhar mundo gerado em redes | Dilema é íntimo; exposição quebra segurança |
| Modo "noturno dramático" | Estética de horror não cabe no propósito de bem-estar |
| Vibrações/haptics frequentes | Reforça loop de engajamento; usar haptic só na chegada de insight |
| Cores neon ou alta saturação | Conflita com Tranquili+ (+leve, +calma) |
| Modelos GLB realistas comprados de marketplace | Quebra coerência visual com os primitivos |
| Texto longo dentro do mundo 3D | Tira da imersão; reflexão vai para o overlay de `ElementDialogue` |
| Música épica/cinemática | "Promessa de futuro" manipuladora; ambient pads neutros apenas |

---

## 11. Moodboard textual (3 cenas-piloto)

### Cena A — "Quarto que ficou" (paleta `inercia`)

> Câmera baixa, sol filtrado por persiana imaginária (sombras paralelas no chão). Cama desfeita à esquerda, livro fechado sobre criado-mudo, planta com folhas pendendo no canto. Cor dominante: taupe esverdeado morto. Símbolo central: relógio parado sobre a estante (em `palette.accent` cinza-azul). Nada se move além do drift da câmera. Sensação: silêncio que pesa, sem ameaçar.

### Cena B — "Mesa da decisão" (paleta `despertar`)

> Pequeno espaço com mesa redonda de madeira clara no centro. Sobre a mesa: caderno aberto (símbolo central, accent turquesa), caneca fumegante, planta pequena. Cadeira virada para fora da mesa, sugerindo movimento iminente. Janela à direita deixa luz pêssego entrar. Sol baixo, sombras longas. Sensação: o convite suave, não a pressão.

### Cena C — "Caminho que se abre" (paleta `chama`)

> Não é um interior — é um pequeno pátio. Banco de pedra ao centro. Árvore esquerda projeta sombra acolhedora. Caminho de pedras leva para fora do enquadramento (sem revelar destino). Lâmpada baixa acesa apesar de ainda haver sol — sugere "qualquer hora é hora de ir". Símbolo central: a lâmpada (accent oliva). Sensação: começo, sem pressa.

Estas três cenas devem servir como teste de aderência: se um futuro Ambiente gerado pela IA não consegue ser descrito nesse registro, a IA precisa ser ajustada antes do `PropFactory`.

---

## 12. O que esta spec exige

### Mudanças imediatas (próximas 1–2 sessões)

1. Adicionar tipo `RoomPalette` e tabela das 6 paletas-âncora em `src/features/playable-world/level/palettes.ts` (novo arquivo)
2. Atualizar `interpret-dilemma.ts` para a IA escolher um `paletteId` entre as 6 por caminho, em vez de gerar `colorScheme` livre
3. Reduzir `HemisphereLight` para 0.7 e `toneMappingExposure` para 1.3 em `scene-ambiente.ts`
4. Adicionar `scene.fog` per-mood em `scene-ambiente.ts`
5. Reduzir lerp da câmera para 0.06 em `isometric-world.tsx`
6. Implementar drift contemplativo da câmera (oscilação senoidal)

### Mudanças seguintes (2–3 sessões depois)

7. Adicionar modo flythrough de 4s na abertura de Ambiente
8. Reduzir tamanho dos planos de chão de 14×14 para 8×8 (intimidade)
9. Aumentar tamanho relativo dos props em 20–30%
10. Implementar jitter de posição/rotação no `PropFactory`
11. Implementar clustering em `scene-ambiente.ts` (props gravitam, não distribuem uniforme)

### Fora desta spec (decidir depois)

- Reintrodução de animação de personagem (skill `add-3d-assets`)
- Ambient audio (skill `add-audio`)
- Particles (avaliação após validar MVP)
- Migração para `RoundedBoxGeometry` (avaliação de custo de performance mobile)

---

## 13. Critérios de aceitação

Esta direção está cumprida quando:

- [ ] Toda Ambiente gerada usa uma das 6 paletas-âncora
- [ ] Nenhuma cena tem cor com saturação > 40% ou puro preto/branco
- [ ] Câmera respira mesmo parada
- [ ] Símbolo central de cada cena é visualmente identificável em ≤ 2 segundos
- [ ] Usuário descreve a sensação da cena em palavras emocionais ("calmo", "pesado", "convidativo"), não funcionais ("um quarto com cama")
- [ ] Loading até primeira Ambiente navegável ≤ 1m30s
- [ ] Nenhum frame de 60fps perdido durante drift da câmera em Android mid-range

---

## 14. Referências

- Spec relacionada: [`2026-05-18-world-visual-richness-design.md`](./2026-05-18-world-visual-richness-design.md) — `PropFactory` base
- Spec relacionada: [`2026-05-16-isometric-world-navigation-design.md`](./2026-05-16-isometric-world-navigation-design.md) — câmera/navegação
- Inspiração externa: Rooms.xyz (a16z) — voxel-cozy 3D, biblioteca curada de primitivos
- Brand: `docs/product-context.md` (princípios, voz, balanço 70/30)
- Brand profundo: cofre Obsidian `Tranquili Knowlage/Tranquili/Tranquili+/`
