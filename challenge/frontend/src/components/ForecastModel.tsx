"use client";

import {
  PlaneTakeoff,
  RotateCcw,
} from "lucide-react";

import {
  useState,
} from "react";

const API =
  process.env
    .NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

type ForecastTemplate = {
  lookback: number;
  features: string[];
  rows: Record<
    string,
    number
  >[];
};

export default function ForecastModel() {
  const [
    template,
    setTemplate,
  ] =
    useState<ForecastTemplate | null>(
      null
    );

  const [
    prediction,
    setPrediction,
  ] =
    useState<number | null>(
      null
    );

  const [
    loadingTemplate,
    setLoadingTemplate,
  ] = useState(false);

  const [
    forecasting,
    setForecasting,
  ] = useState(false);

  async function loadTemplate() {
    try {
      setLoadingTemplate(true);

      const response =
        await fetch(
          `${API}/forecast/template`
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Could not load forecast inputs"
        );
      }

      setTemplate(data);
      setPrediction(null);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not load inputs."
      );
    } finally {
      setLoadingTemplate(false);
    }
  }

  function updateValue(
    rowIndex: number,
    feature: string,
    value: string
  ) {
    if (!template) return;

    setTemplate({
      ...template,
      rows: template.rows.map(
        (row, index) =>
          index === rowIndex
            ? {
                ...row,
                [feature]:
                  Number(value),
              }
            : row
      ),
    });
  }

  async function runForecast() {
    if (!template) return;

    try {
      setForecasting(true);

      const response =
        await fetch(
          `${API}/forecast`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              rows: template.rows,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Forecast failed"
        );
      }

      setPrediction(
        data.predicted_arrivals
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Forecast failed."
      );
    } finally {
      setForecasting(false);
    }
  }

  return (
    <section className="space-y-5">

      {/* FORECAST HERO */}

      <div className="rounded-[28px] bg-[#1557FF] p-7 text-white">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">

          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <PlaneTakeoff
                size={21}
              />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Step 8
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Forecast Next Month
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-white/70">
              Use the most recent
              12-month predictor window
              and generate the LSTM's
              next-month tourist arrival
              estimate.
            </p>
          </div>

          <div className="min-w-[260px] rounded-[22px] bg-white p-6 text-[#101828]">

            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#98A2B3]">
              Predicted arrivals
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {prediction !== null
                ? Math.round(
                    prediction
                  ).toLocaleString()
                : "—"}
            </p>

            <p className="mt-2 text-xs text-[#98A2B3]">
              Next monthly estimate
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">

          <button
            onClick={loadTemplate}
            disabled={loadingTemplate}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1557FF] disabled:opacity-60"
          >
            <RotateCcw
              size={16}
            />

            {loadingTemplate
              ? "Loading..."
              : template
              ? "Reset Inputs"
              : "Load Inputs"}
          </button>

          {template && (
            <button
              onClick={runForecast}
              disabled={forecasting}
              className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
            >
              {forecasting
                ? "Forecasting..."
                : "Generate Forecast"}
            </button>
          )}
        </div>
      </div>

      {/* INPUT TABLE */}

      {template && (
        <div className="rounded-[26px] border border-[#E7EAF0] bg-white p-6">

          <div>
            <h3 className="text-xl font-semibold text-[#101828]">
              12-Month Input Window
            </h3>

            <p className="mt-1 text-sm text-[#667085]">
              Edit predictor values
              before generating the
              next forecast.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[20px] border border-[#E7EAF0]">

            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-[#98A2B3]">
                    Month
                  </th>

                  {template.features.map(
                    (feature) => (
                      <th
                        key={feature}
                        className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#98A2B3]"
                      >
                        {feature}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {template.rows.map(
                  (
                    row,
                    rowIndex
                  ) => (
                    <tr
                      key={rowIndex}
                      className="border-t border-[#EEF0F3]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#1557FF]">
                        M{rowIndex + 1}
                      </td>

                      {template.features.map(
                        (feature) => (
                          <td
                            key={
                              feature
                            }
                            className="px-3 py-2"
                          >
                            <input
                              type="number"
                              step="any"
                              value={
                                row[
                                  feature
                                ]
                              }
                              onChange={(
                                event
                              ) =>
                                updateValue(
                                  rowIndex,
                                  feature,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="w-28 rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-sm text-[#344054] outline-none transition focus:border-[#1557FF] focus:ring-2 focus:ring-[#1557FF]/10"
                            />
                          </td>
                        )
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}