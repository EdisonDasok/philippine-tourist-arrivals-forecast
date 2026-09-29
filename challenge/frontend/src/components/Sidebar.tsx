"use client";

import {
  LayoutDashboard,
  Database,
  Sparkles,
  BrainCircuit,
  ChartNoAxesCombined,
  ScanSearch,
  PlaneTakeoff,
  Eraser,
  Settings,
  Plane,
} from "lucide-react";

export type Section =
  | "overview"
  | "dataset"
  | "cleaning"
  | "features"
  | "training"
  | "evaluation"
  | "explain"
  | "forecast";

type Props = {
  active: Section;
  onChange: (section: Section) => void;
};

const items = [
  {
    id: "overview" as Section,
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "dataset" as Section,
    label: "Dataset",
    icon: Database,
  },
  {
    id: "cleaning" as Section,
    label: "Cleaning",
    icon: Eraser,
  },
  {
    id: "features" as Section,
    label: "Features",
    icon: Sparkles,
  },
  {
    id: "training" as Section,
    label: "Training",
    icon: BrainCircuit,
  },
  {
    id: "evaluation" as Section,
    label: "Evaluation",
    icon: ChartNoAxesCombined,
  },
  {
    id: "explain" as Section,
    label: "Explain",
    icon: ScanSearch,
  },
  {
    id: "forecast" as Section,
    label: "Forecast",
    icon: PlaneTakeoff,
  },
];

export default function Sidebar({
  active,
  onChange,
}: Props) {
  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[88px] flex-col items-center bg-[#1557FF] py-5 md:flex">

      {/* LOGO */}

      <button
        onClick={() =>
          onChange("overview")
        }
        className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1557FF]"
        title="TouristFlow AI"
      >
        <Plane size={22} />
      </button>

      {/* NAVIGATION */}

      <nav className="flex flex-1 flex-col items-center gap-2">
        {items.map(
          ({
            id,
            label,
            icon: Icon,
          }) => {
            const selected =
              active === id;

            return (
              <button
                key={id}
                onClick={() =>
                  onChange(id)
                }
                title={label}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                  selected
                    ? "bg-white text-[#1557FF] shadow-lg"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={20} />
              </button>
            );
          }
        )}
      </nav>

      {/* SETTINGS */}

      <button
        title="Settings"
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <Settings size={19} />
      </button>
    </aside>
  );
}