import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Home, Briefcase, Users, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DilemmaWorld, CaminhoMundo, Ambiente } from "@/lib/interpret-dilemma";

type AmbienteKey = "quarto" | "sala" | "trabalho" | "familia";

const AMBIENTE_META: Record<AmbienteKey, { label: string; Icon: typeof Home }> = {
  quarto: { label: "Quarto", Icon: Home },
  sala: { label: "Sala", Icon: Tv },
  trabalho: { label: "Trabalho", Icon: Briefcase },
  familia: { label: "Família", Icon: Users },
};

const AMBIENTE_ORDER: AmbienteKey[] = ["quarto", "sala", "trabalho", "familia"];

interface AmbientePanelProps {
  ambiente: Ambiente;
  tipo: AmbienteKey;
  gradiente: [string, string];
  isActive: boolean;
}

function AmbientePanel({ ambiente, tipo, gradiente, isActive }: AmbientePanelProps) {
  const { Icon } = AMBIENTE_META[tipo];

  return (
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
      {/* Camada de parallax: fundo distante */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${ambiente.cor}60 0%, transparent 60%)`,
        }}
      />

      {/* Camada intermediária: textura emocional */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 opacity-30"
        style={{
          background: `linear-gradient(to top, ${ambiente.cor}80, transparent)`,
        }}
      />

      {/* Conteúdo do ambiente */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        {/* Header do ambiente */}
        <div className="flex items-start justify-between">
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
            style={{ background: `${ambiente.cor}25`, color: `${ambiente.cor}` }}
          >
            <Icon className="h-3.5 w-3.5" />
            {AMBIENTE_META[tipo].label}
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs"
            style={{ background: "rgba(255,255,255,0.25)", color: "rgba(30,20,10,0.7)" }}
          >
            {ambiente.humor}
          </div>
        </div>

        {/* Cena principal — descrição visual */}
        <div className="my-4 flex-1 flex items-center">
          <p
            className="text-base leading-7 font-light"
            style={{ color: "rgba(20,15,10,0.78)", textShadow: "0 1px 3px rgba(255,255,255,0.4)" }}
          >
            {ambiente.descricao}
          </p>
        </div>

        {/* Elementos visuais — como props de cena */}
        <div className="flex flex-wrap gap-2">
          {ambiente.elementos.map((el) => (
            <span
              key={el}
              className="rounded-full px-3 py-1 text-xs backdrop-blur-sm"
              style={{
                background: "rgba(255,255,255,0.32)",
                color: "rgba(20,15,10,0.65)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              {el}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface CaminhoViewProps {
  caminho: CaminhoMundo;
  ambienteAtivo: AmbienteKey;
  onAmbienteChange: (a: AmbienteKey) => void;
}

function CaminhoView({ caminho, ambienteAtivo, onAmbienteChange }: CaminhoViewProps) {
  const currentIndex = AMBIENTE_ORDER.indexOf(ambienteAtivo);

  function goNext() {
    const next = AMBIENTE_ORDER[currentIndex + 1];
    if (next) onAmbienteChange(next);
  }

  function goPrev() {
    const prev = AMBIENTE_ORDER[currentIndex - 1];
    if (prev) onAmbienteChange(prev);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Título do caminho */}
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full"
          style={{ background: caminho.corDominante }}
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-widest opacity-50">{caminho.nome}</p>
          <h2 className="text-lg font-semibold text-sky-950">{caminho.titulo}</h2>
        </div>
      </div>

      {/* Painel do ambiente ativo */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <AmbientePanel
            key={ambienteAtivo}
            ambiente={caminho.ambientes[ambienteAtivo]}
            tipo={ambienteAtivo}
            gradiente={caminho.gradiente}
            isActive
          />
        </AnimatePresence>

        {/* Navegação entre ambientes — Task 11 */}
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
      </div>

      {/* Indicadores de ambiente — Task 10 */}
      <div className="flex justify-center gap-2">
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
              {/* Ripple ao ativar */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 rounded-full"
                  style={{
                    background: `${caminho.corDominante}40`,
                    animation: "chip-ripple 500ms var(--ease-out-strong) both",
                  }}
                />
              )}
              <Icon className="relative z-10 h-3 w-3" />
              <span className="relative z-10 hidden sm:inline">{AMBIENTE_META[key].label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface DilemmaWorldViewProps {
  world: DilemmaWorld;
  className?: string;
}

export function DilemmaWorldView({ world, className }: DilemmaWorldViewProps) {
  const [caminhoAtivo, setCaminhoAtivo] = useState<"parado" | "mudanca">("parado");
  const [ambienteParado, setAmbienteParado] = useState<AmbienteKey>("quarto");
  const [ambienteMudanca, setAmbienteMudanca] = useState<AmbienteKey>("quarto");
  const containerRef = useRef<HTMLDivElement>(null);

  const caminho = caminhoAtivo === "parado" ? world.caminhoParado : world.caminhoMudanca;
  const ambienteAtivo = caminhoAtivo === "parado" ? ambienteParado : ambienteMudanca;
  const setAmbiente = caminhoAtivo === "parado" ? setAmbienteParado : setAmbienteMudanca;

  return (
    <div className={cn("flex flex-col gap-5", className)} ref={containerRef}>
      {/* Seletor de caminho — Task 7 */}
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

      {/* Mundo navegável — Task 8 */}
      <div className="h-[420px] sm:h-[480px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={caminhoAtivo}
            className="h-full"
            initial={{ opacity: 0, x: caminhoAtivo === "mudanca" ? 32 : -32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: caminhoAtivo === "mudanca" ? -32 : 32 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.08 }}
          >
            <CaminhoView
              caminho={caminho}
              ambienteAtivo={ambienteAtivo}
              onAmbienteChange={setAmbiente}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dilema original */}
      <div
        className="rounded-[1.5rem] px-5 py-4 text-sm leading-6 text-sky-950/65 italic"
        style={{ background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.5)" }}
      >
        "{world.dilema}"
      </div>
    </div>
  );
}
