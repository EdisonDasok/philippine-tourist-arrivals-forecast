import streamlit as st
import itertools

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

st.title("5. Train and tune the LSTM")

if "X_train_seq" not in st.session_state:
    st.warning("Run the Prepare page first.")
    st.stop()


# --------------------------------------------------
# Hyperparameter combinations to test
# --------------------------------------------------

PARAM_GRID = {
    "units": [32, 64],
    "dropout": [0.1, 0.3],
    "batch_size": [16, 32]
}


if st.button("Train & tune"):

    with st.spinner(
        "Training and testing parameter combinations..."
    ):

        X_train = st.session_state.X_train_seq
        y_train = st.session_state.y_train_seq

        lookback = X_train.shape[1]
        n_features = X_train.shape[2]

        best_val_loss = float("inf")
        best_params = None
        best_model = None
        best_history = None

        # ------------------------------------------
        # Try every hyperparameter combination
        # ------------------------------------------

        combinations = list(
            itertools.product(
                PARAM_GRID["units"],
                PARAM_GRID["dropout"],
                PARAM_GRID["batch_size"]
            )
        )

        progress = st.progress(0)

        for index, (
            units,
            dropout,
            batch_size
        ) in enumerate(combinations):

            candidate = Sequential([
                LSTM(
                    units,
                    input_shape=(
                        lookback,
                        n_features
                    )
                ),

                Dropout(dropout),

                Dense(1)
            ])

            candidate.compile(
                optimizer="adam",
                loss="mse"
            )

            history = candidate.fit(
                X_train,
                y_train,
                validation_split=0.15,
                epochs=100,
                batch_size=batch_size,
                callbacks=[
                    EarlyStopping(
                        patience=8,
                        restore_best_weights=True
                    )
                ],
                shuffle=False,
                verbose=0
            )

            val_loss = min(
                history.history["val_loss"]
            )

            if val_loss < best_val_loss:

                best_val_loss = val_loss

                best_params = {
                    "units": units,
                    "dropout": dropout,
                    "batch_size": batch_size
                }

                best_model = candidate

                best_history = history.history

            progress.progress(
                (index + 1) /
                len(combinations)
            )


        # ------------------------------------------
        # Save best model
        # ------------------------------------------

        st.session_state.model = best_model

        st.session_state.train_report = {
            "best_params": best_params,
            "val_loss": best_val_loss,
            "loss_history": best_history["loss"],
            "val_loss_history":
                best_history["val_loss"]
        }


# --------------------------------------------------
# DISPLAY RESULTS
# --------------------------------------------------

if "train_report" in st.session_state:

    r = st.session_state.train_report

    st.success(
        f"Best hyperparameters: "
        f"{r['best_params']}"
    )

    st.write(
        f"Best validation loss: "
        f"{r['val_loss']:.6f}"
    )

    st.subheader(
        "Training vs validation loss"
    )

    st.line_chart({
        "Training loss":
            r["loss_history"],

        "Validation loss":
            r["val_loss_history"]
    })

else:

    st.info(
        'Click "Train & tune" to train '
        "the LSTM."
    )