# Design Spec: World Creation Loading + Reveal Progressivo

**Data:** 2026-05-03  
**Status:** Aprovado  
**Escopo:** Geração de mundos com IA real (Gemini) + experiência imersiva de loading + reveal progressivo

---

## Problema

O app submete o dilema, chama a API, salva o resultado no localStorage e navega para `/ways/$sessionId`. Quando a página carrega, o dado já está no localStorage — `isLoading` vira `false` imediatamente e o loading nunca aparece. Além disso, `GEMINI_API_KEY` não está configurada, então `isGeminiAvailable()` retorna `false` e `interpretDilemmaFallback()` é sempre usado — os mundos nunca são gerados pela IA, são sempre pré-fabricados.

---

## Solução: Abordagem 1 — Loading Emocional + Reveal Progressivo

### Fluxo Novo

```
Usuário submete dilema
  → index.tsx: inicia chamada POST /api/sessions
  → index.tsx: renderiza WorldCreationLoader (toma a tela inteira)
  → Gemini gera o mundo em background (~3–10s)
  → API responde com JourneySession
  → index.tsx: salva no localStorage, navega para /ways/$sessionId
  → $sessionId.tsx: encontra dado no localStorage
  → Reveal progressivo em cascata (não flash instantâneo)
```

**Mudança-chave:** o index nunca navega antes da API terminar. O loading imersivo vive no index enquanto `isSubmitting === true`.

---

## Entregáveis

### 1. `.env.local`

Criar na raiz do projeto com:

```
GEMINI_API_KEY=<chave do Google AI Studio>
TRANQUILIWAYS_SESSION_SECRET=<string aleatória forte, mínimo 32 chars>
```

Sem esse arquivo, `isGeminiAvailable()` retorna `false` e a geração real nunca acontece.

---

### 2. `src/components/world-creation-loader.tsx`

Componente full-screen que substitui o conteúdo do index durante `isSubmitting`.

**Props:**

```ts
interface WorldCreationLoaderProps {
  dilemma: string;
}
```

**Estágios de mensagem** (progressão automática via `useEffect` + `setInterval`):

| Estágio | Início | Mensagem                                                      |
| ------- | ------ | ------------------------------------------------------------- |
| 1       | 0s     | "Lendo o que você está vivendo..."                            |
| 2       | 3s     | "Identificando os dois caminhos..."                           |
| 3       | 6s     | "Construindo o primeiro mundo..."                             |
| 4       | 9s     | "Dando vida ao segundo caminho..."                            |
| 5+      | 12s    | "Finalizando os detalhes..." (permanece aqui indefinidamente) |

**Layout:**

```
┌─────────────────────────────────────────┐
│  [orb grande — fundo, breathing slow]   │
│                                         │
│  "quero largar o emprego mas tenho      │
│   medo de arrepender..."                │  ← dilemma prop (itálico, opacity 55%, line-clamp-3)
│                                         │
│     ✦  Construindo o primeiro mundo...  │  ← mensagem do estágio atual
│                                         │
│     ● ● ● ○ ○                           │  ← 5 dots, preenchidos = estágios concluídos
│                                         │
│  [orb pequeno — foreground, offset]     │
└─────────────────────────────────────────┘
```

**Detalhes de implementação:**

- `AnimatePresence` no texto do estágio → `opacity: 0 → 1` + `y: 6 → 0` a cada troca
- Orbs reutilizam `animation: content-breathe` (já existe no CSS global)
- Dots: `#5a7fa5` preenchido / `rgba(90,127,165,0.25)` vazio
- Dilema aparece com `delay: 0.3s` em `initial={{ opacity: 0 }}`
- Texto do dilema em itálico, `text-sky-950/55`
- O componente não tem estado interno além do índice do estágio atual

---

### 3. Modificação em `src/routes/index.tsx`

**Antes** (estado `isSubmitting`):

```tsx
{
  isSubmitting && <p className="mt-4 ...">Construindo os seus caminhos...</p>;
}
```

**Depois:**

```tsx
if (isSubmitting) {
  return (
    <div className="safe-screen">
      <WorldCreationLoader dilemma={rawInputRef.current} />
    </div>
  );
}
```

- `rawInputRef` armazena o valor do input no momento do submit para passar ao loader
- O componente `Index` retorna o loader como early return quando `isSubmitting === true` — a UI de input desaparece, o loader toma a tela
- Quando `isSubmitting` vira `false` (erro ou sucesso), o loader some — ou a navegação já aconteceu

---

### 4. Reveal Progressivo em `src/routes/ways/$sessionId.tsx` + `src/components/dilemma-world.tsx`

**Sequência de entrada** (via `delay` no Framer Motion):

| Elemento                      | Delay | Animação                         |
| ----------------------------- | ----- | -------------------------------- |
| Header                        | 0ms   | fade + y: 8→0                    |
| Badge "Mundo gerado" + título | 150ms | fade + y: 10→0                   |
| Seletor de caminho            | 300ms | `scaleX: 0.88→1` + fade (spring) |
| Painel AmbientePanel ativo    | 500ms | `scale: 0.96→1` + fade (spring)  |
| Dots de ambiente              | 700ms | stagger 80ms por dot             |
| Botão "Ver todos"             | 900ms | fade simples                     |

**`DilemmaWorldView`:** o seletor de caminho recebe `initial={{ scaleX: 0.88, opacity: 0 }}` com spring. Os `AmbientePanel` já têm `initial/animate` — ajusta-se o `delay` para ser passado como prop ou calculado via `index`.

**`$sessionId.tsx`:** os `motion.div` já existem nos elements — revisão dos `transition.delay` para seguir a tabela acima.

---

## O Que Este Design NÃO Inclui (fora de escopo)

- Streaming real do Gemini (SSE) — complexidade desproporcional para MVP
- Touch interaction com elementos do mundo — próxima iteração
- Nota de reflexão ao final — próxima iteração
- Segunda chamada ao Gemini para mensagens de loading personalizadas — custo e latência desnecessários

---

## Dependências e Riscos

| Item                                   | Risco                                              | Mitigação                                                          |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `GEMINI_API_KEY` disponível            | Sem a chave, geração real não acontece             | Usuário confirmou ter a chave                                      |
| Gemini pode demorar >15s               | Loading ficará no estágio "Finalizando..." em loop | Aceitável para MVP; mensagem de timeout pode ser adicionada depois |
| `TRANQUILIWAYS_SESSION_SECRET` ausente | `issueJourneySession` lança erro → API retorna 400 | Incluído no `.env.local`                                           |
| Fallback heurístico                    | Ainda usado se Gemini falhar                       | Comportamento correto — degradação graciosa                        |
