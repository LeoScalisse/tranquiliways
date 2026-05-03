# World Creation Loading + Reveal Progressivo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Habilitar geração real via Gemini e adicionar experiência imersiva de loading + reveal progressivo ao submeter um dilema.

**Architecture:** O loading imersivo vive em `index.tsx` enquanto `isSubmitting === true` — o componente `WorldCreationLoader` toma a tela com mensagens emocionais e orbs animados. Só após a resposta da API o app navega para `/ways/$sessionId`, onde o mundo revela em cascata com delays escalonados.

**Tech Stack:** React 19, TanStack Start, Framer Motion / motion/react, Tailwind CSS 4, Gemini REST API

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `.env.local` | Criar | `GEMINI_API_KEY` + `TRANQUILIWAYS_SESSION_SECRET` |
| `src/components/world-creation-loader.tsx` | Criar | Tela full-screen de loading com estágios emocionais |
| `src/routes/index.tsx` | Modificar | Early return para `WorldCreationLoader` durante `isSubmitting` |
| `src/routes/ways/$sessionId.tsx` | Modificar | Ajuste dos `delay` no reveal em cascata |
| `src/components/dilemma-world.tsx` | Modificar | Animação de entrada no seletor de caminho + stagger nos dots |

---

## Task 1: Configurar variáveis de ambiente

**Files:**
- Create: `.env.local`

- [ ] **Step 1: Gerar `TRANQUILIWAYS_SESSION_SECRET`**

Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copie o output (64 chars hex). Exemplo: `a3f8c2...` — guarde para o próximo passo.

- [ ] **Step 2: Criar `.env.local` na raiz do projeto**

Crie o arquivo `c:\Users\Erika Scalisse\onedrive\Área de trabalho\tranquiliways\.env.local` com o conteúdo abaixo, substituindo os valores:

```env
GEMINI_API_KEY=<sua chave do Google AI Studio>
TRANQUILIWAYS_SESSION_SECRET=<output do passo 1>
```

- [ ] **Step 3: Verificar que `.env.local` está no `.gitignore`**

Abra `.gitignore` e confirme que existe uma linha `.env.local` ou `.env*`. Se não existir, adicione:
```
.env.local
```

- [ ] **Step 4: Verificar que a chave é lida pelo servidor**

Adicione temporariamente no início de `src/routes/api/sessions.ts` (linha 1, após os imports):
```ts
console.log("[sessions] Gemini disponível:", isGeminiAvailable());
```
Execute `npm run dev`, submeta um dilema qualquer no app e verifique no terminal que aparece:
```
[sessions] Gemini disponível: true
```
Se aparecer `false`, o `.env.local` não está sendo lido — confirme o caminho do arquivo.

- [ ] **Step 5: Remover o console.log temporário**

Remova a linha adicionada no Step 4.

- [ ] **Step 6: Commit**

```bash
git add .gitignore
git commit -m "chore: garantir .env.local no gitignore"
```
(Não commite o `.env.local` — ele contém segredos.)

---

## Task 2: Criar `WorldCreationLoader`

**Files:**
- Create: `src/components/world-creation-loader.tsx`

- [ ] **Step 1: Criar o componente**

Crie `src/components/world-creation-loader.tsx` com o conteúdo completo:

```tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";

const STAGES = [
  "Lendo o que você está vivendo...",
  "Identificando os dois caminhos...",
  "Construindo o primeiro mundo...",
  "Dando vida ao segundo caminho...",
  "Finalizando os detalhes...",
] as const;

interface WorldCreationLoaderProps {
  dilemma: string;
}

export function WorldCreationLoader({ dilemma }: WorldCreationLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="safe-screen relative flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Orb grande — fundo */}
      <div
        className="glass-orb absolute left-[15%] top-[20%] h-48 w-48 opacity-60"
        style={{ animation: "content-breathe 3s ease-in-out infinite" }}
      />
      {/* Orb pequeno — foreground offset */}
      <div
        className="glass-orb absolute bottom-[25%] right-[10%] h-32 w-32 opacity-40"
        style={{ animation: "content-breathe 4s ease-in-out infinite 0.8s" }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Dilema ecoado */}
        <motion.p
          className="line-clamp-3 text-center text-base italic leading-7 text-sky-950/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          "{dilemma}"
        </motion.p>

        {/* Ícone + mensagem do estágio */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "rgba(90,127,165,0.15)",
              border: "1px solid rgba(90,127,165,0.3)",
            }}
          >
            <Sparkles
              className="h-5 w-5 text-sky-600/70"
              style={{ animation: "content-breathe 2s ease-in-out infinite" }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={stageIndex}
              className="text-center text-base text-sky-950/75"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            >
              {STAGES[stageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Dots de progresso — dot ativo se alarga em pill */}
        <div className="flex items-center gap-2">
          {STAGES.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === stageIndex ? 20 : 6,
                background:
                  i <= stageIndex ? "#5a7fa5" : "rgba(90,127,165,0.25)",
              }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Esperado: sem erros relacionados a `world-creation-loader.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/world-creation-loader.tsx
git commit -m "feat: componente WorldCreationLoader com estágios emocionais"
```

---

## Task 3: Loading imersivo em `index.tsx`

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Adicionar imports**

No topo de `src/routes/index.tsx`, substitua:
```tsx
import { useState } from "react";
```
Por:
```tsx
import { useRef, useState } from "react";
```

E adicione após os imports existentes:
```tsx
import { WorldCreationLoader } from "@/components/world-creation-loader";
```

- [ ] **Step 2: Adicionar `rawInputRef`**

Dentro de `function Index()`, após as declarações de estado existentes, adicione:
```tsx
const rawInputRef = useRef("");
```

- [ ] **Step 3: Capturar o dilema no início do submit**

Dentro de `handleSend`, substitua:
```tsx
setFeedback(null);
setIsSubmitting(true);
```
Por:
```tsx
rawInputRef.current = rawInput;
setFeedback(null);
setIsSubmitting(true);
```

- [ ] **Step 4: Adicionar early return para o loader**

Dentro de `function Index()`, após as declarações de estado e hooks (antes do `return` normal), adicione:
```tsx
if (isSubmitting) {
  return (
    <div className="safe-screen relative overflow-hidden">
      <WorldCreationLoader dilemma={rawInputRef.current} />
    </div>
  );
}
```

- [ ] **Step 5: Remover o parágrafo de loading antigo**

No JSX do `return` principal, remova o bloco:
```tsx
{isSubmitting && (
  <p
    className="mt-4 px-4 text-center text-sm text-sky-950/60"
    style={{ animation: "content-breathe 2s ease-in-out infinite" }}
  >
    Construindo os seus caminhos...
  </p>
)}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 7: Verificar no browser**

Execute `npm run dev`. Abra o app, escreva um dilema e submeta. Verifique:
- A tela de input some
- `WorldCreationLoader` aparece com os orbs, o dilema ecoado e as mensagens progredindo a cada 3s
- Após a geração, o app navega para `/ways/$sessionId`

- [ ] **Step 8: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: loading imersivo no index durante geração do mundo"
```

---

## Task 4: Reveal progressivo em `$sessionId.tsx`

**Files:**
- Modify: `src/routes/ways/$sessionId.tsx`

- [ ] **Step 1: Animar o header na entrada**

Em `src/routes/ways/$sessionId.tsx`, substitua:
```tsx
<header className="flex items-center justify-between gap-3">
```
Por:
```tsx
<motion.header
  className="flex items-center justify-between gap-3"
  initial={{ opacity: 0, y: -6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
>
```
E o fechamento `</header>` por `</motion.header>`.

- [ ] **Step 2: Ajustar delay do badge "Mundo gerado"**

Localize o `motion.div` que contém o badge `<Sparkles />`. Atualize seu `transition`:
```tsx
transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
```

- [ ] **Step 3: Ajustar delay do título `h1`**

Localize o `motion.h1` com "Explore os dois lados do seu dilema.". Atualize seu `transition`:
```tsx
transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
```

- [ ] **Step 4: Ajustar delay do `DilemmaWorldView`**

Localize o `motion.div` que envolve `<DilemmaWorldView />`. Atualize seu `transition`:
```tsx
transition={{ type: "spring", duration: 0.5, bounce: 0.12, delay: 0.3 }}
```

- [ ] **Step 5: Ajustar delay do botão "Ver todos"**

Localize o `motion.div` que envolve o `<Button>Ver todos os meus dilemas</Button>`. Atualize seu `transition`:
```tsx
transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.9 }}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 7: Verificar cascade no browser**

Navegue para um world gerado. Confirme que os elementos entram nesta ordem visual:
header (0ms) → badge+título (150ms) → seletor de caminho (300ms via DilemmaWorldView) → painel ambiente (500ms) → dots (700ms) → botão (900ms)

- [ ] **Step 8: Commit**

```bash
git add src/routes/ways/$sessionId.tsx
git commit -m "feat: reveal progressivo em cascata na página do mundo"
```

---

## Task 5: Animações de entrada em `DilemmaWorldView`

**Files:**
- Modify: `src/components/dilemma-world.tsx`

- [ ] **Step 1: Envolver o seletor de caminho em `motion.div`**

Em `src/components/dilemma-world.tsx`, dentro de `DilemmaWorldView`, localize o `div` do seletor de caminho que começa com:
```tsx
<div
  className="relative flex gap-1 rounded-full p-1"
  style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)" }}
>
```
Substitua o `<div` por `<motion.div` e adicione as props de animação, fechando com `</motion.div>`:
```tsx
<motion.div
  className="relative flex gap-1 rounded-full p-1"
  style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)" }}
  initial={{ opacity: 0, scaleX: 0.88 }}
  animate={{ opacity: 1, scaleX: 1 }}
  transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
>
```

- [ ] **Step 2: Adicionar stagger de entrada nos dots de ambiente**

Em `CaminhoView`, localize o `AMBIENTE_ORDER.map`. Altere a assinatura do map para incluir o índice:
```tsx
{AMBIENTE_ORDER.map((key, idx) => {
```

No `motion.button` dos dots, adicione `initial`/`animate` e separe a `transition` por propriedade para não conflitar com `whileTap`:
```tsx
<motion.button
  key={key}
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
  onClick={() => onAmbienteChange(key)}
  className={cn(
    "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-xs font-medium",
    isActive ? "text-sky-950" : "text-sky-950/40",
  )}
  style={{
    background: isActive ? `${caminho.corDominante}25` : "rgba(255,255,255,0.35)",
    border: isActive ? `1px solid ${caminho.corDominante}50` : "1px solid transparent",
    transition: "background 200ms cubic-bezier(0.23,1,0.32,1), border-color 200ms cubic-bezier(0.23,1,0.32,1), color 200ms cubic-bezier(0.23,1,0.32,1)",
  }}
  whileTap={{ scale: 0.93 }}
  transition={{
    opacity: { duration: 0.25, delay: 0.7 + idx * 0.08 },
    y: { duration: 0.25, delay: 0.7 + idx * 0.08 },
    scale: { duration: 0.12, ease: [0.23, 1, 0.32, 1] },
  }}
  aria-label={AMBIENTE_META[key].label}
>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 4: Verificar no browser**

Abra um world gerado. Confirme:
- O seletor de caminho faz um spring de `scaleX: 0.88 → 1` ao entrar
- Os 4 dots de ambiente entram escalonados (quarto primeiro, família por último)
- O `whileTap` nos dots ainda funciona normalmente

- [ ] **Step 5: Commit final**

```bash
git add src/components/dilemma-world.tsx
git commit -m "feat: animações de entrada no seletor de caminho e dots de ambiente"
```

---

## Verificação Final

- [ ] Executar `npm run build` e confirmar que não há erros de build
- [ ] Testar o fluxo completo: submeter dilema → loader aparece com mensagens → mundo gerado pelo Gemini (não fallback) → reveal progressivo em cascata
- [ ] Confirmar no terminal que `[sessions] Gemini disponível: true` NÃO aparece (o log foi removido na Task 1)
