export function HourglassLoader() {
  return (
    <div className="tw-hg-scene">
      <div className="tw-hg">
        <div className="tw-hg-top" />
        <div className="tw-hg-bot" />
      </div>
    </div>
  );
}

export function SpinnerBlocksLoader() {
  return (
    <div className="tw-spinner-blocks">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} />
      ))}
    </div>
  );
}

export function EarthLoader() {
  return (
    <div className="tw-earth">
      <div className="tw-earth-strip" />
    </div>
  );
}

export function LoadingTextLoader() {
  return (
    <svg
      className="tw-text-loader text-sky-950/80"
      viewBox="0 0 204 52"
      width="204"
      height="52"
      aria-hidden="true"
    >
      {["L", "O", "A", "D", "I", "N", "G"].map((char, i) => (
        <text
          key={char + i}
          x={6 + i * 28}
          y="40"
          fontSize="34"
          fontWeight="500"
          fill="currentColor"
        >
          {char}
        </text>
      ))}
    </svg>
  );
}
