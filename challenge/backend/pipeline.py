from pathlib import Path
import json

import numpy as np
import pandas as pd

from scipy.stats import spearmanr
from statsmodels.stats.outliers_influence import variance_inflation_factor
from sklearn.preprocessing import MinMaxScaler


# =========================================================
# DATASET LOCATION
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "tourist_arrivals.csv"
)


# =========================================================
# PIPELINE STATE
# =========================================================

class PipelineState:
    def __init__(self):

        # STEP 1
        self.raw_df = None

        # STEP 2
        self.clean_df = None

        # STEP 3
        self.selected_features = None
        self.feature_report = None

        # STEP 4
        self.scaler_X = None
        self.scaler_y = None

        self.X_train_seq = None
        self.y_train_seq = None

        self.X_test_seq = None
        self.y_test_seq = None

        self.train_df = None
        self.test_df = None

        self.prepare_report = None

        # STEP 5
        self.model = None
        self.train_report = None

        # STEP 6
        self.evaluate_report = None

        # FUTURE STEP 7
        self.explain_report = None

        # FUTURE STEP 8
        self.forecast_report = None


state = PipelineState()


# =========================================================
# HELPERS
# =========================================================

def dataframe_to_records(df: pd.DataFrame):
    """
    Convert a DataFrame to JSON-safe records.
    Datetime values become ISO strings.
    """

    return json.loads(
        df.to_json(
            orient="records",
            date_format="iso"
        )
    )


def make_sequences(
    X,
    y,
    lookback
):
    """
    Convert chronological arrays into
    LSTM input windows.

    Example:
    months 1-12 -> target month 13
    months 2-13 -> target month 14
    """

    Xs = []
    ys = []

    for i in range(
        len(X) - lookback
    ):

        Xs.append(
            X[
                i:
                i + lookback
            ]
        )

        ys.append(
            y[
                i + lookback
            ]
        )

    return (
        np.array(Xs),
        np.array(ys)
    )


# =========================================================
# STEP 1 - DATASET
# =========================================================

def load_dataset():

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    # The downloaded CSV contains
    # two rows before the real header.
    df = pd.read_csv(
        DATA_PATH,
        skiprows=2,
        parse_dates=["date"]
    )

    df = (
        df
        .sort_values("date")
        .reset_index(drop=True)
    )

    state.raw_df = df

    expected = pd.date_range(
        df["date"].min(),
        df["date"].max(),
        freq="MS"
    )

    missing_months = (
        expected
        .difference(
            df["date"]
        )
    )

    return {

        "rows":
            int(
                len(df)
            ),

        "columns":
            int(
                len(
                    df.columns
                )
            ),

        "column_names":
            df.columns.tolist(),

        "date_start":
            df[
                "date"
            ]
            .min()
            .date()
            .isoformat(),

        "date_end":
            df[
                "date"
            ]
            .max()
            .date()
            .isoformat(),

        "missing_months": [
            value
            .date()
            .isoformat()

            for value
            in missing_months
        ],

        "preview":
            dataframe_to_records(
                df.head(5)
            )
    }


# =========================================================
# STEP 2 - CLEAN DATA
# =========================================================

def clean_dataset():

    if state.raw_df is None:
        load_dataset()

    df = (
        state.raw_df
        .copy()
    )


    # -----------------------------------------------------
    # REMOVE DUPLICATE MONTHS
    # -----------------------------------------------------

    duplicates_removed = int(
        df
        .duplicated(
            subset="date"
        )
        .sum()
    )

    df = (
        df
        .drop_duplicates(
            subset="date",
            keep="first"
        )
        .reset_index(
            drop=True
        )
    )


    # -----------------------------------------------------
    # MISSING VALUES BEFORE CLEANING
    # -----------------------------------------------------

    missing_before = (
        df
        .isna()
        .sum()
    )

    missing_before = (
        missing_before[
            missing_before > 0
        ]
    )


    missing_rows = (
        df.loc[
            df
            .isna()
            .any(
                axis=1
            )
        ]
        .copy()
    )


    # -----------------------------------------------------
    # FILL MISSING NUMERIC VALUES
    # -----------------------------------------------------

    numeric_columns = (
        df
        .select_dtypes(
            include="number"
        )
        .columns
    )

    # Forward fill only uses
    # previously available observations.
    df[numeric_columns] = (
        df[
            numeric_columns
        ]
        .ffill()
    )


    # -----------------------------------------------------
    # MISSING VALUES AFTER CLEANING
    # -----------------------------------------------------

    missing_after = (
        df
        .isna()
        .sum()
    )

    missing_after = (
        missing_after[
            missing_after > 0
        ]
    )


    # -----------------------------------------------------
    # IQR OUTLIER FLAGGING
    # -----------------------------------------------------

    q1 = (
        df[
            "arrivals"
        ]
        .quantile(
            0.25
        )
    )

    q3 = (
        df[
            "arrivals"
        ]
        .quantile(
            0.75
        )
    )

    iqr = q3 - q1

    lower = (
        q1
        -
        1.5 * iqr
    )

    upper = (
        q3
        +
        1.5 * iqr
    )

    flagged = (
        df[
            (
                df[
                    "arrivals"
                ]
                <
                lower
            )
            |
            (
                df[
                    "arrivals"
                ]
                >
                upper
            )
        ][
            [
                "date",
                "arrivals"
            ]
        ]
        .copy()
    )


    # Save cleaned data
    state.clean_df = df


    return {

        "rows_after_cleaning":
            int(
                len(df)
            ),

        "duplicates_removed":
            duplicates_removed,

        "missing_before": {
            str(key):
                int(value)

            for key, value
            in missing_before.items()
        },

        "missing_after": {
            str(key):
                int(value)

            for key, value
            in missing_after.items()
        },

        "missing_rows":
            dataframe_to_records(
                missing_rows
            ),

        "outlier_count":
            int(
                len(flagged)
            ),

        "flagged_outliers":
            dataframe_to_records(
                flagged
            )
    }


# =========================================================
# STEP 3 - FEATURE SELECTION
# =========================================================

CANDIDATES = [
    "quarter",
    "is_holiday_peak",
    "temp_mean_c",
    "temp_min_c",
    "temp_max_c",
    "rainfall_mm",
    "rainy_days",
    "humidity_pct",
    "typhoon_count",
    "typhoon_max_wind_kt",
    "storm_signal_days",
    "pm25_ugm3",
    "wave_height_m",
]


def run_feature_selection():

    if state.clean_df is None:
        clean_dataset()

    df = (
        state.clean_df
        .copy()
    )

    results = []


    # -----------------------------------------------------
    # SPEARMAN FILTER
    # -----------------------------------------------------

    for col in CANDIDATES:

        rho, p_value = spearmanr(
            df[col],
            df["arrivals"]
        )

        passed = (
            abs(rho) > 0.10
            and
            p_value < 0.05
        )

        results.append({

            "feature":
                col,

            "rho":
                float(rho),

            "p_value":
                float(
                    p_value
                ),

            "passed":
                bool(
                    passed
                )
        })


    kept = [

        item["feature"]

        for item
        in results

        if item[
            "passed"
        ]
    ]


    if not kept:

        raise ValueError(
            "No features passed "
            "the Spearman filter."
        )


    # -----------------------------------------------------
    # ITERATIVE VIF
    # -----------------------------------------------------

    X = (
        df[
            kept
        ]
        .dropna()
        .astype(float)
        .copy()
    )

    vif_log = []


    while (
        X.shape[1] > 1
    ):

        vifs = [

            float(
                variance_inflation_factor(
                    X.values,
                    i
                )
            )

            for i
            in range(
                X.shape[1]
            )
        ]


        max_vif = max(
            vifs
        )


        if max_vif < 5:
            break


        max_index = (
            vifs.index(
                max_vif
            )
        )


        drop_col = (
            X.columns[
                max_index
            ]
        )


        vif_log.append({

            "dropped":
                str(
                    drop_col
                ),

            "vif":
                float(
                    max_vif
                )
        })


        X = (
            X.drop(
                columns=[
                    drop_col
                ]
            )
        )


    selected_features = (
        list(
            X.columns
        )
    )


    # -----------------------------------------------------
    # FINAL VIF
    # -----------------------------------------------------

    final_vif = []


    if X.shape[1] == 1:

        final_vif.append({

            "feature":
                selected_features[
                    0
                ],

            "vif":
                1.0
        })

    else:

        final_values = [

            float(
                variance_inflation_factor(
                    X.values,
                    i
                )
            )

            for i
            in range(
                X.shape[1]
            )
        ]


        for (
            feature,
            vif_value
        ) in zip(
            selected_features,
            final_values
        ):

            final_vif.append({

                "feature":
                    feature,

                "vif":
                    float(
                        vif_value
                    )
            })


    state.selected_features = (
        selected_features
    )


    state.feature_report = {

        "spearman_results":
            results,

        "spearman_kept":
            kept,

        "vif_log":
            vif_log,

        "selected_features":
            selected_features,

        "final_vif":
            final_vif
    }


    return (
        state.feature_report
    )


# =========================================================
# STEP 4 - PREPARE LSTM DATA
# =========================================================

def prepare_sequences(
    train_ratio=0.80,
    lookback=12
):

    if not (
        0.60
        <=
        train_ratio
        <=
        0.95
    ):

        raise ValueError(
            "Train ratio must be "
            "between 0.60 and 0.95."
        )


    if (
        state.selected_features
        is None
    ):

        run_feature_selection()


    df = (
        state.clean_df
        .copy()
    )

    cols = (
        state.selected_features
    )


    # -----------------------------------------------------
    # CHRONOLOGICAL SPLIT
    # -----------------------------------------------------

    split_idx = int(
        len(df)
        *
        train_ratio
    )


    train_df = (
        df.iloc[
            :split_idx
        ]
        .copy()
    )


    test_df = (
        df.iloc[
            split_idx:
        ]
        .copy()
    )


    if (
        len(train_df)
        <=
        lookback
    ):

        raise ValueError(
            "Training set is too small "
            "for the selected lookback."
        )


    if (
        len(test_df)
        <=
        lookback
    ):

        raise ValueError(
            "Test set is too small "
            "for the selected lookback."
        )


    # -----------------------------------------------------
    # FIT SCALERS ON TRAINING DATA ONLY
    # -----------------------------------------------------

    scaler_X = (
        MinMaxScaler()
    )

    scaler_y = (
        MinMaxScaler()
    )


    scaler_X.fit(
        train_df[
            cols
        ]
    )


    scaler_y.fit(
        train_df[
            [
                "arrivals"
            ]
        ]
    )


    # -----------------------------------------------------
    # TRANSFORM TRAIN AND TEST
    # -----------------------------------------------------

    train_X = (
        scaler_X.transform(
            train_df[
                cols
            ]
        )
    )


    test_X = (
        scaler_X.transform(
            test_df[
                cols
            ]
        )
    )


    train_y = (
        scaler_y.transform(
            train_df[
                [
                    "arrivals"
                ]
            ]
        )
    )


    test_y = (
        scaler_y.transform(
            test_df[
                [
                    "arrivals"
                ]
            ]
        )
    )


    # -----------------------------------------------------
    # WINDOW TRAIN AND TEST SEPARATELY
    # -----------------------------------------------------

    (
        X_train_seq,
        y_train_seq
    ) = make_sequences(
        train_X,
        train_y,
        lookback
    )


    (
        X_test_seq,
        y_test_seq
    ) = make_sequences(
        test_X,
        test_y,
        lookback
    )


    # -----------------------------------------------------
    # SAVE STATE
    # -----------------------------------------------------

    state.scaler_X = (
        scaler_X
    )

    state.scaler_y = (
        scaler_y
    )


    state.X_train_seq = (
        X_train_seq
    )

    state.y_train_seq = (
        y_train_seq
    )


    state.X_test_seq = (
        X_test_seq
    )

    state.y_test_seq = (
        y_test_seq
    )


    state.train_df = (
        train_df
    )

    state.test_df = (
        test_df
    )


    # Reset later stages when
    # preparation changes.
    state.model = None
    state.train_report = None

    state.evaluate_report = None
    state.explain_report = None
    state.forecast_report = None


    state.prepare_report = {

        "train_ratio":
            float(
                train_ratio
            ),

        "test_ratio":
            float(
                1
                -
                train_ratio
            ),

        "train_rows":
            int(
                len(
                    train_df
                )
            ),

        "test_rows":
            int(
                len(
                    test_df
                )
            ),

        "train_range": [

            train_df[
                "date"
            ]
            .min()
            .date()
            .isoformat(),

            train_df[
                "date"
            ]
            .max()
            .date()
            .isoformat()
        ],

        "test_range": [

            test_df[
                "date"
            ]
            .min()
            .date()
            .isoformat(),

            test_df[
                "date"
            ]
            .max()
            .date()
            .isoformat()
        ],

        "lookback":
            int(
                lookback
            ),

        "selected_features":
            cols,

        "feature_count":
            int(
                len(cols)
            ),

        "train_windows":
            int(
                len(
                    X_train_seq
                )
            ),

        "test_windows":
            int(
                len(
                    X_test_seq
                )
            ),

        "X_train_shape": [
            int(value)

            for value
            in X_train_seq.shape
        ],

        "X_test_shape": [
            int(value)

            for value
            in X_test_seq.shape
        ]
    }


    return (
        state.prepare_report
    )