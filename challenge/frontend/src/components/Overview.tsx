"use client";

import {
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  Database,
  PlaneTakeoff,
  ScanSearch,
  Sparkles,
} from "lucide-react";

import type {
  Section,
} from "./Sidebar";

type DatasetInfo = {
  rows: number;
  columns: number;
  date_start: string;
  date_end: string;
} | null;

type CleanInfo = {
  rows_after_cleaning: number;
  duplicates_removed: number;
  outlier_count: number;
} | null;

type Props = {
  apiConnected: boolean;
  dataset: DatasetInfo;
  cleanResult: CleanInfo;
  onNavigate: (
    section: Section
  ) => void;
};

export default function Overview({
  apiConnected,
  dataset,
  cleanResult,
  onNavigate,
}: Props) {
  const steps = [
    "Dataset",
    "Cleaning",
    "Features",
    "Preparation",
    "Training",
    "Evaluation",
    "SHAP",
    "Forecast",
  ];

  return (
    <div className="space-y-5">

      {/* HERO + STATUS */}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.5fr]">

        {/* BLUE HERO */}

        <div className="relative overflow-hidden rounded-[28px] bg-[#1557FF] p-7 text-white shadow-[0_18px_50px_rgba(21,87,255,0.22)]">

          <button
            onClick={() =>
              onNavigate(
                "forecast"
              )
            }
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
          >
            <ArrowUpRight size={20} />
          </button>

          <p className="text-sm font-medium text-white/70">
            LSTM Forecasting System
          </p>

          <h1 className="mt-3 max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
            Philippine Tourist
            <br />
            Arrivals Forecasting
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
            A leakage-safe
            time-series pipeline
            combining LSTM
            forecasting with SHAP
            model explainability.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">

            <HeroMetric
              label="Lookback"
              value="12"
              suffix="months"
            />

            <HeroMetric
              label="Selected"
              value="8"
              suffix="features"
            />

            <HeroMetric
              label="Pipeline"
              value="8"
              suffix="stages"
            />
          </div>

          <button
            onClick={() =>
              onNavigate(
                "dataset"
              )
            }
            className="mt-8 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1557FF] transition hover:bg-blue-50"
          >
            Open Pipeline
          </button>
        </div>

        {/* MAIN STATS */}

        <div className="grid gap-4 sm:grid-cols-2">

          <StatCard
            icon={
              <Database size={20} />
            }
            title="Dataset"
            value={
              dataset
                ? dataset.rows.toLocaleString()
                : "—"
            }
            subtitle="Raw observations"
          />

          <StatCard
            icon={
              <Sparkles size={20} />
            }
            title="Clean Data"
            value={
              cleanResult
                ? cleanResult.rows_after_cleaning.toLocaleString()
                : "—"
            }
            subtitle="Prepared observations"
          />

          <StatCard
            icon={
              <BrainCircuit
                size={20}
              />
            }
            title="Forecast Model"
            value="LSTM"
            subtitle="Neural time-series model"
          />

          <StatCard
            icon={
              <ScanSearch size={20} />
            }
            title="Explainability"
            value="SHAP"
            subtitle="Model interpretation"
          />
        </div>
      </div>

      {/* SECOND ROW */}

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">

        {/* PIPELINE */}

        <div className="rounded-[26px] border border-[#E7EAF0] bg-white p-6">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1557FF]">
                Workflow
              </p>

              <h2 className="mt-1 text-xl font-semibold text-[#101828]">
                Forecasting Pipeline
              </h2>
            </div>

            <button
              onClick={() =>
                onNavigate(
                  "dataset"
                )
              }
              className="rounded-xl border border-[#E7EAF0] px-4 py-2 text-sm font-medium text-[#344054] hover:bg-[#F8FAFC]"
            >
              View all
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

            {steps.map(
              (
                step,
                index
              ) => (
                <div
                  key={step}
                  className="rounded-2xl bg-[#F7F9FC] p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4FF] text-xs font-bold text-[#1557FF]">
                    {index + 1}
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#344054]">
                    {step}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* SYSTEM */}

        <div className="rounded-[26px] border border-[#E7EAF0] bg-white p-6">

          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1557FF]">
            System
          </p>

          <h2 className="mt-1 text-xl font-semibold text-[#101828]">
            Current Status
          </h2>

          <div className="mt-6 space-y-4">

            <StatusRow
              icon={
                <PlaneTakeoff
                  size={18}
                />
              }
              title="Backend API"
              value={
                apiConnected
                  ? "Connected"
                  : "Offline"
              }
              positive={
                apiConnected
              }
            />

            <StatusRow
              icon={
                <CalendarDays
                  size={18}
                />
              }
              title="Data Range"
              value={
                dataset
                  ? `${dataset.date_start.slice(
                      0,
                      7
                    )} → ${dataset.date_end.slice(
                      0,
                      7
                    )}`
                  : "Not loaded"
              }
            />

            <StatusRow
              icon={
                <Sparkles size={18} />
              }
              title="Outliers"
              value={
                cleanResult
                  ? `${cleanResult.outlier_count} flagged`
                  : "Not checked"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div>
      <p className="text-xs text-white/60">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value}
      </p>

      <p className="text-[11px] text-white/60">
        {suffix}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#E7EAF0] bg-white p-5">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#1557FF]">
        {icon}
      </div>

      <p className="mt-5 text-sm text-[#667085]">
        {title}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight text-[#101828]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#98A2B3]">
        {subtitle}
      </p>
    </div>
  );
}

function StatusRow({
  icon,
  title,
  value,
  positive,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F7FB] text-[#1557FF]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#98A2B3]">
          {title}
        </p>

        <p
          className={`truncate text-sm font-semibold ${
            positive === false
              ? "text-red-500"
              : "text-[#344054]"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}