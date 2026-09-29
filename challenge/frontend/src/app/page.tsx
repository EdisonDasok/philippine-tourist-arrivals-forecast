"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Database,
  Eraser,
  RefreshCcw,
} from "lucide-react";

import Sidebar, {
  type Section,
} from "@/components/Sidebar";

import Topbar from "@/components/Topbar";
import Overview from "@/components/Overview";
import FeaturePrepare from "@/components/FeaturePrepare";
import TrainModel from "@/components/TrainModel";
import EvaluateModel from "@/components/EvaluateModel";
import ExplainModel from "@/components/ExplainModel";
import ForecastModel from "@/components/ForecastModel";


const API =
  process.env
    .NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";


// ========================================================
// TYPES
// ========================================================

type DatasetResult = {
  rows: number;
  columns: number;

  column_names: string[];

  date_start: string;
  date_end: string;

  missing_months: string[];

  preview: Record<
    string,
    unknown
  >[];
};


type CleanResult = {
  rows_after_cleaning: number;

  duplicates_removed: number;

  missing_before: Record<
    string,
    number
  >;

  missing_after: Record<
    string,
    number
  >;

  missing_rows: Record<
    string,
    unknown
  >[];

  outlier_count: number;

  flagged_outliers: Record<
    string,
    unknown
  >[];
};


// ========================================================
// PAGE
// ========================================================

export default function Home() {

  const [
    active,
    setActive,
  ] =
    useState<Section>(
      "overview"
    );


  const [
    apiConnected,
    setApiConnected,
  ] =
    useState(false);


  const [
    dataset,
    setDataset,
  ] =
    useState<
      DatasetResult | null
    >(null);


  const [
    cleanResult,
    setCleanResult,
  ] =
    useState<
      CleanResult | null
    >(null);


  const [
    datasetLoading,
    setDatasetLoading,
  ] =
    useState(false);


  const [
    cleanLoading,
    setCleanLoading,
  ] =
    useState(false);


  // ======================================================
  // RESTORE LAST OPEN PAGE
  // ======================================================

  useEffect(() => {

    const saved =
      sessionStorage.getItem(
        "touristflow-active-page"
      );


    if (saved) {

      setActive(
        saved as Section
      );

    }

  }, []);


  // ======================================================
  // SAVE OPEN PAGE
  // ======================================================

  useEffect(() => {

    sessionStorage.setItem(
      "touristflow-active-page",
      active
    );

  }, [active]);


  // ======================================================
  // HEALTH CHECK
  // ======================================================

  useEffect(() => {

    async function checkAPI() {

      try {

        const response =
          await fetch(
            `${API}/health`
          );


        if (!response.ok) {

          throw new Error();

        }


        const data =
          await response.json();


        setApiConnected(
          data.status === "ok"
        );

      } catch {

        setApiConnected(false);

      }

    }


    checkAPI();

  }, []);


  // ======================================================
  // STEP 1 - DATASET
  // ======================================================

  async function loadDataset() {

    try {

      setDatasetLoading(
        true
      );


      const response =
        await fetch(
          `${API}/dataset`
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Could not load dataset"
        );

      }


      setDataset(
        data
      );

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : "Could not load dataset."
      );

    } finally {

      setDatasetLoading(
        false
      );

    }

  }


  // ======================================================
  // STEP 2 - CLEANING
  // ======================================================

  async function runCleaning() {

    try {

      setCleanLoading(
        true
      );


      const response =
        await fetch(
          `${API}/clean`,
          {
            method:
              "POST",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Cleaning failed"
        );

      }


      setCleanResult(
        data
      );

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : "Cleaning failed."
      );

    } finally {

      setCleanLoading(
        false
      );

    }

  }


  // ======================================================
  // UI
  // ======================================================

  return (

    <div className="min-h-screen bg-[#F4F7FB]">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        active={active}
        onChange={
          setActive
        }
      />


      {/* =================================================
          TOP BAR
      ================================================= */}

      <Topbar
        active={active}
        apiConnected={
          apiConnected
        }
        onChange={
          setActive
        }
      />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="min-h-screen pt-[72px] md:pl-[88px]">

        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">


          {/* ===============================================
              PAGE HEADER
          =============================================== */}

          {
            active !==
              "overview" && (

              <div className="mb-6">

                <p className="text-sm text-[#98A2B3]">
                  TouristFlow AI /
                  Pipeline
                </p>


                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#101828] sm:text-3xl">

                  {
                    pageTitles[
                      active
                    ]
                  }

                </h1>

              </div>

            )
          }


          {/* ===============================================
              IMPORTANT:
              ALL COMPONENTS STAY MOUNTED.

              We only hide inactive views.
          =============================================== */}


          {/* OVERVIEW */}

          <div
            className={
              active ===
              "overview"
                ? "block"
                : "hidden"
            }
          >

            <Overview
              apiConnected={
                apiConnected
              }
              dataset={
                dataset
              }
              cleanResult={
                cleanResult
              }
              onNavigate={
                setActive
              }
            />

          </div>


          {/* STEP 1 - DATASET */}

          <div
            className={
              active ===
              "dataset"
                ? "block"
                : "hidden"
            }
          >

            <DatasetPanel
              data={
                dataset
              }
              loading={
                datasetLoading
              }
              onLoad={
                loadDataset
              }
            />

          </div>


          {/* STEP 2 - CLEANING */}

          <div
            className={
              active ===
              "cleaning"
                ? "block"
                : "hidden"
            }
          >

            <CleaningPanel
              data={
                cleanResult
              }
              loading={
                cleanLoading
              }
              onRun={
                runCleaning
              }
            />

          </div>


          {/* STEP 3 + STEP 4 */}

          <div
            className={
              active ===
              "features"
                ? "block"
                : "hidden"
            }
          >

            <FeaturePrepare />

          </div>


          {/* STEP 5 - TRAIN */}

          <div
            className={
              active ===
              "training"
                ? "block"
                : "hidden"
            }
          >

            <TrainModel />

          </div>


          {/* STEP 6 - EVALUATION */}

          <div
            className={
              active ===
              "evaluation"
                ? "block"
                : "hidden"
            }
          >

            <EvaluateModel />

          </div>


          {/* STEP 7 - SHAP */}

          <div
            className={
              active ===
              "explain"
                ? "block"
                : "hidden"
            }
          >

            <ExplainModel />

          </div>


          {/* STEP 8 - FORECAST */}

          <div
            className={
              active ===
              "forecast"
                ? "block"
                : "hidden"
            }
          >

            <ForecastModel />

          </div>

        </div>

      </main>


      {/* =================================================
          MOBILE BOTTOM NAVIGATION
      ================================================= */}

      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-2xl border border-[#E7EAF0] bg-white p-2 shadow-xl md:hidden">

        {
          (
            [
              "overview",
              "dataset",
              "features",
              "evaluation",
              "forecast",
            ] as Section[]
          )
          .map(
            item => (

              <button
                key={
                  item
                }
                onClick={() =>
                  setActive(
                    item
                  )
                }
                className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${
                  active ===
                  item

                    ? "bg-[#1557FF] text-white"

                    : "text-[#667085]"
                }`}
              >

                {
                  mobileNames[
                    item
                  ]
                }

              </button>

            )
          )
        }

      </div>

    </div>

  );

}


// ========================================================
// DATASET PANEL
// ========================================================

function DatasetPanel({
  data,
  loading,
  onLoad,
}: {
  data:
    DatasetResult |
    null;

  loading:
    boolean;

  onLoad:
    () => void;
}) {

  return (

    <section className="rounded-[26px] border border-[#E7EAF0] bg-white p-6 md:p-7">


      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1557FF]">

            <Database
              size={21}
            />

          </div>


          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1557FF]">
              Step 1
            </p>


            <h2 className="mt-1 text-2xl font-semibold text-[#101828]">
              Dataset Overview
            </h2>


            <p className="mt-1 text-sm text-[#667085]">
              Inspect the raw monthly
              Philippine tourist arrival
              dataset.
            </p>

          </div>

        </div>


        <button
          onClick={
            onLoad
          }
          disabled={
            loading
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-[#1557FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0D49E8] disabled:opacity-50"
        >

          <RefreshCcw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />


          {
            loading
              ? "Loading..."
              : data
              ? "Reload Dataset"
              : "Load Dataset"
          }

        </button>

      </div>


      {/* DATA */}

      {
        data && (

          <div className="mt-7">


            {/* METRICS */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <Metric
                label="Rows"
                value={
                  data.rows
                    .toLocaleString()
                }
              />


              <Metric
                label="Columns"
                value={
                  data.columns
                    .toString()
                }
              />


              <Metric
                label="Start"
                value={
                  data.date_start
                }
              />


              <Metric
                label="End"
                value={
                  data.date_end
                }
              />

            </div>


            {/* MONTHLY SEQUENCE */}

            <div className="mt-5 rounded-2xl bg-[#F8FAFC] p-5">

              <div className="flex items-center justify-between">

                <p className="font-semibold text-[#344054]">
                  Monthly sequence
                </p>


                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    data
                      .missing_months
                      .length === 0

                      ? "bg-green-50 text-green-600"

                      : "bg-amber-50 text-amber-600"
                  }`}
                >

                  {
                    data
                      .missing_months
                      .length === 0

                      ? "No gaps"

                      : `${
                          data
                            .missing_months
                            .length
                        } gaps`
                  }

                </span>

              </div>

            </div>


            {/* COLUMN LIST */}

            <div className="mt-5">

              <p className="text-sm font-semibold text-[#344054]">
                Dataset columns
              </p>


              <div className="mt-3 flex flex-wrap gap-2">

                {
                  data
                    .column_names
                    .map(
                      column => (

                        <span
                          key={
                            column
                          }
                          className="rounded-xl border border-[#E7EAF0] bg-white px-3 py-2 text-xs font-medium text-[#667085]"
                        >
                          {
                            column
                          }
                        </span>

                      )
                    )
                }

              </div>

            </div>


            {/* TABLE */}

            {
              data.preview.length >
                0 && (

                <div className="mt-6 overflow-x-auto rounded-[20px] border border-[#E7EAF0]">

                  <table className="w-full min-w-[1000px] text-left text-xs">

                    <thead className="bg-[#F8FAFC]">

                      <tr>

                        {
                          Object.keys(
                            data.preview[
                              0
                            ]
                          )
                          .map(
                            column => (

                              <th
                                key={
                                  column
                                }
                                className="whitespace-nowrap px-4 py-3 font-semibold text-[#98A2B3]"
                              >
                                {
                                  column
                                }
                              </th>

                            )
                          )
                        }

                      </tr>

                    </thead>


                    <tbody>

                      {
                        data.preview.map(
                          (
                            row,
                            rowIndex
                          ) => (

                            <tr
                              key={
                                rowIndex
                              }
                              className="border-t border-[#EEF0F3]"
                            >

                              {
                                Object.values(
                                  row
                                )
                                .map(
                                  (
                                    value,
                                    index
                                  ) => (

                                    <td
                                      key={
                                        index
                                      }
                                      className="whitespace-nowrap px-4 py-3 text-[#667085]"
                                    >
                                      {
                                        formatCell(
                                          value
                                        )
                                      }
                                    </td>

                                  )
                                )
                              }

                            </tr>

                          )
                        )
                      }

                    </tbody>

                  </table>

                </div>

              )
            }

          </div>

        )
      }

    </section>

  );

}


// ========================================================
// CLEANING PANEL
// ========================================================

function CleaningPanel({
  data,
  loading,
  onRun,
}: {
  data:
    CleanResult |
    null;

  loading:
    boolean;

  onRun:
    () => void;
}) {

  return (

    <section className="rounded-[26px] border border-[#E7EAF0] bg-white p-6 md:p-7">


      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#1557FF]">

            <Eraser
              size={21}
            />

          </div>


          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1557FF]">
              Step 2
            </p>


            <h2 className="mt-1 text-2xl font-semibold text-[#101828]">
              Data Cleaning
            </h2>


            <p className="mt-1 text-sm text-[#667085]">
              Remove duplicates, fill
              numeric gaps and flag
              unusual arrival values.
            </p>

          </div>

        </div>


        <button
          onClick={
            onRun
          }
          disabled={
            loading
          }
          className="rounded-xl bg-[#1557FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0D49E8] disabled:opacity-50"
        >

          {
            loading
              ? "Cleaning..."
              : data
              ? "Run Again"
              : "Run Cleaning"
          }

        </button>

      </div>


      {/* RESULTS */}

      {
        data && (

          <div className="mt-7">


            {/* METRICS */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <Metric
                label="Clean Rows"
                value={
                  data
                    .rows_after_cleaning
                    .toString()
                }
              />


              <Metric
                label="Duplicates Removed"
                value={
                  data
                    .duplicates_removed
                    .toString()
                }
              />


              <Metric
                label="Missing Found"
                value={
                  Object.values(
                    data
                      .missing_before
                  )
                  .reduce(
                    (
                      total,
                      value
                    ) =>
                      total +
                      value,
                    0
                  )
                  .toString()
                }
              />


              <Metric
                label="Outliers Flagged"
                value={
                  data
                    .outlier_count
                    .toString()
                }
              />

            </div>


            {/* MISSING VALUES */}

            <div className="mt-5 grid gap-4 lg:grid-cols-2">

              <InfoBox
                title="Missing Before"
                value={
                  formatMissing(
                    data
                      .missing_before
                  )
                }
              />


              <InfoBox
                title="Missing After"
                value={
                  formatMissing(
                    data
                      .missing_after
                  )
                }
              />

            </div>


            {/* OUTLIERS */}

            {
              data
                .flagged_outliers
                .length > 0 && (

                <div className="mt-6 rounded-[22px] border border-[#E7EAF0] p-5">

                  <p className="font-semibold text-[#344054]">
                    Flagged Arrival
                    Outliers
                  </p>


                  <p className="mt-1 text-xs text-[#98A2B3]">
                    These are only
                    flagged for review.
                    The values are not
                    automatically deleted.
                  </p>


                  <div className="mt-4 grid gap-3 md:grid-cols-3">

                    {
                      data
                        .flagged_outliers
                        .map(
                          (
                            item,
                            index
                          ) => (

                            <div
                              key={
                                index
                              }
                              className="rounded-2xl bg-[#F8FAFC] p-4"
                            >

                              <p className="text-xs text-[#98A2B3]">

                                {
                                  String(
                                    item.date
                                  )
                                  .slice(
                                    0,
                                    10
                                  )
                                }

                              </p>


                              <p className="mt-1 text-xl font-semibold text-[#344054]">

                                {
                                  Number(
                                    item.arrivals
                                  )
                                  .toLocaleString()
                                }

                              </p>

                            </div>

                          )
                        )
                    }

                  </div>

                </div>

              )
            }

          </div>

        )
      }

    </section>

  );

}


// ========================================================
// SHARED UI
// ========================================================

function Metric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {

  return (

    <div className="rounded-[20px] border border-[#E7EAF0] bg-white p-5">

      <p className="text-xs text-[#98A2B3]">
        {
          label
        }
      </p>


      <p className="mt-2 text-2xl font-semibold text-[#101828]">
        {
          value
        }
      </p>

    </div>

  );

}


function InfoBox({
  title,
  value,
}: {
  title:
    string;

  value:
    string;
}) {

  return (

    <div className="rounded-[20px] bg-[#F8FAFC] p-5">

      <p className="text-xs font-medium text-[#98A2B3]">
        {
          title
        }
      </p>


      <p className="mt-2 text-sm font-semibold leading-6 text-[#344054]">
        {
          value
        }
      </p>

    </div>

  );

}


// ========================================================
// FORMAT HELPERS
// ========================================================

function formatMissing(
  values: Record<
    string,
    number
  >
) {

  const entries =
    Object.entries(
      values
    );


  if (
    entries.length ===
    0
  ) {

    return "None";

  }


  return entries
    .map(
      ([
        key,
        value,
      ]) =>
        `${key}: ${value}`
    )
    .join(" • ");

}


function formatCell(
  value:
    unknown
) {

  if (
    value ===
      null ||
    value ===
      undefined
  ) {

    return "—";

  }


  if (
    typeof value ===
    "number"
  ) {

    return value
      .toLocaleString();

  }


  if (
    typeof value ===
    "string"
  ) {

    if (
      value.includes(
        "T00:00:00"
      )
    ) {

      return value.slice(
        0,
        10
      );

    }


    return value;

  }


  return String(
    value
  );

}


// ========================================================
// PAGE TITLES
// ========================================================

const pageTitles: Record<
  Section,
  string
> = {

  overview:
    "Overview",

  dataset:
    "Dataset",

  cleaning:
    "Data Cleaning",

  features:
    "Feature Selection & Preparation",

  training:
    "LSTM Training",

  evaluation:
    "Model Evaluation",

  explain:
    "SHAP Explainability",

  forecast:
    "Tourist Arrival Forecast",

};


// ========================================================
// MOBILE NAV LABELS
// ========================================================

const mobileNames: Record<
  Section,
  string
> = {

  overview:
    "Home",

  dataset:
    "Data",

  cleaning:
    "Clean",

  features:
    "Pipeline",

  training:
    "Train",

  evaluation:
    "Results",

  explain:
    "SHAP",

  forecast:
    "Forecast",

};