"use client";

import {
  Bell,
  Plane,
} from "lucide-react";

import type {
  Section,
} from "./Sidebar";

type Props = {
  active: Section;
  apiConnected: boolean;
  onChange: (
    section: Section
  ) => void;
};

export default function Topbar({
  active,
  apiConnected,
  onChange,
}: Props) {
  const tabs: {
    label: string;
    target: Section;
  }[] = [
    {
      label: "Overview",
      target: "overview",
    },
    {
      label: "Pipeline",
      target: "dataset",
    },
    {
      label: "Results",
      target: "evaluation",
    },
    {
      label: "Forecast",
      target: "forecast",
    },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center border-b border-[#E7EAF0] bg-white px-5 md:left-[88px] md:px-8">

      {/* MOBILE BRAND */}

      <button
        onClick={() =>
          onChange("overview")
        }
        className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1557FF] text-white md:hidden"
      >
        <Plane size={19} />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm font-semibold text-[#111827]">
          TouristFlow AI
        </p>

        <p className="text-xs text-[#98A2B3]">
          Philippine Tourist
          Arrivals
        </p>
      </div>

      {/* TOP NAV */}

      <div className="mx-auto flex items-center rounded-xl bg-[#F4F6F8] p-1">

        {tabs.map((tab) => {
          const selected =
            active === tab.target ||
            (tab.target ===
              "dataset" &&
              [
                "dataset",
                "cleaning",
                "features",
                "training",
              ].includes(active));

          return (
            <button
              key={tab.label}
              onClick={() =>
                onChange(
                  tab.target
                )
              }
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-5 sm:text-sm ${
                selected
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#667085] hover:text-[#111827]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RIGHT */}

      <div className="ml-4 flex items-center gap-3">

        <div className="hidden items-center gap-2 rounded-xl border border-[#E7EAF0] px-3 py-2 sm:flex">
          <span
            className={`h-2 w-2 rounded-full ${
              apiConnected
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />

          <span className="text-xs font-medium text-[#667085]">
            {apiConnected
              ? "API Online"
              : "API Offline"}
          </span>
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7EAF0] text-[#667085]">
          <Bell size={17} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="hidden h-10 items-center gap-2 rounded-xl bg-[#F5F7FA] px-2 pr-3 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1557FF] text-xs font-bold text-white">
            TA
          </div>

          <p className="text-xs font-semibold text-[#344054]">
            ITD105
          </p>
        </div>
      </div>
    </header>
  );
}