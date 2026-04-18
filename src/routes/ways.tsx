import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/liquid-glass-button";
import { WayCard } from "@/components/ui/way-card";

export const Route = createFileRoute("/ways")({
  component: WaysPage,
});

const sampleWays = [
  {
    title: "Cloudy",
    location: "Spain",
    date: "Monday, 4th May",
    temperature: "24°C",
    forecast: [
      { label: "Tuesday, 5th May", value: "24°C" },
      { label: "Wednesday, 6th May", value: "26°C" },
      { label: "Thursday, 7th May", value: "22°C" },
    ],
  },
  {
    title: "Sunny",
    location: "Brasil",
    date: "Friday, 8th May",
    temperature: "28°C",
    forecast: [
      { label: "Saturday, 9th May", value: "29°C" },
      { label: "Sunday, 10th May", value: "27°C" },
      { label: "Monday, 11th May", value: "25°C" },
    ],
  },
  {
    title: "Calm",
    location: "Portugal",
    date: "Tuesday, 12th May",
    temperature: "21°C",
    forecast: [
      { label: "Wednesday, 13th May", value: "22°C" },
      { label: "Thursday, 14th May", value: "23°C" },
      { label: "Friday, 15th May", value: "20°C" },
    ],
  },
];

function WaysPage() {
  return (
    <div className="safe-screen relative overflow-hidden">
      <div className="absolute left-4 top-4 z-10">
        <LiquidGlassButton to="/" icon={ArrowLeft} compact />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-5xl flex-col items-center justify-center gap-10 px-4 pt-20">
        <div className="grid w-full grid-cols-1 place-items-center gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {sampleWays.map((way, i) => (
            <WayCard key={i} {...way} />
          ))}
        </div>
      </div>
    </div>
  );
}
