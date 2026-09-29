import itertools
import numpy as np
import tensorflow as tf

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

from pipeline import state, prepare_sequences


PARAM_GRID = {
    "units": [32, 64],
    "dropout": [0.1, 0.3],
    "batch_size": [16, 32]
}


def build_model(
    units,
    dropout,
    lookback,
    n_features
):
    model = Sequential([
        Input(
            shape=(
                lookback,
                n_features
            )
        ),

        LSTM(units),

        Dropout(dropout),

        Dense(1)
    ])

    model.compile(
        optimizer="adam",
        loss="mse"
    )

    return model


def train_and_tune():

    # Make sure prepared data exists
    if state.X_train_seq is None:
        prepare_sequences(
            train_ratio=0.80,
            lookback=12
        )

    X_train = state.X_train_seq
    y_train = state.y_train_seq

    lookback = X_train.shape[1]
    n_features = X_train.shape[2]

    # Reproducible training
    np.random.seed(42)
    tf.keras.utils.set_random_seed(42)

    best_val_loss = float("inf")
    best_params = None

    search_results = []

    combinations = list(
        itertools.product(
            PARAM_GRID["units"],
            PARAM_GRID["dropout"],
            PARAM_GRID["batch_size"]
        )
    )

    # --------------------------------------------------
    # HYPERPARAMETER SEARCH
    # --------------------------------------------------

    for (
        units,
        dropout,
        batch_size
    ) in combinations:

        tf.keras.backend.clear_session()
        tf.keras.utils.set_random_seed(42)

        model = build_model(
            units=units,
            dropout=dropout,
            lookback=lookback,
            n_features=n_features
        )

        history = model.fit(
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

        val_loss = float(
            min(
                history.history[
                    "val_loss"
                ]
            )
        )

        epochs_run = int(
            len(
                history.history[
                    "loss"
                ]
            )
        )

        search_results.append({
            "units":
                int(units),

            "dropout":
                float(dropout),

            "batch_size":
                int(batch_size),

            "val_loss":
                val_loss,

            "epochs":
                epochs_run
        })

        if val_loss < best_val_loss:

            best_val_loss = (
                val_loss
            )

            best_params = {
                "units":
                    int(units),

                "dropout":
                    float(dropout),

                "batch_size":
                    int(batch_size)
            }


    # --------------------------------------------------
    # TRAIN FINAL MODEL USING BEST PARAMETERS
    # --------------------------------------------------

    tf.keras.backend.clear_session()
    tf.keras.utils.set_random_seed(42)

    final_model = build_model(
        units=
            best_params["units"],

        dropout=
            best_params["dropout"],

        lookback=
            lookback,

        n_features=
            n_features
    )

    final_history = (
        final_model.fit(
            X_train,
            y_train,

            validation_split=0.15,

            epochs=100,

            batch_size=
                best_params[
                    "batch_size"
                ],

            callbacks=[
                EarlyStopping(
                    patience=8,
                    restore_best_weights=True
                )
            ],

            shuffle=False,
            verbose=0
        )
    )


    # --------------------------------------------------
    # SAVE MODEL TO PIPELINE STATE
    # --------------------------------------------------

    state.model = final_model

    state.train_report = {

        "best_params":
            best_params,

        "best_val_loss":
            float(
                min(
                    final_history
                    .history[
                        "val_loss"
                    ]
                )
            ),

        "epochs_run":
            int(
                len(
                    final_history
                    .history[
                        "loss"
                    ]
                )
            ),

        "loss_history": [
            float(value)
            for value
            in final_history
            .history["loss"]
        ],

        "val_loss_history": [
            float(value)
            for value
            in final_history
            .history["val_loss"]
        ],

        "search_results":
            sorted(
                search_results,
                key=lambda item:
                    item[
                        "val_loss"
                    ]
            )
    }

    return state.train_report