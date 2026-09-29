"use client";

import {
  BrainCircuit,
  Trophy,
} from "lucide-react";

import {
  useState,
} from "react";

const API =
  process.env
    .NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

type SearchResult = {
  units: number;
  dropout: number;
  batch_size: number;
  val_loss: number;
  epochs: number;
};

type TrainResult = {
  best_params: {
    units: number;
    dropout: number;
    batch_size: number;
  };

  best_val_loss: number;
  epochs_run: number;

  loss_history: number[];
  val_loss_history: number[];

  search_results: SearchResult[];
};

export default function TrainModel() {
  const [
    result,
    setResult,
  ] =
    useState<TrainResult | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  async function trainModel() {
    try {
      setLoading(true);

      const response =
        await fetch(
          `${API}/train`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Training failed"
        );
      }

      setResult(data);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Training failed."
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
            <BrainCircuit
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1557FF]">
              Step 5
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#101828]">
              Train & Tune LSTM
            </h2>

            <p className="mt-1 text-sm text-[#667085]">
              Eight hyperparameter
              configurations are tested
              using validation loss.
            </p>
          </div>
        </div>

        <button
          onClick={trainModel}
          disabled={loading}
          className="rounded-xl bg-[#1557FF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D49E8] disabled:opacity-50"
        >
          {loading
            ? "Training..."
            : "Train & Tune"}
        </button>
      </div>

      {loading && (
        <div className="mt-6 rounded-2xl bg-[#EEF4FF] p-5">
          <p className="text-sm font-semibold text-[#1557FF]">
            Training in progress
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1557FF]" />
          </div>
        </div>
      )}

      {result && (
        <div className="mt-7">

          <div className="grid gap-5 lg:grid-cols-[1.2fr_2fr]">

            {/* WINNER */}

            <div className="rounded-[24px] bg-[#1557FF] p-6 text-white">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Trophy size={19} />
              </div>

              <p className="mt-6 text-sm text-white/70">
                Selected configuration
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {
                  result.best_params
                    .units
                }{" "}
                Units
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <SmallStat
                  label="Dropout"
                  value={
                    result.best_params
                      .dropout
                  }
                />

                <SmallStat
                  label="Batch"
                  value={
                    result.best_params
                      .batch_size
                  }
                />

                <SmallStat
                  label="Val Loss"
                  value={result.best_val_loss.toFixed(
                    6
                  )}
                />

                <SmallStat
                  label="Epochs"
                  value={
                    result.epochs_run
                  }
                />
              </div>
            </div>

            {/* SEARCH */}

            <div className="overflow-hidden rounded-[24px] border border-[#E7EAF0]">

              <div className="border-b border-[#E7EAF0] px-5 py-4">
                <p className="font-semibold text-[#344054]">
                  Hyperparameter
                  Search
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">

                  <thead className="bg-[#F8FAFC] text-xs text-[#98A2B3]">
                    <tr>
                      <th className="px-5 py-3">
                        Units
                      </th>
                      <th className="px-5 py-3">
                        Dropout
                      </th>
                      <th className="px-5 py-3">
                        Batch
                      </th>
                      <th className="px-5 py-3">
                        Val Loss
                      </th>
                      <th className="px-5 py-3">
                        Epochs
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.search_results.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={`${item.units}-${item.dropout}-${item.batch_size}`}
                          className="border-t border-[#EEF0F3]"
                        >
                          <td className="px-5 py-3 font-medium text-[#344054]">
                            {
                              item.units
                            }
                          </td>

                          <td className="px-5 py-3 text-[#667085]">
                            {
                              item.dropout
                            }
                          </td>

                          <td className="px-5 py-3 text-[#667085]">
                            {
                              item.batch_size
                            }
                          </td>

                          <td
                            className={`px-5 py-3 font-medium ${
                              index === 0
                                ? "text-[#1557FF]"
                                : "text-[#667085]"
                            }`}
                          >
                            {item.val_loss.toFixed(
                              6
                            )}
                          </td>

                          <td className="px-5 py-3 text-[#667085]">
                            {
                              item.epochs
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-white/60">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}