import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Cloud } from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

function WaysPage() {
  // Placeholder data for previously generated ways
  const ways = [
    { id: 1, title: "Meditação guiada matinal", date: "15 Abr 2026", preview: "Uma sessão de 10 minutos para começar o dia com calma..." },
    { id: 2, title: "Exercício de respiração 4-7-8", date: "14 Abr 2026", preview: "Técnica de respiração para reduzir ansiedade..." },
    { id: 3, title: "Gratidão do dia", date: "13 Abr 2026", preview: "Liste três coisas pelas quais você é grato hoje..." },
    { id: 4, title: "Visualização positiva", date: "12 Abr 2026", preview: "Imagine seu lugar seguro e tranquilo..." },
    { id: 5, title: "Body scan relaxante", date: "11 Abr 2026", preview: "Relaxamento progressivo dos pés à cabeça..." },
  ];

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{
        background: "linear-gradient(135deg, #5cc3ff 0%, #4ab8f0 35%, #a8d8f0 60%, #f5e6a3 100%)",
      }}
    >
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)",
                backdropFilter: "blur(16px) saturate(1.8)",
                WebkitBackdropFilter: "blur(16px) saturate(1.8)",
                border: "1px solid rgba(255,255,255,0.35)",
                boxShadow: "0 4px 24px rgba(92,195,255,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              <ArrowLeft size={18} style={{ color: "rgba(255,255,255,0.9)" }} />
            </motion.div>
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "#ffdb58" }}>
            Meus Ways
          </h1>
          <Cloud size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
        </div>

        {/* Ways list */}
        <div className="flex flex-col gap-4">
          {ways.map((way, index) => (
            <motion.div
              key={way.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="rounded-2xl p-5 cursor-pointer"
              whileHover={{ scale: 1.01, y: -2 }}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
                backdropFilter: "blur(20px) saturate(1.6)",
                WebkitBackdropFilter: "blur(20px) saturate(1.6)",
                border: "1px solid rgba(255,255,255,0.4)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-black/80">{way.title}</h3>
                <span className="text-xs text-black/40 whitespace-nowrap ml-3 mt-1">{way.date}</span>
              </div>
              <p className="text-sm text-black/55 leading-relaxed">{way.preview}</p>
            </motion.div>
          ))}
        </div>

        {/* Empty state hint */}
        {ways.length === 0 && (
          <div className="text-center py-20">
            <Cloud size={48} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.5)" }} />
            <p className="text-black/40">Nenhum Way gerado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
