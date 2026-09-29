import streamlit as st
import numpy as np
from sklearn.preprocessing import MinMaxScaler

st.title("4. Prevent leakage and prepare sequences")

if "selected_features" not in st.session_state:
    st.warning("Run the Features page first.")
    st.stop()


# One year of previous months will be used
# to predict the next month
LOOKBACK = 12


train_ratio = st.slider(
    "Train split ratio",
    min_value=0.60,
    max_value=0.95,
    value=0.80,
    step=0.05
)

st.caption(
    f"{train_ratio:.0%} train / "
    f"{1 - train_ratio:.0%} test, "
    "split chronologically. No shuffling. "
    "The earliest rows train the model and "
    "the most recent rows test it."
)


def make_sequences(X, y, lookback):
    Xs = []
    ys = []

    for i in range(len(X) - lookback):

        Xs.append(
            X[i:i + lookback]
        )

        ys.append(
            y[i + lookback]
        )

    return np.array(Xs), np.array(ys)


if st.button("Run"):

    df = st.session_state.clean_df.copy()

    # ---------------------------------------------
    # 1. Chronological train/test split
    # ---------------------------------------------

    split_idx = int(
        len(df) * train_ratio
    )

    train_df = df.iloc[
        :split_idx
    ].copy()

    test_df = df.iloc[
        split_idx:
    ].copy()


    # ---------------------------------------------
    # 2. Selected predictor columns
    # ---------------------------------------------

    cols = st.session_state.selected_features


    # ---------------------------------------------
    # 3. Fit scalers on TRAINING DATA ONLY
    # ---------------------------------------------

    st.session_state.scaler_X = (
        MinMaxScaler()
        .fit(train_df[cols])
    )

    st.session_state.scaler_y = (
        MinMaxScaler()
        .fit(train_df[["arrivals"]])
    )


    # ---------------------------------------------
    # 4. Transform train and test data
    # ---------------------------------------------

    train_X = (
        st.session_state.scaler_X
        .transform(train_df[cols])
    )

    test_X = (
        st.session_state.scaler_X
        .transform(test_df[cols])
    )

    train_y = (
        st.session_state.scaler_y
        .transform(train_df[["arrivals"]])
    )

    test_y = (
        st.session_state.scaler_y
        .transform(test_df[["arrivals"]])
    )


    # ---------------------------------------------
    # 5. Convert into LSTM sequences
    # ---------------------------------------------

    (
        st.session_state.X_train_seq,
        st.session_state.y_train_seq
    ) = make_sequences(
        train_X,
        train_y,
        LOOKBACK
    )

    (
        st.session_state.X_test_seq,
        st.session_state.y_test_seq
    ) = make_sequences(
        test_X,
        test_y,
        LOOKBACK
    )


    # Save test dataframe for evaluation later
    st.session_state.test_df = test_df


    # ---------------------------------------------
    # 6. Save preparation report
    # ---------------------------------------------

    st.session_state.prepare_report = {

        "train_ratio": train_ratio,

        "train_rows": len(train_df),

        "test_rows": len(test_df),

        "train_range": (
            train_df["date"].min().date(),
            train_df["date"].max().date()
        ),

        "test_range": (
            test_df["date"].min().date(),
            test_df["date"].max().date()
        ),

        "train_windows": len(
            st.session_state.X_train_seq
        ),

        "test_windows": len(
            st.session_state.X_test_seq
        ),

        "lookback": LOOKBACK,

        "features": cols
    }


# ---------------------------------------------
# DISPLAY RESULTS
# ---------------------------------------------

if "prepare_report" in st.session_state:

    r = st.session_state.prepare_report

    st.subheader("Preparation results")

    st.write(
        f"Split used: "
        f"{r['train_ratio']:.0%} train / "
        f"{1 - r['train_ratio']:.0%} test"
    )

    st.write(
        f"Train: {r['train_rows']} rows "
        f"({r['train_range'][0]} to "
        f"{r['train_range'][1]})"
    )

    st.write(
        f"Test: {r['test_rows']} rows "
        f"({r['test_range'][0]} to "
        f"{r['test_range'][1]})"
    )

    st.write(
        f"Selected features: "
        f"{len(r['features'])}"
    )

    st.write(
        r["features"]
    )

    st.success(
        f"{r['train_windows']} training windows, "
        f"{r['test_windows']} test windows, "
        f"lookback = {r['lookback']} months"
    )

else:

    st.info(
        'Choose a split ratio and click "Run".'
    )