"use client";

import {
  ScanSearch,
} from "lucide-react";

import {
  useState,
} from "react";

const API =
  process.env
    .NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

type Importance = {
  feature: string;
  importance: number;
};

type Contribution = {
  feature: string;
  contribution: number;
};

type ExplainResult = {
  top_feature: string;
  global_importance: Importance[];
  one_forecast: Contribution[];
  dependence: {
    value: number;
    shap: number;
  }[];
  sample_size: number;
};

export default function ExplainModel() {
  const [
    result,
    setResult,
  ] =
    useState<ExplainResult | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function runSHAP() {
    try {
      setLoading(true);

      const response =
        await fetch(
          `${API}/explain`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "SHAP failed"
        );
      }

      setResult(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "SHAP failed."
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
            <ScanSearch
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1557FF]">
              Step 7
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#101828]">
              SHAP Explainability
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Inspect which predictors
              influenced the trained
              model's forecasts.
            </p>
          </div>
        </div>

        <button
          onClick={runSHAP}
          disabled={loading}
          className="rounded-xl bg-[#1557FF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D49E8] disabled:opacity-50"
        >
          {loading
            ? "Computing..."
            : "Compute SHAP"}
        </button>
      </div>

      {result && (
        <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_1fr]">

          {/* IMPORTANCE */}

          <div className="rounded-[22px] border border-[#E7EAF0] p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#344054]">
                  Global Feature
                  Importance
                </p>

                <p className="mt-1 text-xs text-[#98A2B3]">
                  Mean absolute SHAP
                  magnitude
                </p>
              </div>

              <span className="rounded-xl bg-[#EEF4FF] px-3 py-2 text-xs font-semibold text-[#1557FF]">
                Top:{" "}
                {
                  result.top_feature
                }
              </span>
            </div>

            <div className="mt-6 space-y-5">

              {result.global_importance.map(
                (item) => {
                  const max =
                    result
                      .global_importance[0]
                      ?.importance || 1;

                  const width =
                    (item.importance /
                      max) *
                    100;

                  return (
                    <div
                      key={
                        item.feature
                      }
                    >
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-medium text-[#344054]">
                          {
                            item.feature
                          }
                        </span>

                        <span className="text-xs text-[#98A2B3]">
                          {item.importance.toFixed(
                            6
                          )}
                        </span>
                      </div>

                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEF1F5]">
                        <div
                          className="h-full rounded-full bg-[#1557FF]"
                          style={{
                            width: `${Math.max(
                              width,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* CONTRIBUTIONS */}

          <div className="rounded-[22px] bg-[#F8FAFC] p-5">

            <p className="font-semibold text-[#344054]">
              One Forecast
            </p>

            <p className="mt-1 text-xs text-[#98A2B3]">
              Positive and negative
              model contributions
            </p>

            <div className="mt-5 space-y-2">

              {result.one_forecast.map(
                (item) => (
                  <div
                    key={
                      item.feature
                    }
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                  >
                    <p className="text-sm font-medium text-[#344054]">
                      {
                        item.feature
                      }
                    </p>

                    <p
                      className={`text-sm font-semibold ${
                        item.contribution >=
                        0
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {item.contribution >=
                      0
                        ? "+"
                        : ""}
                      {item.contribution.toFixed(
                        5
                      )}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-[#FEDF89] bg-[#FFFAEB] p-4">
            <p className="text-sm text-[#B54708]">
              SHAP describes what the
              trained model relied on.
              It does not establish
              causal relationships with
              tourist arrivals.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}