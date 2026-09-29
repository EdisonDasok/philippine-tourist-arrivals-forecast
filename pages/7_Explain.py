import streamlit as st
import numpy as np
import pandas as pd
import shap

st.title("7. Explain with SHAP")

if "model" not in st.session_state:
    st.warning("Run the Train page first.")
    st.stop()


if st.button("Compute SHAP values"):

    with st.spinner(
        "Computing SHAP explanations... "
        "This may take a few minutes."
    ):

        X_train_seq = st.session_state.X_train_seq
        X_test_seq = st.session_state.X_test_seq

        features = st.session_state.selected_features
        model = st.session_state.model

        lookback = X_train_seq.shape[1]
        n_features = X_train_seq.shape[2]


        # --------------------------------------------------
        # KernelExplainer needs 2D input.
        # Convert flattened data back into LSTM sequences.
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
        # Background sample
        # --------------------------------------------------

        rng = np.random.default_rng(42)

        background_size = min(
            50,
            len(X_train_seq)
        )

        background_indices = rng.choice(
            len(X_train_seq),
            background_size,
            replace=False
        )

        background = X_train_seq[
            background_indices
        ]

        background_flat = background.reshape(
            len(background),
            -1
        )

        # Reduce background to representative samples
        background_summary = shap.kmeans(
            background_flat,
            10
        )


        # --------------------------------------------------
        # Explain the first 20 test forecasts
        # --------------------------------------------------

        sample_size = min(
            20,
            len(X_test_seq)
        )

        test_sample = X_test_seq[
            :sample_size
        ]

        test_flat = test_sample.reshape(
            sample_size,
            -1
        )


        explainer = shap.KernelExplainer(
            predict_flat,
            background_summary
        )


        shap_values = explainer.shap_values(
            test_flat,
            nsamples=100
        )


        # --------------------------------------------------
        # Handle SHAP version differences
        # --------------------------------------------------

        if isinstance(shap_values, list):
            shap_values = shap_values[0]

        shap_values = np.asarray(
            shap_values
        )

        if shap_values.ndim == 3:
            shap_values = shap_values[..., 0]


        shap_values = shap_values.reshape(
            sample_size,
            lookback,
            n_features
        )


        # --------------------------------------------------
        # Global feature importance
        # --------------------------------------------------

        mean_abs = np.abs(
            shap_values
        ).mean(
            axis=(0, 1)
        )

        top_idx = int(
            np.argmax(mean_abs)
        )


        global_importance = pd.DataFrame({
            "feature": features,
            "importance": mean_abs
        }).sort_values(
            "importance",
            ascending=False
        )


        # --------------------------------------------------
        # One forecast: sum contribution across 12 months
        # --------------------------------------------------

        one_forecast_values = (
            shap_values[0]
            .sum(axis=0)
        )

        one_forecast = pd.DataFrame({
            "feature": features,
            "SHAP contribution":
                one_forecast_values
        }).sort_values(
            "SHAP contribution",
            key=lambda x: abs(x),
            ascending=False
        )


        # --------------------------------------------------
        # Dependence data for most important feature
        # --------------------------------------------------

        dependence = pd.DataFrame({
            "value": [
                float(
                    X_test_seq[
                        i,
                        -1,
                        top_idx
                    ]
                )
                for i in range(sample_size)
            ],

            "shap": [
                float(
                    shap_values[
                        i,
                        -1,
                        top_idx
                    ]
                )
                for i in range(sample_size)
            ]
        })


        # --------------------------------------------------
        # Save report
        # --------------------------------------------------

        st.session_state.explain_report = {

            "global_importance":
                global_importance,

            "one_forecast":
                one_forecast,

            "top_feature":
                features[top_idx],

            "dependence":
                dependence
        }


# --------------------------------------------------
# DISPLAY RESULTS
# --------------------------------------------------

if "explain_report" in st.session_state:

    r = st.session_state.explain_report


    st.subheader(
        "Global feature importance"
    )

    st.bar_chart(
        r["global_importance"]
        .set_index("feature")
    )


    st.dataframe(
        r["global_importance"],
        use_container_width=True
    )


    st.subheader(
        "One forecast — feature contributions"
    )

    st.bar_chart(
        r["one_forecast"]
        .set_index("feature")
    )


    st.dataframe(
        r["one_forecast"],
        use_container_width=True
    )


    st.subheader(
        f"Dependence plot — "
        f"{r['top_feature']}"
    )

    st.scatter_chart(
        r["dependence"],
        x="value",
        y="shap"
    )


    st.info(
        "SHAP describes what the model relied on. "
        "It does not prove that a feature causes "
        "tourist arrivals to increase or decrease."
    )


else:

    st.info(
        'Click "Compute SHAP values" '
        "to explain the trained model."
    )