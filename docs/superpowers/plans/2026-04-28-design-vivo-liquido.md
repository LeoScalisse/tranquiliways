# Design Vivo e Líquido — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer vida ao TranquiliWays com fundo etéreo respirando sempre, spring physics nos 3 momentos-chave (reveal do mundo, troca de caminho, navegar ambientes) e micro-correções de qualidade em todos os elementos interativos.

**Architecture:** Fundo etéreo via componente `AnimatedOrbs` montado no `RootComponent` (acima de todas as rotas). Os 3 momentos mágicos vivem em `dilemma-world.tsx` (momentos 2 e 3) e `ways/$sessionId.tsx` (momento 1). Micro-interações são correções cirúrgicas nos componentes existentes. CSS puro para keyframes de performance; Framer Motion (já instalado v12) para spring physics interruptíveis.

**Tech Stack:** React 19, Framer Motion v12 (`motion/react`), Tailwind CSS 4, CSS custom properties + `@keyframes`

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/styles.css` | Modificar | Easing vars, keyframes: orb-float, reveal-ring, ripple |
| `src/components/ui/animated-orbs.tsx` | Criar | Componente das 3 orbes globais |
| `src/routes/__root.tsx` | Modificar | Montar `<AnimatedOrbs>` no `RootComponent` |
| `src/routes/ways/$sessionId.tsx` | Modificar | Sequência orquestrada de reveal do mundo |
| `src/components/dilemma-world.tsx` | Modificar | Spring no path selector + ambiente panels + ripple |
| `src/routes/ways.tsx` | Modificar | Stagger entrada dos cards |
| `src/routes/index.tsx` | Modificar | Stagger entrada da landing page |

---

## Task 1: CSS Foundations — Easing e Keyframes

**Files:**
- Modify: `src/styles.css`

- [ ] **Adicionar CSS custom properties de easing e novos keyframes ao `src/styles.css`**

Adicionar logo após o bloco `@layer utilities { ... }` (após a linha do `.glass-orb`):

```css
/* ── Easing personalizado (Emil-style) ── */
:root {
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
}

/* ── Keyframes globais ── */

/* Orbes flutuantes — cada uma tem seu próprio keyframe para ciclos distintos */
@keyframes orb-float-1 {
  0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.45; }
  30%       { transform: translateY(18px) translateX(-8px) scale(1.04); opacity: 0.55; }
  70%       { transform: translateY(-10px) translateX(5px) scale(0.97); opacity: 0.38; }
}
@keyframes orb-float-2 {
  0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.35; }
  40%       { transform: translateY(-20px) translateX(10px) scale(1.06); opacity: 0.45; }
  75%       { transform: translateY(12px) translateX(-5px) scale(0.96); opacity: 0.28; }
}
@keyframes orb-float-3 {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.40; }
  50%       { transform: translateY(-14px) scale(1.08); opacity: 0.52; }
}

/* Rings de reveal do mundo */
@keyframes reveal-ring-expand {
  0%   { width: 40px; height: 40px; opacity: 0.7; }
  100% { width: 280px; height: 280px; opacity: 0; }
}

/* Ripple ao clicar nos chips de ambiente */
@keyframes chip-ripple {
  0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.35; }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
}

/* Breathing para loading state */
@keyframes content-breathe {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}

/* Stagger reveal — entrada de elementos com blur */
@keyframes stagger-reveal {
  from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0);    filter: blur(0px); }
}
```

- [ ] **Verificar no dev server que o CSS compila sem erros**

```bash
npm run dev
```

Esperado: sem erros no terminal, app carrega normalmente.

- [ ] **Commit**

```bash
git add src/styles.css
git commit -m "style: add easing vars and animation keyframes for living design"
```

---

## Task 2: Componente AnimatedOrbs

**Files:**
- Create: `src/components/ui/animated-orbs.tsx`

- [ ] **Criar o componente**

```tsx
// src/components/ui/animated-orbs.tsx
export function AnimatedOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Orbe 1 — grande, topo direito, azul claro */}
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          top: -70,
          right: -70,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 40%, rgba(255,255,255,0.72) 0%, rgba(168,220,255,0.32) 45%, rgba(92,195,255,0) 70%)",
          filter: "blur(18px)",
          animation: "orb-float-1 10s ease-in-out infinite",
        }}
      />
      {/* Orbe 2 — média, centro esquerdo, branco */}
      <div
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          top: "38%",
          left: -50,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 55% 45%, rgba(255,255,255,0.62) 0%, rgba(200,235,255,0.28) 45%, rgba(92,195,255,0) 70%)",
          filter: "blur(14px)",
          animation: "orb-float-2 14s ease-in-out infinite",
        }}
      />
      {/* Orbe 3 — pequena, fundo direito, creme/amarelo */}
      <div
        style={{
          position: "absolute",
          width: 110,
          height: 110,
          bottom: "12%",
          right: "5%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 45% 45%, rgba(255,244,194,0.72) 0%, rgba(255,220,100,0.22) 50%, rgba(255,200,50,0) 70%)",
          filter: "blur(10px)",
          animation: "orb-float-3 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
```

- [ ] **Verificar que o componente importa sem erros**

```bash
npm run dev
```

Não há erro de TypeScript/build nesse passo — só criamos o arquivo.

- [ ] **Commit**

```bash
git add src/components/ui/animated-orbs.tsx
git commit -m "feat: add AnimatedOrbs background layer component"
```

---

## Task 3: Montar AnimatedOrbs no Root

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Adicionar `AnimatedOrbs` ao `RootComponent`**

Substituir:

```tsx
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
```

Por:

```tsx
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AnimatedOrbs } from "@/components/ui/animated-orbs";
```

Substituir a função `RootComponent`:

```tsx
function RootComponent() {
  return (
    <>
      <AnimatedOrbs />
      <Outlet />
    </>
  );
}
```

- [ ] **Verificar no browser que as 3 orbes aparecem suavemente atrás do conteúdo**

```bash
npm run dev
```

Abrir http://localhost:3000. As orbes devem ser quase invisíveis mas perceptíveis — como luz difusa atrás do app. Verificar que não sobrepõem o conteúdo (z-index 0, `pointer-events: none`).

- [ ] **Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: mount global animated orbs in root layout"
```

---

## Task 4: Stagger da Landing Page

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Adicionar stagger de entrada aos elementos da landing page**

Substituir o conteúdo do retorno em `function Index()`:

```tsx
return (
  <div className="safe-screen relative overflow-hidden">
    <div className="absolute left-4 top-4 z-10">
      <LiquidGlassButton to="/ways" />
    </div>

    <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-3xl flex-col items-center justify-start gap-8 px-4 pt-[20svh]">
      <div style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both" }}>
        <TranquiliWaysTitle shimmerActive={!interacting} />
      </div>

      <p
        className="max-w-sm text-center text-base text-sky-950/55 leading-7"
        style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both 0.08s" }}
      >
        Descreva um dilema da sua vida. A IA vai gerar um mundo visual com os dois caminhos que você pode seguir.
      </p>

      <div
        className="w-full"
        onFocusCapture={() => setInteracting(true)}
        onBlurCapture={() => setInteracting(false)}
        style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both 0.16s" }}
      >
        <PromptInputBox
          isLoading={isSubmitting}
          placeholder="Qual é o seu dilema?"
          className="rounded-[1.75rem] border-white/30 bg-white/75 shadow-[0_18px_44px_rgba(30,76,112,0.12)]"
          onSend={(message) => { void handleSend(message); }}
        />

        {isSubmitting && (
          <p
            className="mt-4 px-4 text-center text-sm text-sky-950/60"
            style={{ animation: "content-breathe 2s ease-in-out infinite" }}
          >
            Construindo os seus caminhos...
          </p>
        )}

        {feedback && !isSubmitting ? (
          <p className="mt-4 px-4 text-center text-sm text-sky-950/70">{feedback}</p>
        ) : null}
      </div>

      <p
        className="text-xs text-sky-950/35"
        style={{ animation: "stagger-reveal 0.5s var(--ease-out-strong) both 0.24s" }}
      >
        3 gerações gratuitas por semana
      </p>
    </div>
  </div>
);
```

- [ ] **Verificar no browser: cada elemento entra com 80ms de intervalo, nenhum pisca**

- [ ] **Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: stagger entrance animation on landing page"
```

---

## Task 5: Stagger dos Cards na Ways Gallery

**Files:**
- Modify: `src/routes/ways.tsx`

- [ ] **Adicionar import do motion e stagger nos cards**

Adicionar import no topo:

```tsx
import { motion } from "motion/react";
```

Substituir o bloco do map de `ways` (o `<div key={way.id} ...>`) por:

```tsx
{ways.map((way, index) => (
  <motion.div
    key={way.id}
    className="flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-4 py-6"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.45,
      ease: [0.23, 1, 0.32, 1],
      delay: index * 0.05,
    }}
  >
    <motion.button
      type="button"
      className="w-full max-w-sm rounded-[2rem] p-6 space-y-4 text-left"
      style={{
        background: `linear-gradient(140deg, ${way.world.caminhoParado.gradiente[0]}cc, ${way.world.caminhoMudanca.gradiente[0]}cc)`,
        border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 16px 48px rgba(30,60,100,0.10)",
      }}
      whileHover={{ translateY: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onClick={() =>
        navigate({
          to: "/ways/$sessionId",
          params: { sessionId: way.id },
          search: way.launchToken ? { token: way.launchToken } : {},
        })}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-sky-950/45">
        Dilema
      </p>
      <p className="text-base font-medium text-sky-950/85 leading-6 line-clamp-3">
        {way.rawInput}
      </p>

      <div className="flex gap-3">
        <div
          className="flex-1 rounded-[1.25rem] p-3 text-center text-xs"
          style={{
            background: `${way.world.caminhoParado.corDominante}20`,
            border: `1px solid ${way.world.caminhoParado.corDominante}30`,
          }}
        >
          <p className="font-medium text-sky-950/70">{way.world.caminhoParado.nome}</p>
          <p
            className="mt-0.5 font-semibold"
            style={{ color: way.world.caminhoParado.corDominante }}
          >
            {way.world.caminhoParado.titulo}
          </p>
        </div>
        <div
          className="flex-1 rounded-[1.25rem] p-3 text-center text-xs"
          style={{
            background: `${way.world.caminhoMudanca.corDominante}20`,
            border: `1px solid ${way.world.caminhoMudanca.corDominante}30`,
          }}
        >
          <p className="font-medium text-sky-950/70">{way.world.caminhoMudanca.nome}</p>
          <p
            className="mt-0.5 font-semibold"
            style={{ color: way.world.caminhoMudanca.corDominante }}
          >
            {way.world.caminhoMudanca.titulo}
          </p>
        </div>
      </div>

      <p className="text-xs text-sky-950/40">
        {new Date(way.createdAt).toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </motion.button>
  </motion.div>
))}
```

- [ ] **Verificar: cards entram em cascata suave ao abrir /ways**

- [ ] **Commit**

```bash
git add src/routes/ways.tsx
git commit -m "feat: stagger entrance and press feedback on ways gallery cards"
```

---

## Task 6: Reveal do Mundo — Sequência Orquestrada

**Files:**
- Modify: `src/routes/ways/$sessionId.tsx`

- [ ] **Adicionar import do motion e AnimatePresence**

Substituir a linha de imports existente:

```tsx
import { ArrowLeft, LoaderCircle, TriangleAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
```

Por:

```tsx
import { ArrowLeft, LoaderCircle, TriangleAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
```

- [ ] **Substituir o bloco de loading state por loading com orbe pulsante**

Substituir:

```tsx
{isLoading && (
  <section className="glass-panel rounded-[2rem] p-6">
    <div className="flex items-center gap-3 text-sky-950/75">
      <LoaderCircle className="h-5 w-5 animate-spin" />
      <span>Construindo seu mundo...</span>
    </div>
  </section>
)}
```

Por:

```tsx
{isLoading && (
  <section className="glass-panel rounded-[2rem] p-6">
    <div className="flex items-center gap-3 text-sky-950/75">
      <div className="relative flex h-5 w-5 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full bg-sky-400/30"
          style={{ animation: "content-breathe 1.4s ease-in-out infinite" }}
        />
        <LoaderCircle className="h-5 w-5 animate-spin relative z-10" />
      </div>
      <span style={{ animation: "content-breathe 2s ease-in-out infinite" }}>
        Construindo seu mundo...
      </span>
    </div>
  </section>
)}
```

- [ ] **Substituir o bloco `{way && !isLoading && (...)}` pela sequência orquestrada**

Substituir:

```tsx
{way && !isLoading && (
  <>
    <div className="flex flex-wrap items-center gap-3">
      <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/72">
        <Sparkles className="h-4 w-4" />
        {way.kind === "legacy" ? "Mundo salvo" : "Mundo gerado"}
      </div>
    </div>

    <h1 className="app-heading px-1 text-2xl font-semibold text-sky-950 sm:text-3xl">
      Explore os dois lados do seu dilema.
    </h1>

    <DilemmaWorldView world={way.world} />

    <div className="flex justify-center pt-2">
      <Button
        variant="glass"
        className="rounded-full px-6 text-sky-950"
        onClick={() => navigate({ to: "/ways" })}
      >
        Ver todos os meus dilemas
      </Button>
    </div>
  </>
)}
```

Por:

```tsx
<AnimatePresence>
  {way && !isLoading && (
    <>
      {/* Rings de reveal — explodem uma vez ao aparecer */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center" style={{ zIndex: 50 }}>
        {[0, 200, 400].map((delay) => (
          <div
            key={delay}
            className="absolute rounded-full border border-sky-300/40"
            style={{
              animation: `reveal-ring-expand 900ms var(--ease-out-strong) ${delay}ms both`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="flex flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-sky-950/72">
          <Sparkles className="h-4 w-4" />
          {way.kind === "legacy" ? "Mundo salvo" : "Mundo gerado"}
        </div>
      </motion.div>

      <motion.h1
        className="app-heading px-1 text-2xl font-semibold text-sky-950 sm:text-3xl"
        initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.08 }}
      >
        Explore os dois lados do seu dilema.
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.12, delay: 0.12 }}
      >
        <DilemmaWorldView world={way.world} />
      </motion.div>

      <motion.div
        className="flex justify-center pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
      >
        <Button
          variant="glass"
          className="rounded-full px-6 text-sky-950"
          onClick={() => navigate({ to: "/ways" })}
        >
          Ver todos os meus dilemas
        </Button>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

- [ ] **Verificar: ao gerar um mundo novo, a sequência de reveal acontece corretamente**

Criar um dilema de teste e observar:
1. Os 3 rings de luz aparecem e expandem
2. O label "Mundo gerado" aparece
3. O título aparece com blur→nítido
4. O DilemmaWorldView escala de 0.97 para 1
5. O botão final aparece por último

- [ ] **Commit**

```bash
git add src/routes/ways/$sessionId.tsx
git commit -m "feat: orchestrated world reveal sequence with expanding light rings"
```

---

## Task 7: Path Selector — Spring e Press Feedback

**Files:**
- Modify: `src/components/dilemma-world.tsx`

- [ ] **Substituir os botões do seletor de caminho por motion.button com layout animation**

Localizar o bloco do seletor de caminho em `DilemmaWorldView` (começa em `{/* Seletor de caminho */}`).

Substituir os dois `<button>` do seletor pelo seguinte (o wrapper `<div>` permanece igual):

```tsx
{/* Seletor de caminho */}
<div
  className="relative flex gap-1 rounded-full p-1"
  style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)" }}
>
  {(["parado", "mudanca"] as const).map((key) => {
    const c = key === "parado" ? world.caminhoParado : world.caminhoMudanca;
    const isActive = caminhoAtivo === key;
    return (
      <motion.button
        key={key}
        onClick={() => setCaminhoAtivo(key)}
        className="relative flex-1 rounded-full px-4 py-2.5 text-sm font-medium"
        style={{ color: isActive ? "rgb(8 47 73)" : "rgba(8,47,73,0.5)" }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      >
        {isActive && (
          <motion.div
            layoutId="path-selector-bg"
            className="absolute inset-0 rounded-full shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${c.gradiente[0]}, ${c.gradiente[1]})`,
            }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          />
        )}
        <span className="relative z-10">{c.nome}</span>
      </motion.button>
    );
  })}
</div>
```

- [ ] **Verificar: o background desliza com spring entre os botões ao clicar**

- [ ] **Commit parcial**

```bash
git add src/components/dilemma-world.tsx
git commit -m "feat: spring layout animation on path selector"
```

---

## Task 8: CaminhoView Transition — Spring Physics

**Files:**
- Modify: `src/components/dilemma-world.tsx`

- [ ] **Melhorar a transição do CaminhoView para spring**

Localizar o `<motion.div key={caminhoAtivo} ...>` dentro do `<AnimatePresence mode="wait">` em `DilemmaWorldView`.

Substituir:

```tsx
<motion.div
  key={caminhoAtivo}
  className="h-full"
  initial={{ opacity: 0, x: caminhoAtivo === "mudanca" ? 40 : -40 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: caminhoAtivo === "mudanca" ? -40 : 40 }}
  transition={{ duration: 0.35, ease: "easeInOut" }}
>
```

Por:

```tsx
<motion.div
  key={caminhoAtivo}
  className="h-full"
  initial={{ opacity: 0, x: caminhoAtivo === "mudanca" ? 32 : -32 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: caminhoAtivo === "mudanca" ? -32 : 32 }}
  transition={{ type: "spring", duration: 0.4, bounce: 0.08 }}
>
```

- [ ] **Verificar: a troca de caminho desliza organicamente com bounce sutil**

- [ ] **Commit**

```bash
git add src/components/dilemma-world.tsx
git commit -m "feat: spring physics on path transition"
```

---

## Task 9: AmbientePanel — Spring Enter/Exit

**Files:**
- Modify: `src/components/dilemma-world.tsx`

- [ ] **Melhorar as animações de entrada e saída do AmbientePanel**

Localizar o `<motion.div>` no componente `AmbientePanel` (primeira linha do return).

Substituir:

```tsx
<motion.div
  className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem]"
  style={{
    background: `linear-gradient(160deg, ${gradiente[0]}cc, ${gradiente[1]}ee)`,
    boxShadow: isActive
      ? `0 0 0 2px ${ambiente.cor}80, 0 24px 60px ${ambiente.cor}40`
      : "0 8px 32px rgba(0,0,0,0.12)",
  }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

Por:

```tsx
<motion.div
  className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem]"
  style={{
    background: `linear-gradient(160deg, ${gradiente[0]}cc, ${gradiente[1]}ee)`,
    boxShadow: isActive
      ? `0 0 0 2px ${ambiente.cor}80, 0 24px 60px ${ambiente.cor}40`
      : "0 8px 32px rgba(0,0,0,0.12)",
  }}
  initial={{ opacity: 0, scale: 0.96, y: 10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.98 }}
  transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
>
```

- [ ] **Verificar: trocar de ambiente tem entrada spring e saída rápida**

- [ ] **Commit**

```bash
git add src/components/dilemma-world.tsx
git commit -m "feat: spring enter/exit on ambiente panels"
```

---

## Task 10: Chips de Ambiente — Press Feedback e Ripple

**Files:**
- Modify: `src/components/dilemma-world.tsx`

- [ ] **Substituir os chips de ambiente por motion.button com ripple**

Localizar o `{/* Indicadores de ambiente */}` em `CaminhoView`.

Substituir o conteúdo do map (o `<button key={key} ...>`) por:

```tsx
{AMBIENTE_ORDER.map((key) => {
  const { Icon } = AMBIENTE_META[key];
  const isActive = key === ambienteAtivo;
  return (
    <motion.button
      key={key}
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
      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
      aria-label={AMBIENTE_META[key].label}
    >
      {/* Ripple */}
      {isActive && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 rounded-full"
          style={{
            background: `${caminho.corDominante}40`,
            animation: "chip-ripple 500ms var(--ease-out-strong) both",
          }}
        />
      )}
      <Icon className="h-3 w-3 relative z-10" />
      <span className="hidden sm:inline relative z-10">{AMBIENTE_META[key].label}</span>
    </motion.button>
  );
})}
```

- [ ] **Verificar: cada clique no chip mostra o ripple expandindo e o chip pressiona**

- [ ] **Commit**

```bash
git add src/components/dilemma-world.tsx
git commit -m "feat: ripple effect and press feedback on ambiente chips"
```

---

## Task 11: Nav Arrows — Press Feedback

**Files:**
- Modify: `src/components/dilemma-world.tsx`

- [ ] **Substituir os botões de navegação (prev/next ambiente) por motion.button**

Localizar os dois `<button onClick={goPrev} ...>` e `<button onClick={goNext} ...>` em `CaminhoView`.

Substituir ambos por:

```tsx
<motion.button
  onClick={goPrev}
  disabled={currentIndex === 0}
  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm disabled:opacity-0"
  style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)" }}
  whileTap={{ scale: 0.9 }}
  transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
  aria-label="Ambiente anterior"
>
  <ChevronLeft className="h-4 w-4 text-sky-950/70" />
</motion.button>

<motion.button
  onClick={goNext}
  disabled={currentIndex === AMBIENTE_ORDER.length - 1}
  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm disabled:opacity-0"
  style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)" }}
  whileTap={{ scale: 0.9 }}
  transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
  aria-label="Próximo ambiente"
>
  <ChevronRight className="h-4 w-4 text-sky-950/70" />
</motion.button>
```

- [ ] **Verificar: setas pressionam visivelmente ao toque**

- [ ] **Commit**

```bash
git add src/components/dilemma-world.tsx
git commit -m "feat: press feedback on ambiente navigation arrows"
```

---

## Task 12: prefers-reduced-motion Global

**Files:**
- Modify: `src/styles.css`

- [ ] **Adicionar media query de reduced motion ao final do `src/styles.css`**

```css
/* ── Acessibilidade: respeitar preferência de movimento reduzido ── */
@media (prefers-reduced-motion: reduce) {
  .orb-1, .orb-2, .orb-3,
  [style*="orb-float"],
  [style*="reveal-ring"],
  [style*="chip-ripple"],
  [style*="content-breathe"],
  [style*="stagger-reveal"] {
    animation: none !important;
  }
}
```

- [ ] **Verificar: com "Reduce Motion" ativado no SO, as orbes ficam estáticas e as animações de entrada desaparecem**

No macOS: System Settings → Accessibility → Display → Reduce Motion  
No iOS: Settings → Accessibility → Motion → Reduce Motion

- [ ] **Commit final**

```bash
git add src/styles.css
git commit -m "feat: respect prefers-reduced-motion for all living design animations"
```

---

## Checklist de Self-Review

### Cobertura do spec
- [x] Camada base orbes → Tasks 1, 2, 3
- [x] Reveal do mundo → Task 6
- [x] Troca de caminho (spring + whileTap) → Tasks 7, 8
- [x] Navegar ambientes (ripple + spring) → Tasks 9, 10, 11
- [x] Stagger landing page → Task 4
- [x] Stagger cards gallery → Task 5
- [x] Loading state breathing → Task 6 (loading block)
- [x] `prefers-reduced-motion` → Task 12
- [x] `transition-all` → fix via `motion` e `transition` inline nos Tasks 7–11

### Tipos e imports consistentes
- Todos os `motion` imports são de `"motion/react"` (biblioteca já instalada como `motion` v12)
- `AnimatePresence` importado em `ways/$sessionId.tsx` Task 6
- `cn` já importado em `dilemma-world.tsx`
- `motion` precisa ser importado em `ways.tsx` (Task 5) e `ways/$sessionId.tsx` (Task 6)
