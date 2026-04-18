import { cn } from "@/lib/utils";

export interface WayCardProps {
  title?: string;
  location?: string;
  date?: string;
  temperature?: string;
  forecast?: { label: string; value: string }[];
  className?: string;
  onClick?: () => void;
}

const TreeSvg = ({ fill }: { fill: string }) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill={fill} stroke={fill}>
    <path
      d="M32,0C18.148,0,12,23.188,12,32c0,9.656,6.883,17.734,16,19.594V60c0,2.211,1.789,4,4,4s4-1.789,4-4v-8.406 C45.117,49.734,52,41.656,52,32C52,22.891,46.051,0,32,0z"
      fill={fill}
    />
  </svg>
);

export function WayCard({
  title = "Cloudy",
  location = "Spain",
  date = "Monday, 4th May",
  temperature = "24°C",
  forecast = [
    { label: "Tuesday, 5th May", value: "24°C" },
    { label: "Wednesday, 6th May", value: "26°C" },
    { label: "Thursday, 7th May", value: "22°C" },
  ],
  className,
  onClick,
}: WayCardProps) {
  return (
    <div className={cn("way-card", className)} onClick={onClick} role={onClick ? "button" : undefined}>
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
          <TreeSvg fill="#b77873" />
        </div>
        <div className="way-tree-2">
          <TreeSvg fill="#b77873" />
        </div>
        <div className="way-tree-3">
          <TreeSvg fill="#a16773" />
        </div>
        <div className="way-filter" />
      </section>

      <section className="way-content">
        <div className="way-weather-info">
          <div className="way-left-side">
            <div className="way-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  stroke="#ffffff"
                  d="M22 14.3529C22 17.4717 19.4416 20 16.2857 20H11M14.381 9.02721C14.9767 8.81911 15.6178 8.70588 16.2857 8.70588C16.9404 8.70588 17.5693 8.81468 18.1551 9.01498M7.11616 11.6089C6.8475 11.5567 6.56983 11.5294 6.28571 11.5294C3.91878 11.5294 2 13.4256 2 15.7647C2 18.1038 3.91878 20 6.28571 20H7M7.11616 11.6089C6.88706 10.9978 6.7619 10.3369 6.7619 9.64706C6.7619 6.52827 9.32028 4 12.4762 4C15.4159 4 17.8371 6.19371 18.1551 9.01498M7.11616 11.6089C7.68059 11.7184 8.20528 11.9374 8.66667 12.2426M18.1551 9.01498C18.8381 9.24853 19.4623 9.60648 20 10.0614"
                />
              </svg>
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
