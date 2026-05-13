# Playable World R3F Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o antigo sistema CSS (`WorldExplorer` + 6 componentes) pela `PlayableWorldExperience` React Three Fiber como modo full-screen em `/ways/$sessionId/world`, e remover todos os arquivos mortos do sistema CSS anterior.

**Architecture:** `PlayableWorldExperience` (R3F, câmera ortográfica, hub + salas 3D sequenciais) já está construída e wired em `/ways/$sessionId`. A rota `/ways/$sessionId/world` ainda renderiza o antigo `WorldExplorer` CSS — este plano a substitui pela `PlayableWorldExperience` em modo full-screen e deleta os 8 arquivos CSS obsoletos. Nenhum arquivo novo é criado.

**Tech Stack:** React 19, React Three Fiber v9 (`@react-three/fiber`), `@react-three/drei`, TanStack Router (file-based), TypeScript, Motion (Framer Motion v11)

---

## Mapa de Arquivos

### Modificados

| Arquivo | Mudança |
| --- | --- |
| `src/routes/ways/$sessionId/world.tsx` | Swap `WorldExplorer` → `PlayableWorldExperience` full-screen |
| `docs/superpowers/specs/2026-05-11-isometric-world-design.md` | Adicionar aviso de spec supersedida |

### Deletados

| Arquivo | Motivo |
| --- | --- |
| `src/components/world/world-hub.tsx` | Substituído pelo `HubStage` 3D em `playable-world-scene.tsx` |
| `src/components/world/path-corridor.tsx` | Substituído pela navegação sequencial em `simulation.ts` |
| `src/components/world/ambiente-room.tsx` | Substituído pelo `RoomStage` 3D em `playable-world-scene.tsx` |
| `src/components/world/character-select.tsx` | Não existe no fluxo R3F (sem seleção de personagem) |
| `src/components/world/pixel-character.tsx` | Sem consumidor após deleção de `character-select.tsx` |
| `src/components/world/element-dialogue.tsx` | Substituído pelos painéis inline de `playable-world-experience.tsx` |
| `src/components/world-explorer.tsx` | Orquestrador do sistema CSS antigo — sem uso após update da rota |
| `src/hooks/use-world-state-machine.ts` | State machine do sistema CSS — substituída por `features/playable-world/simulation.ts` |

### Intactos (não tocar)

- `src/features/playable-world/**` — construído, testado, já funcionando
- `src/routes/ways/$sessionId.tsx` — já usa `PlayableWorldExperience` corretamente
- `src/lib/journey-world.ts`, `src/lib/generate-journey-world.ts` — pipeline de geração funcionando

---

## Task 1: Atualizar rota /world para PlayableWorldExperience full-screen

**Files:**
- Modify: `src/routes/ways/$sessionId/world.tsx`

- [ ] **Step 1: Substituir o conteúdo do arquivo**

O arquivo atual importa `WorldExplorer`. Substitua o arquivo inteiro por:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { PlayableWorldExperience } from "@/features/playable-world/ui/playable-world-experience";
import { isPlayableWorld } from "@/lib/journey-world";
import { getWayHistoryEntry } from "@/lib/way-history";

export const Route = createFileRoute("/ways/$sessionId/world")({
  component: WorldExplorationPage,
});

function WorldExplorationPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const entry = getWayHistoryEntry(sessionId);

  useEffect(() => {
    if (!entry || !isPlayableWorld(entry.world)) {
      void navigate({ to: "/ways/$sessionId", params: { sessionId } });
    }
  }, [entry, navigate, sessionId]);

  if (!entry || !isPlayableWorld(entry.world)) {
    return null;
  }

  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-20">
        <motion.button
          type="button"
          onClick={() => void navigate({ to: "/ways/$sessionId", params: { sessionId } })}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18 shadow-[0_14px_34px_rgba(24,74,116,0.14),inset_0_1px_0_rgba(255,255,255,0.48)] backdrop-blur-[18px]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <ArrowLeft size={18} strokeWidth={1.9} className="text-white" />
        </motion.button>
      </div>
      <PlayableWorldExperience
        world={entry.world}
        onBrowseWays={() => void navigate({ to: "/ways" })}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Esperado: zero erros. Se houver erro de tipo no `to: "/ways/$sessionId"`, verifique se o `routeTree.gen.ts` inclui essa rota (`npm run dev` regenera o tree automaticamente).

- [ ] **Step 3: Commit**

```bash
git add src/routes/ways/$sessionId/world.tsx
git commit -m "feat(world): wire /world route to PlayableWorldExperience full-screen"
```

---

## Task 2: Deletar sistema CSS antigo (8 arquivos)

Estes arquivos não têm mais nenhum consumidor após o Task 1.

**Files:**
- Delete: `src/components/world/world-hub.tsx`
- Delete: `src/components/world/path-corridor.tsx`
- Delete: `src/components/world/ambiente-room.tsx`
- Delete: `src/components/world/character-select.tsx`
- Delete: `src/components/world/pixel-character.tsx`
- Delete: `src/components/world/element-dialogue.tsx`
- Delete: `src/components/world-explorer.tsx`
- Delete: `src/hooks/use-world-state-machine.ts`

- [ ] **Step 1: Deletar os arquivos**

```bash
rm src/components/world/world-hub.tsx
rm src/components/world/path-corridor.tsx
rm src/components/world/ambiente-room.tsx
rm src/components/world/character-select.tsx
rm src/components/world/pixel-character.tsx
rm src/components/world/element-dialogue.tsx
rm src/components/world-explorer.tsx
rm src/hooks/use-world-state-machine.ts
```

- [ ] **Step 2: Type-check para confirmar que não há imports quebrados**

```bash
npx tsc --noEmit
```

Esperado: zero erros. Se TypeScript reclamar de módulo não encontrado, rode este grep para localizar o import órfão:

```bash
grep -r "world-explorer\|use-world-state-machine\|CharacterSelect\|ElementDialogue\|WorldHub\|PathCorridor\|AmbienteRoom\|PixelCharacter" src/
```

Remova qualquer import encontrado.

- [ ] **Step 3: Rodar os testes existentes**

```bash
node src/features/playable-world/__tests__/compiler.test.ts
node src/features/playable-world/__tests__/simulation.test.ts
```

Esperado: todas as linhas `PASS`, nenhuma `FAIL`.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore(world): remove CSS world system (WorldExplorer, WorldHub, PathCorridor, AmbienteRoom, CharacterSelect, ElementDialogue, PixelCharacter, useWorldStateMachine)"
```

---

## Task 3: Verificar build de produção

- [ ] **Step 1: Build completo**

```bash
npm run build
```

Esperado: build conclui sem erros TypeScript nem avisos de módulo faltando. Se houver warning de export não utilizado (ex: de `element-dialogue`), rode o grep do Task 2 Step 2 para localizar e remover o import.

- [ ] **Step 2: Type-check final**

```bash
npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 3: Commit (somente se houve fixups nos steps anteriores)**

Se os steps 1-2 exigiram correções adicionais, commite apenas essas correções:

```bash
git add -u
git commit -m "fix(world): resolve remaining import/type errors after CSS world removal"
```

---

## Task 4: Marcar spec isométrica como supersedida

A spec `2026-05-11-isometric-world-design.md` descreve uma abordagem Canvas 2D isométrica que nunca foi implementada. Adicionar aviso no topo para que leitores futuros não se confundam.

**Files:**
- Modify: `docs/superpowers/specs/2026-05-11-isometric-world-design.md`

- [ ] **Step 1: Adicionar aviso de spec supersedida**

Após a linha `# Design Spec: Mundo Isométrico 2.5D`, insira este bloco (antes do `**Data:**`):

```markdown
> **SUPERSEDIDA — 2026-05-11**
> Esta spec nunca foi implementada. O projeto adotou React Three Fiber (`src/features/playable-world/`) com câmera ortográfica, hub + salas 3D sequenciais e state machine em `simulation.ts`. A abordagem Canvas 2D isométrica abaixo é mantida apenas como histórico de design.

```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-11-isometric-world-design.md
git commit -m "docs: mark isometric Canvas 2D spec as superseded by R3F implementation"
```

---

## Self-Review

### Cobertura da spec

O spec isométrico original não é mais a base — a direção adotada é R3F. Este plano cobre:
- ✅ Rota `/world` wired à `PlayableWorldExperience`
- ✅ Remoção dos 8 arquivos CSS obsoletos
- ✅ Verificação de build limpo
- ✅ Documentação do status da spec

### Consistência de tipos

- `PlayableWorldExperience` recebe `world: PlayableWorldV1` e `onBrowseWays?: () => void` — ambos usados corretamente em Task 1.
- `getWayHistoryEntry` e `isPlayableWorld` são os mesmos usados na rota `/ways/$sessionId.tsx` — sem divergência.
- `navigate({ to: "/ways/$sessionId", params: { sessionId } })` — padrão TanStack Router v5, consistente com o resto da codebase.

### Placeholders

Nenhum TBD/TODO encontrado. Todo código está completo.
