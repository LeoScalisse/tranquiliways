import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { WayPalette, WeatherKind } from "@/lib/interpret-way";

export interface WayCardProps {
  title?: string;
  location?: string;
  date?: string;
  temperature?: string;
  forecast?: { label: string; value: string }[];
  palette?: WayPalette;
  weather?: WeatherKind;
  className?: string;
  onClick?: () => void;
}

const DEFAULT_PALETTE: WayPalette = {
  skyTop: "#f7e157",
  skyBottom: "#e96594",
  oceanTop: "#f7da96",
  oceanBottom: "#f1c07d",
  hillFront: "#b77873",
  hillBack: "#a16773",
  hillFar1: "#e6b29d",
  hillFar2: "#c29182",
  sunColor: "#ffffff",
};

const TreeSvg = ({ fill }: { fill: string }) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={fill}>
    <path d="M32,0C18.148,0,12,23.188,12,32c0,9.656,6.883,17.734,16,19.594V60c0,2.211,1.789,4,4,4s4-1.789,4-4v-8.406 C45.117,49.734,52,41.656,52,32C52,22.891,46.051,0,32,0z" />
  </svg>
);

const WeatherIcon = ({ kind }: { kind: WeatherKind }) => {
  const stroke = "#ffffff";
  switch (kind) {
    case "sunny":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke={stroke}
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      );
    case "night":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke={stroke}
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
          />
        </svg>
      );
    case "sunset":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke={stroke}
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            d="M3 18h18M5 14a7 7 0 0114 0M12 4v3M5.6 7.6l2.1 2.1M18.4 7.6l-2.1 2.1"
          />
        </svg>
      );
    case "misty":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke={stroke}
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" d="M3 8h14M5 12h14M3 16h12M7 20h10" />
        </svg>
      );
    case "calm":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke={stroke}
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
          />
        </svg>
      );
    case "cloudy":
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke={stroke}
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            d="M22 14.35C22 17.47 19.44 20 16.29 20H6.29C3.92 20 2 18.1 2 15.76S3.92 11.53 6.29 11.53c.28 0 .56.03.83.08C7.68 8.59 10.16 6.5 13.14 6.5c3.27 0 5.96 2.51 6.27 5.7C20.99 12.47 22 13.31 22 14.35z"
          />
        </svg>
      );
  }
};

export function WayCard({
  title = "Calmaria",
  location = "Aqui",
  date = "Hoje",
  temperature = "22°",
  forecast = [],
  palette = DEFAULT_PALETTE,
  weather = "sunset",
  className,
  onClick,
}: WayCardProps) {
  const style = {
    "--way-sky-top": palette.skyTop,
    "--way-sky-bottom": palette.skyBottom,
    "--way-ocean-top": palette.oceanTop,
    "--way-ocean-bottom": palette.oceanBottom,
    "--way-hill-front": palette.hillFront,
    "--way-hill-back": palette.hillBack,
    "--way-hill-far-1": palette.hillFar1,
    "--way-hill-far-2": palette.hillFar2,
    "--way-sun": palette.sunColor,
  } as CSSProperties;

  return (
    <div
      className={cn("way-card", className)}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <section className="way-landscape">
        <div className="way-sky" />
        <div className="way-sun" />
        <div className="way-hill-1" />
        <div className="way-hill-2" />
        <div className="way-ocean">
          <div className="way-reflection" />
          <div className="way-reflection" />
          <div className="way-reflection" />
          <div className="way-reflection" />
          <div className="way-reflection" />
          <div className="way-shadow-hill-1" />
          <div className="way-shadow-hill-2" />
        </div>
        <div className="way-hill-3" />
        <div className="way-hill-4" />
        <div className="way-tree-1">
          <TreeSvg fill={palette.hillFront} />
        </div>
        <div className="way-tree-2">
          <TreeSvg fill={palette.hillFront} />
        </div>
        <div className="way-tree-3">
          <TreeSvg fill={palette.hillBack} />
        </div>
        <div className="way-filter" />
      </section>

      <section className="way-content">
        <div className="way-weather-info">
          <div className="way-left-side">
            <div className="way-icon">
              <WeatherIcon kind={weather} />
            </div>
            <p>{title}</p>
          </div>
          <div className="way-right-side">
            <div className="way-location">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#ffffff">
                  <path
                    fill="#ffffff"
                    d="M32,0C18.746,0,8,10.746,8,24c0,5.219,1.711,10.008,4.555,13.93c0.051,0.094,0.059,0.199,0.117,0.289l16,24 C29.414,63.332,30.664,64,32,64s2.586-0.668,3.328-1.781l16-24c0.059-0.09,0.066-0.195,0.117-0.289C54.289,34.008,56,29.219,56,24 C56,10.746,45.254,0,32,0z M32,32c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S36.418,32,32,32z"
                  />
                </svg>
                <span>{location}</span>
              </div>
            </div>
            <p>{date}</p>
            <p className="way-temperature">{temperature}</p>
          </div>
        </div>
        <div className="way-forecast">
          {forecast.map((f, i) => (
            <div key={i} className="contents">
              <div>
                <p>{f.label}</p>
                <p>{f.value}</p>
              </div>
              {i < forecast.length - 1 && <div className="way-separator" />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
