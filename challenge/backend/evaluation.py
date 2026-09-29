import numpy as np
import pandas as pd

from pipeline import state
from training import train_and_tune


SEASONAL_PERIOD = 12


def score(actual, pred):

    actual = np.asarray(actual).reshape(-1)
    pred = np.asarray(pred).reshape(-1)

    mae = float(
        np.mean(
            np.abs(actual - pred)
        )
    )

    rmse = float(
        np.sqrt(
            np.mean(
                (actual - pred) ** 2
            )
        )
    )

    mape = float(
        np.mean(
            np.abs(
                (actual - pred) / actual
            )
        ) * 100
    )

    ss_res = np.sum(
        (actual - pred) ** 2
    )

    ss_tot = np.sum(
        (actual - actual.mean()) ** 2
    )

    r2 = float(
        1 - ss_res / ss_tot
    )

    return {
        "mae": mae,
        "rmse": rmse,
        "mape": mape,
        "r2": r2
    }


def evaluate_model():

    # Make sure a model exists
    if state.model is None:
        train_and_tune()

    X_test = state.X_test_seq
    y_test = state.y_test_seq

    # --------------------------------------------------
    # LSTM PREDICTIONS
    # --------------------------------------------------

    pred_scaled = state.model.predict(
        X_test,
        verbose=0
    )

    pred = (
        state.scaler_y
        .inverse_transform(
            pred_scaled
        )
        .reshape(-1)
    )

    actual = (
        state.scaler_y
        .inverse_transform(
            y_test
        )
        .reshape(-1)
    )

    # --------------------------------------------------
    # BASELINES
    # --------------------------------------------------

    lookback = X_test.shape[1]

    test_arrivals = (
        state.test_df[
            "arrivals"
        ]
        .to_numpy()
    )

    n_windows = len(X_test)

    naive = np.array([
        test_arrivals[
            i + lookback - 1
        ]
        for i in range(
            n_windows
        )
    ])

    seasonal_naive = np.array([
        test_arrivals[
            i
            + lookback
            - SEASONAL_PERIOD
        ]
        for i in range(
            n_windows
        )
    ])

    # --------------------------------------------------
    # METRICS
    # --------------------------------------------------

    metrics = {
        "lstm": score(
            actual,
            pred
        ),

        "naive": score(
            actual,
            naive
        ),

        "seasonal_naive": score(
            actual,
            seasonal_naive
        )
    }

    # --------------------------------------------------
    # DATES
    # --------------------------------------------------

    prediction_dates = (
        state.test_df[
            "date"
        ]
        .iloc[
            lookback:
        ]
        .reset_index(
            drop=True
        )
    )

    comparison = []

    for i in range(
        len(actual)
    ):

        comparison.append({
            "date":
                prediction_dates[
                    i
                ]
                .date()
                .isoformat(),

            "actual":
                float(
                    actual[i]
                ),

            "lstm":
                float(
                    pred[i]
                ),

            "naive":
                float(
                    naive[i]
                ),

            "seasonal_naive":
                float(
                    seasonal_naive[i]
                )
        })

    # --------------------------------------------------
    # SAVE
    # --------------------------------------------------

    state.evaluate_report = {
        "metrics":
            metrics,

        "comparison":
            comparison
    }

    return (
        state.evaluate_report
    )