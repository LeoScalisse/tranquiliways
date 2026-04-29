export function AnimatedOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Orbe 1 — grande, topo direito, azul claro, ciclo 10s */}
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
      {/* Orbe 2 — média, centro esquerdo, branco, ciclo 14s */}
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
      {/* Orbe 3 — pequena, fundo direito, creme/amarelo, ciclo 8s */}
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
