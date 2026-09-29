"use client";

import {
  ChartNoAxesCombined,
} from "lucide-react";

import {
  useState,
} from "react";

const API =
  process.env
    .NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

type MetricSet = {
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
};

type ComparisonPoint = {
  date: string;
  actual: number;
  lstm: number;
  naive: number;
  seasonal_naive: number;
};

type EvaluateResult = {
  metrics: {
    lstm: MetricSet;
    naive: MetricSet;
    seasonal_naive: MetricSet;
  };

  comparison: ComparisonPoint[];
};

export default function EvaluateModel() {
  const [
    result,
    setResult,
  ] =
    useState<EvaluateResult | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function runEvaluation() {
    try {
      setLoading(true);

      const response =
        await fetch(
          `${API}/evaluate`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Evaluation failed"
        );
      }

      setResult(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Evaluation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[26px] border border-[#E7EAF0] bg-white p-6 md:p-7">

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1557FF]">
            <ChartNoAxesCombined
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1557FF]">
              Step 6
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#101828]">
              Model Evaluation
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Compare LSTM predictions
              with naive baselines on
              held-out test months.
            </p>
          </div>
        </div>

        <button
          onClick={runEvaluation}
          disabled={loading}
          className="rounded-xl bg-[#1557FF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D49E8] disabled:opacity-50"
        >
          {loading
            ? "Evaluating..."
            : "Evaluate Model"}
        </button>
      </div>

      {result && (
        <div className="mt-7">

          <div className="grid gap-4 lg:grid-cols-3">

            <ModelCard
              name="LSTM"
              tag="Forecast model"
              metrics={
                result.metrics.lstm
              }
              primary
            />

            <ModelCard
              name="Naive"
              tag="Baseline"
              metrics={
                result.metrics.naive
              }
            />

            <ModelCard
              name="Seasonal Naive"
              tag="Baseline"
              metrics={
                result.metrics
                  .seasonal_naive
              }
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-[22px] border border-[#E7EAF0]">

            <div className="border-b border-[#E7EAF0] px-5 py-4">
              <p className="font-semibold text-[#344054]">
                Prediction Sample
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">

                <thead className="bg-[#F8FAFC] text-xs text-[#98A2B3]">
                  <tr>
                    <th className="px-5 py-3">
                      Date
                    </th>
                    <th className="px-5 py-3">
                      Actual
                    </th>
                    <th className="px-5 py-3">
                      LSTM
                    </th>
                    <th className="px-5 py-3">
                      Naive
                    </th>
                    <th className="px-5 py-3">
                      Seasonal
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {result.comparison
                    .slice(0, 10)
                    .map((row) => (
                      <tr
                        key={
                          row.date
                        }
                        className="border-t border-[#EEF0F3]"
                      >
                        <td className="px-5 py-3 font-medium text-[#344054]">
                          {
                            row.date
                          }
                        </td>

                        {[
                          row.actual,
                          row.lstm,
                          row.naive,
                          row.seasonal_naive,
                        ].map(
                          (
                            value,
                            index
                          ) => (
                            <td
                              key={
                                index
                              }
                              className="px-5 py-3 text-[#667085]"
                            >
                              {Math.round(
                                value
                              ).toLocaleString()}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ModelCard({
  name,
  tag,
  metrics,
  primary,
}: {
  name: string;
  tag: string;
  metrics: MetricSet;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] p-5 ${
        primary
          ? "bg-[#1557FF] text-white"
          : "border border-[#E7EAF0] bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`font-semibold ${
            primary
              ? "text-white"
              : "text-[#344054]"
          }`}
        >
          {name}
        </p>

        <span
          className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
            primary
              ? "bg-white/15 text-white"
              : "bg-[#F4F7FB] text-[#667085]"
          }`}
        >
          {tag}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Score
          label="MAE"
          value={metrics.mae.toLocaleString(
            undefined,
            {
              maximumFractionDigits: 0,
            }
          )}
          primary={primary}
        />

        <Score
          label="RMSE"
          value={metrics.rmse.toLocaleString(
            undefined,
            {
              maximumFractionDigits: 0,
            }
          )}
          primary={primary}
        />

        <Score
          label="MAPE"
          value={`${metrics.mape.toFixed(
            2
          )}%`}
          primary={primary}
        />

        <Score
          label="R²"
          value={metrics.r2.toFixed(
            4
          )}
          primary={primary}
        />
      </div>
    </div>
  );
}

function Score({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs ${
          primary
            ? "text-white/60"
            : "text-[#98A2B3]"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-semibold ${
          primary
            ? "text-white"
            : "text-[#101828]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}