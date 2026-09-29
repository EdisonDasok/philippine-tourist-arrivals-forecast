import streamlit as st
import numpy as np
import pandas as pd

st.title("6. Evaluate honestly")

if "model" not in st.session_state:
    st.warning("Run the Train page first.")
    st.stop()


SEASONAL_PERIOD = 12


# --------------------------------------------------
# Evaluation metrics
# --------------------------------------------------

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
        1 - (ss_res / ss_tot)
    )

    return {
        "MAE": mae,
        "RMSE": rmse,
        "MAPE (%)": mape,
        "R²": r2
    }


# --------------------------------------------------
# Run evaluation
# --------------------------------------------------

if st.button("Score on the test set"):

    # ----------------------------------------------
    # LSTM predictions
    # ----------------------------------------------

    pred_scaled = (
        st.session_state.model.predict(
            st.session_state.X_test_seq,
            verbose=0
        )
    )

    pred = (
        st.session_state.scaler_y
        .inverse_transform(pred_scaled)
        .reshape(-1)
    )

    actual = (
        st.session_state.scaler_y
        .inverse_transform(
            st.session_state.y_test_seq
        )
        .reshape(-1)
    )


    # ----------------------------------------------
    # Naive baselines
    # ----------------------------------------------

    lookback = (
        st.session_state.X_test_seq.shape[1]
    )

    n_windows = len(
        st.session_state.X_test_seq
    )

    test_arrivals = (
        st.session_state.test_df[
            "arrivals"
        ]
        .to_numpy()
    )


    if lookback < SEASONAL_PERIOD:

        st.error(
            f"Seasonal naive requires at least "
            f"{SEASONAL_PERIOD} months of lookback."
        )

        st.stop()


    # Previous month
    naive = np.array([
        test_arrivals[
            i + lookback - 1
        ]
        for i in range(n_windows)
    ])


    # Same month from previous year
    seasonal_naive = np.array([
        test_arrivals[
            i + lookback - SEASONAL_PERIOD
        ]
        for i in range(n_windows)
    ])


    # ----------------------------------------------
    # Evaluation table
    # ----------------------------------------------

    results = pd.DataFrame({
        "LSTM": score(
            actual,
            pred
        ),

        "Naive": score(
            actual,
            naive
        ),

        "Seasonal naive": score(
            actual,
            seasonal_naive
        )
    }).T


    # ----------------------------------------------
    # Dates corresponding to predictions
    # ----------------------------------------------

    prediction_dates = (
        st.session_state.test_df[
            "date"
        ]
        .iloc[lookback:]
        .reset_index(drop=True)
    )


    comparison = pd.DataFrame({
        "date": prediction_dates,
        "actual": actual,
        "LSTM": pred,
        "naive": naive,
        "seasonal_naive": seasonal_naive
    })


    # Save for later use
    st.session_state.evaluate_report = results
    st.session_state.prediction_comparison = comparison


# --------------------------------------------------
# DISPLAY RESULTS
# --------------------------------------------------

if "evaluate_report" in st.session_state:

    st.subheader("Model performance")

    display_results = (
        st.session_state.evaluate_report.copy()
    )

    st.dataframe(
        display_results.style.format({
            "MAE": "{:,.2f}",
            "RMSE": "{:,.2f}",
            "MAPE (%)": "{:.2f}",
            "R²": "{:.4f}"
        }),
        use_container_width=True
    )


    st.subheader(
        "Actual vs predicted tourist arrivals"
    )

    comparison = (
        st.session_state.prediction_comparison
    )

    chart_data = (
        comparison[
            [
                "date",
                "actual",
                "LSTM",
                "naive",
                "seasonal_naive"
            ]
        ]
        .set_index("date")
    )

    st.line_chart(chart_data)


    st.subheader(
        "Prediction sample"
    )

    st.dataframe(
        comparison.head(10),
        use_container_width=True
    )


else:

    st.info(
        'Click "Score on the test set" '
        "to evaluate the trained model."
    )