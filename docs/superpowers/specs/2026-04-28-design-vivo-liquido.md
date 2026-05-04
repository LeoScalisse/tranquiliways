# TranquiliWays — Design Vivo e Líquido

**Data:** 2026-04-28  
**Abordagem aprovada:** B — Líquido + Etéreo

## Resumo

Trazer vida ao app com física de mola nos 3 momentos-chave escolhidos pelo usuário, fundo etéreo respirando sempre, e micro-correções de qualidade Emil-style em todos os elementos interativos.

## Vibe Aprovada

- **Etéreo** (A): orbes flutuando, partículas à deriva, respiração suave
- **Líquido** (B): ripple ao toque, formas orgânicas, spring physics

Combinação: fundo etéreo constante e sutil + liquid physics nos momentos de interação.

## Momentos Mágicos (priorizados)

1. **Reveal do Mundo** — sequência orquestrada quando isLoading → false
2. **Troca de Caminho** — layout animation + spring no path selector
3. **Navegar Ambientes** — ripple + spring enter/exit nos panels

## Design por Seção

### 1. Camada Base — Fundo Etéreo (`__root.tsx`)

3 orbes animadas globais, atrás de todo conteúdo:

| Orbe | Tamanho | Posição | Blur | Ciclo | Cor |
|------|---------|---------|------|-------|-----|
| 1 | 200px | topo direito (-60px offset) | 18px | 10s | branco/azul claro |
| 2 | 140px | centro esquerdo (-40px offset) | 14px | 14s | branco |
| 3 | 100px | fundo direito | 10px | 8s | amarelo/creme |

- Ciclos com números diferentes para nunca sincronizar
- Opacidade 0.30–0.50 — sentidas, não vistas
- CSS puro com `@keyframes` (performance off main thread)
- `prefers-reduced-motion`: orbes estáticas, sem animação

### 2. Reveal do Mundo (`ways/$sessionId.tsx` + `dilemma-world.tsx`)

Sequência ao `isLoading → false`:

1. 3 rings de luz expandem (CSS, 0ms / 200ms / 400ms delay)
2. Header (Sparkles + label) — fade+y 350ms, ease-out
3. Título — blur(8px→0) + fade, 400ms, delay 80ms
4. DilemmaWorldView — scale(0.97→1) + opacity, spring {duration:0.5, bounce:0.12}, delay 120ms
5. Dilema original — fade simples, delay 200ms

Total: ~900ms

### 3. Troca de Caminho (`dilemma-world.tsx`)

- `whileTap: { scale: 0.96 }` em ambos os botões
- `layout` animation no indicador ativo (Framer Motion layout)  
- Spring `{ duration: 0.4, bounce: 0.15 }` no movimento do background ativo
- CaminhoView: spring `{ duration: 0.4, bounce: 0.08 }` no deslize lateral
- Dot da cor dominante: pulsa 1× ao ativar (scale 1→1.3→1, 600ms)

### 4. Navegar Ambientes (`dilemma-world.tsx`)

- Chips: `whileTap: { scale: 0.93 }` + ripple CSS ao clicar
- Ripple: círculo expande (scale 1→2.5, opacity 0.4→0, 500ms, CSS puro)
- AmbientePanel enter: scale(0.96)+opacity+y(10→0), spring {duration:0.45, bounce:0.1}
- AmbientePanel exit: scale(0.98)+opacity, 150ms ease-in (saída rápida)
- Nav arrows: `whileTap: { scale: 0.9 }`

### 5. Micro-interações Globais

| Onde | Mudança |
|------|---------|
| `transition-all` | → propriedades específicas |
| Easing genérico | → `cubic-bezier(0.23, 1, 0.32, 1)` |
| Way cards carousel | Stagger 50ms + `whileTap: { scale: 0.98 }` |
| Loading state | Orbe pulsante + breathing no texto |
| Botão "Explorar primeiro dilema" | `whileHover` + `whileTap` |
| `prefers-reduced-motion` | Wrapper global remove transforms |

## Arquivos Afetados

- `src/routes/__root.tsx` — orbes globais
- `src/styles.css` — keyframes, custom easing CSS vars, ring/ripple classes
- `src/components/dilemma-world.tsx` — momentos 2 e 3
- `src/routes/ways/$sessionId.tsx` — momento 1 (reveal)
- `src/routes/ways.tsx` — stagger cards
- `src/routes/index.tsx` — page entrance stagger
