import { useState } from "react";

import { getWorldCardMeta } from "@/lib/journey-world";
import type { WayHistoryEntry } from "@/lib/way-history";

interface Props {
  way: WayHistoryEntry;
  onDelete: () => void;
}

function TreeSvg({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 30 46"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <polygon points="15,2 28,18 2,18" fill={color} />
      <polygon points="15,10 30,30 0,30" fill={color} />
      <rect x="11" y="30" width="8" height="16" fill={color} fillOpacity="0.6" />
    </svg>
  );
}

export function WayLandscapeCard({ way, onDelete }: Props) {
  const card = getWorldCardMeta(way.world);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const date = new Date(way.createdAt);
  const dayNum = date.getDate();
  const monthStr = date.toLocaleDateString("pt-BR", { month: "short" });
  const rawText = way.rawInput.trim();
  const subtitle = rawText.length > 52 ? rawText.slice(0, 52) + "…" : rawText;

  const cssVars = {
    // Landscape scene variables
    "--way-sky-top": card.accentGradient[0],
    "--way-sky-bottom": card.accentGradient[1],
    "--way-sun": "#ffffffdd",
    "--way-ocean-top": `${card.leftPath.color}55`,
    "--way-ocean-bottom": `${card.leftPath.color}88`,
    "--way-hill-far-1": `${card.leftPath.color}88`,
    "--way-hill-far-2": `${card.leftPath.color}aa`,
    "--way-hill-front": card.leftPath.color,
    "--way-hill-back": card.rightPath.color,
    // Neobrutalist card variables
    "--main-color": card.leftPath.color,
    "--main-focus": card.rightPath.color,
    "--font-color": "#1e293b",
    "--font-color-sub": "#64748b",
    "--bg-color": "#ffffff",
  } as React.CSSProperties;

  return (
    <div
      style={{
        ...cssVars,
        width: "100%",
        height: "100%",
        background: "var(--bg-color)",
        border: "2px solid var(--main-color)",
        boxShadow: "3px 3px 0 var(--main-color)",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        gap: "6px",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── card-img: cena de paisagem ou imagem gerada ── */}
      <div
        style={{ transition: "transform 0.5s ease", flexShrink: 0 }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "";
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "76px",
            borderRadius: "3px",
            overflow: "hidden",
            background: `linear-gradient(135deg, ${card.accentGradient[0]}, ${card.accentGradient[1]})`,
          }}
        >
          {card.cardImageQuery ? (
            <img
              src={`https://image.pollinations.ai/prompt/${encodeURIComponent(card.cardImageQuery)}?width=144&height=96&nologo=true`}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <>
              <div className="way-sky" />
              <div className="way-sun" />
              <div className="way-hill-1">
                <div className="way-shadow-hill-1" />
              </div>
              <div className="way-hill-2">
                <div className="way-shadow-hill-2" />
              </div>
              <div className="way-hill-3" />
              <div className="way-tree-1">
                <TreeSvg color={card.leftPath.color} />
              </div>
              <div className="way-tree-2">
                <TreeSvg color={card.leftPath.color} />
              </div>
              <div className="way-hill-4" />
              <div className="way-tree-3">
                <TreeSvg color={card.rightPath.color} />
              </div>
              <div className="way-ocean">
                <div className="way-reflection" />
                <div className="way-reflection" />
                <div className="way-reflection" />
              </div>
              <div className="way-filter" />
            </>
          )}
        </div>
      </div>

      {/* ── card-title: título do mundo ── */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          textAlign: "center",
          color: "var(--font-color)",
          lineHeight: 1.25,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          flexShrink: 0,
        } as React.CSSProperties}
      >
        {card.title}
      </div>

      {/* ── card-subtitle: dilema em texto ── */}
      <div
        style={{
          fontSize: "10px",
          fontWeight: 400,
          color: "var(--font-color-sub)",
          lineHeight: 1.45,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {subtitle}
      </div>

      {/* ── card-divider ── */}
      <hr
        style={{
          width: "100%",
          border: "none",
          borderTop: "1.5px solid var(--main-color)",
          borderRadius: "50px",
          margin: 0,
          opacity: 0.35,
          flexShrink: 0,
        }}
      />

      {/* ── card-footer: data + botão excluir ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {/* data como "preço" */}
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--font-color)", lineHeight: 1 }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 500,
              color: "var(--font-color-sub)",
              textTransform: "capitalize",
              display: "block",
              letterSpacing: "0.04em",
            }}
          >
            {monthStr}
          </span>
          {dayNum}
        </div>

        {/* botão excluir */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: deleteHovered ? "82px" : "30px",
            height: "30px",
            border: "none",
            borderRadius: deleteHovered ? "26px" : "50%",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: "width 0.3s, border-radius 0.3s",
            boxShadow: "2px 2px 10px rgba(0,0,0,0.199)",
            background: "linear-gradient(250deg, rgba(255,135,65,1) 15%, rgba(255,65,65,1) 65%)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setDeleteHovered(true)}
          onMouseLeave={() => setDeleteHovered(false)}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(2px, 2px)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
          }}
          aria-label={`Excluir dilema: ${way.rawInput}`}
        >
          <div
            style={{
              width: deleteHovered ? "30%" : "100%",
              transition: "width 0.3s, padding-left 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: deleteHovered ? "12px" : "0",
              flexShrink: 0,
            }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="white"
              height={12}
              width={12}
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
            </svg>
          </div>
          <div
            style={{
              position: "absolute",
              right: "0%",
              width: deleteHovered ? "70%" : "0%",
              opacity: deleteHovered ? 1 : 0,
              color: "white",
              fontSize: "0.7em",
              fontWeight: 600,
              transition: "opacity 0.3s, width 0.3s, padding-right 0.3s",
              paddingRight: deleteHovered ? "8px" : "0",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            Deletar
          </div>
        </button>
      </div>
    </div>
  );
}
