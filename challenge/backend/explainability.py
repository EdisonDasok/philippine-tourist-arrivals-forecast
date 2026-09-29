import numpy as np
import shap

from pipeline import state
from training import train_and_tune


def explain_model():

    # Make sure model exists
    if state.model is None:
        train_and_tune()

    X_train_seq = state.X_train_seq
    X_test_seq = state.X_test_seq

    features = state.selected_features
    model = state.model

    lookback = X_train_seq.shape[1]
    n_features = X_train_seq.shape[2]

    # --------------------------------------------------
    # KernelExplainer needs flat 2D data.
    # Reshape back to LSTM format inside predict().
    # --------------------------------------------------

    def predict_flat(flat_x):

        seq = flat_x.reshape(
            -1,
            lookback,
            n_features
        )

        predictions = model.predict(
            seq,
            verbose=0
        )

        return predictions.reshape(-1)

    # --------------------------------------------------
    # BACKGROUND SAMPLE
    # --------------------------------------------------

    rng = np.random.default_rng(42)

    background_size = min(
        50,
        len(X_train_seq)
    )

    indices = rng.choice(
        len(X_train_seq),
        background_size,
        replace=False
    )

    background = X_train_seq[
        indices
    ]

    background_flat = (
        background.reshape(
            len(background),
            -1
        )
    )

    background_summary = (
        shap.kmeans(
            background_flat,
            10
        )
    )

    # --------------------------------------------------
    # TEST SAMPLE
    # --------------------------------------------------

    sample_size = min(
        20,
        len(X_test_seq)
    )

    test_sample = X_test_seq[
        :sample_size
    ]

    test_flat = (
        test_sample.reshape(
            sample_size,
            -1
        )
    )

    # --------------------------------------------------
    # SHAP
    # --------------------------------------------------

    explainer = shap.KernelExplainer(
        predict_flat,
        background_summary
    )

    shap_values = explainer.shap_values(
        test_flat,
        nsamples=100
    )

    # SHAP version compatibility
    if isinstance(
        shap_values,
        list
    ):
        shap_values = (
            shap_values[0]
        )

    shap_values = np.asarray(
        shap_values
    )

    if shap_values.ndim == 3:
        shap_values = (
            shap_values[..., 0]
        )

    shap_values = (
        shap_values.reshape(
            sample_size,
            lookback,
            n_features
        )
    )

    # --------------------------------------------------
    # GLOBAL IMPORTANCE
    # --------------------------------------------------

    mean_abs = (
        np.abs(
            shap_values
        )
        .mean(
            axis=(0, 1)
        )
    )

    top_idx = int(
        np.argmax(
            mean_abs
        )
    )

    global_importance = [
        {
            "feature": feature,
            "importance": float(
                importance
            )
        }
        for feature, importance
        in zip(
            features,
            mean_abs
        )
    ]

    global_importance.sort(
        key=lambda item:
            item["importance"],
        reverse=True
    )

    # --------------------------------------------------
    # ONE FORECAST
    # --------------------------------------------------

    one_values = (
        shap_values[0]
        .sum(
            axis=0
        )
    )

    one_forecast = [
        {
            "feature": feature,
            "contribution": float(
                value
            )
        }
        for feature, value
        in zip(
            features,
            one_values
        )
    ]

    one_forecast.sort(
        key=lambda item:
            abs(
                item[
                    "contribution"
                ]
            ),
        reverse=True
    )

    # --------------------------------------------------
    # DEPENDENCE
    # --------------------------------------------------

    dependence = []

    for i in range(
        sample_size
    ):

        dependence.append({
            "value": float(
                X_test_seq[
                    i,
                    -1,
                    top_idx
                ]
            ),

            "shap": float(
                shap_values[
                    i,
                    -1,
                    top_idx
                ]
            )
        })

    state.explain_report = {

        "top_feature":
            features[top_idx],

        "global_importance":
            global_importance,

        "one_forecast":
            one_forecast,

        "dependence":
            dependence,

        "sample_size":
            sample_size
    }

    return (
        state.explain_report
    )