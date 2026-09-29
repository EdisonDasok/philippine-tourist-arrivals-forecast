"use client";

import {
  Check,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  useState,
} from "react";

const API =
  process.env
    .NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

type VIFRemoval = {
  dropped: string;
  vif: number;
};

type FeatureResult = {
  spearman_kept: string[];
  selected_features: string[];
  vif_log: VIFRemoval[];
};

type PrepareResult = {
  train_ratio: number;
  test_ratio: number;
  train_rows: number;
  test_rows: number;
  train_range: string[];
  test_range: string[];
  lookback: number;
  feature_count: number;
  train_windows: number;
  test_windows: number;
  X_train_shape: number[];
  X_test_shape: number[];
};

export default function FeaturePrepare() {
  const [
    featureResult,
    setFeatureResult,
  ] =
    useState<FeatureResult | null>(
      null
    );

  const [
    prepareResult,
    setPrepareResult,
  ] =
    useState<PrepareResult | null>(
      null
    );

  const [
    featureLoading,
    setFeatureLoading,
  ] = useState(false);

  const [
    prepareLoading,
    setPrepareLoading,
  ] = useState(false);

  const [
    trainRatio,
    setTrainRatio,
  ] = useState(80);

  async function runFeatures() {
    try {
      setFeatureLoading(true);

      const response =
        await fetch(
          `${API}/features`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Feature selection failed"
        );
      }

      setFeatureResult(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Feature selection failed."
      );
    } finally {
      setFeatureLoading(false);
    }
  }

  async function runPrepare() {
    try {
      setPrepareLoading(true);

      const response =
        await fetch(
          `${API}/prepare`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              train_ratio:
                trainRatio / 100,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Preparation failed"
        );
      }

      setPrepareResult(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Preparation failed."
      );
    } finally {
      setPrepareLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* FEATURE SELECTION */}

      <section className="rounded-[26px] border border-[#E7EAF0] bg-white p-6 md:p-7">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1557FF]">
              <Sparkles size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1557FF]">
                Step 3
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-[#101828]">
                Feature Selection
              </h2>

              <p className="mt-1 text-sm text-[#667085]">
                Spearman screening
                followed by iterative
                VIF filtering.
              </p>
            </div>
          </div>

          <button
            onClick={runFeatures}
            disabled={featureLoading}
            className="rounded-xl bg-[#1557FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0D49E8] disabled:opacity-50"
          >
            {featureLoading
              ? "Analyzing..."
              : "Run Feature Selection"}
          </button>
        </div>

        {featureResult && (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">

              <Metric
                label="Passed Spearman"
                value={
                  featureResult.spearman_kept
                    .length
                }
              />

              <Metric
                label="Final Predictors"
                value={
                  featureResult
                    .selected_features
                    .length
                }
              />

              <Metric
                label="Removed by VIF"
                value={
                  featureResult.vif_log
                    .length
                }
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">

              <div className="rounded-2xl bg-[#F8FAFC] p-5">
                <p className="text-sm font-semibold text-[#344054]">
                  Selected predictors
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {featureResult
                    .selected_features
                    .map(
                      (feature) => (
                        <span
                          key={
                            feature
                          }
                          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-medium text-[#344054] shadow-sm"
                        >
                          <Check
                            size={13}
                            className="text-green-500"
                          />

                          {feature}
                        </span>
                      )
                    )}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] p-5">
                <p className="text-sm font-semibold text-[#344054]">
                  VIF removals
                </p>

                <div className="mt-4 space-y-3">
                  {featureResult
                    .vif_log.length ===
                  0 ? (
                    <p className="text-sm text-[#98A2B3]">
                      No features
                      removed.
                    </p>
                  ) : (
                    featureResult.vif_log.map(
                      (item) => (
                        <div
                          key={
                            item.dropped
                          }
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-[#667085]">
                            {
                              item.dropped
                            }
                          </span>

                          <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#E5484D]">
                            VIF{" "}
                            {item.vif.toFixed(
                              2
                            )}
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* PREPARE */}

      <section className="rounded-[26px] border border-[#E7EAF0] bg-white p-6 md:p-7">

        <div className="flex flex-col justify-between gap-5 lg:flex-row">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1557FF]">
              <SlidersHorizontal
                size={21}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1557FF]">
                Step 4
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-[#101828]">
                Prepare LSTM Data
              </h2>

              <p className="mt-1 text-sm text-[#667085]">
                Chronological split,
                training-only scaling
                and 12-month windows.
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl bg-[#F8FAFC] p-4">

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#344054]">
                Train / Test
              </span>

              <span className="text-sm font-semibold text-[#1557FF]">
                {trainRatio}% /{" "}
                {100 - trainRatio}%
              </span>
            </div>

            <input
              type="range"
              min="60"
              max="95"
              value={trainRatio}
              onChange={(event) =>
                setTrainRatio(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              className="mt-4 w-full accent-[#1557FF]"
            />

            <button
              onClick={runPrepare}
              disabled={prepareLoading}
              className="mt-4 w-full rounded-xl bg-[#1557FF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0D49E8] disabled:opacity-50"
            >
              {prepareLoading
                ? "Preparing..."
                : "Prepare LSTM Data"}
            </button>
          </div>
        </div>

        {prepareResult && (
          <div className="mt-7">

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <Metric
                label="Train Rows"
                value={
                  prepareResult.train_rows
                }
              />

              <Metric
                label="Test Rows"
                value={
                  prepareResult.test_rows
                }
              />

              <Metric
                label="Train Windows"
                value={
                  prepareResult.train_windows
                }
              />

              <Metric
                label="Test Windows"
                value={
                  prepareResult.test_windows
                }
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <Info
                label="Training range"
                value={`${prepareResult.train_range[0]} → ${prepareResult.train_range[1]}`}
              />

              <Info
                label="Testing range"
                value={`${prepareResult.test_range[0]} → ${prepareResult.test_range[1]}`}
              />

              <Info
                label="Training tensor"
                value={`[${prepareResult.X_train_shape.join(
                  ", "
                )}]`}
              />

              <Info
                label="Testing tensor"
                value={`[${prepareResult.X_test_shape.join(
                  ", "
                )}]`}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#E7EAF0] p-5">

      <p className="text-xs text-[#98A2B3]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-[#101828]">
        {value}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-4">
      <p className="text-xs text-[#98A2B3]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#344054]">
        {value}
      </p>
    </div>
  );
}