import numpy as np

from pipeline import state
from training import train_and_tune


def get_forecast_template():

    if state.model is None:
        train_and_tune()

    cols = (
        state.selected_features
    )

    last_window_scaled = (
        state.X_train_seq[-1]
    )

    last_window = (
        state.scaler_X
        .inverse_transform(
            last_window_scaled
        )
    )

    rows = []

    for row in last_window:

        rows.append({
            feature:
                float(value)

            for feature, value
            in zip(
                cols,
                row
            )
        })

    return {

        "lookback":
            int(
                last_window.shape[0]
            ),

        "features":
            cols,

        "rows":
            rows
    }


def forecast_next_month(
    rows
):

    if state.model is None:
        train_and_tune()

    cols = (
        state.selected_features
    )

    lookback = (
        state.X_train_seq
        .shape[1]
    )

    if len(rows) != lookback:

        raise ValueError(
            f"Expected {lookback} rows, "
            f"received {len(rows)}."
        )

    values = []

    for row in rows:

        missing = [
            col
            for col in cols
            if col not in row
        ]

        if missing:

            raise ValueError(
                "Missing feature(s): "
                +
                ", ".join(
                    missing
                )
            )

        values.append([
            float(
                row[col]
            )
            for col in cols
        ])

    input_array = (
        np.array(
            values,
            dtype=float
        )
    )

    scaled = (
        state.scaler_X
        .transform(
            input_array
        )
    )

    X = scaled.reshape(
        1,
        lookback,
        len(cols)
    )

    pred_scaled = (
        state.model.predict(
            X,
            verbose=0
        )
    )

    prediction = (
        state.scaler_y
        .inverse_transform(
            pred_scaled
        )[0][0]
    )

    state.forecast_report = {
        "predicted_arrivals":
            float(
                prediction
            )
    }

    return (
        state.forecast_report
    )