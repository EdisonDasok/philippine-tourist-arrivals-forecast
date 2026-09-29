import streamlit as st
import pandas as pd
from scipy.stats import spearmanr
from statsmodels.stats.outliers_influence import variance_inflation_factor

st.title("3. Feature selection")

if "clean_df" not in st.session_state:
    st.warning("Run the Clean page first.")
    st.stop()


# Numeric candidate predictors from the lab
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


if st.button("Run Spearman + VIF"):

    df = st.session_state.clean_df.copy()

    # --------------------------------------------------
    # STEP 1: Spearman correlation
    # --------------------------------------------------

    results = []

    for col in CANDIDATES:

        rho, p_value = spearmanr(
            df[col],
            df["arrivals"]
        )

        results.append({
            "feature": col,
            "rho": rho,
            "p_value": p_value
        })

    results_df = pd.DataFrame(results)

    # Keep only statistically useful features
    kept = [
        r["feature"]
        for r in results
        if abs(r["rho"]) > 0.10
        and r["p_value"] < 0.05
    ]

    # --------------------------------------------------
    # STEP 2: Iterative VIF
    # --------------------------------------------------

    vif_log = []

    if len(kept) == 0:

        st.error(
            "No features passed the Spearman filter."
        )

        st.stop()

    X = df[kept].dropna().copy()

    while X.shape[1] > 1:

        vifs = [
            variance_inflation_factor(
                X.values,
                i
            )
            for i in range(X.shape[1])
        ]

        max_vif = max(vifs)

        if max_vif < 5:
            break

        max_index = vifs.index(max_vif)

        drop_col = X.columns[max_index]

        vif_log.append({
            "dropped": drop_col,
            "vif": max_vif
        })

        X = X.drop(
            columns=[drop_col]
        )

    # --------------------------------------------------
    # Save results for later pages
    # --------------------------------------------------

    st.session_state.selected_features = list(
        X.columns
    )

    st.session_state.feature_report = {
        "results": results_df,
        "spearman_kept": kept,
        "vif_log": vif_log,
    }


# --------------------------------------------------
# DISPLAY RESULTS
# --------------------------------------------------

if "feature_report" in st.session_state:

    report = st.session_state.feature_report

    st.subheader("Spearman correlation results")

    st.dataframe(
        report["results"],
        use_container_width=True
    )

    st.subheader("Features that passed Spearman")

    st.write(
        report["spearman_kept"]
    )

    st.subheader("VIF removals")

    if len(report["vif_log"]) > 0:

        st.dataframe(
            pd.DataFrame(
                report["vif_log"]
            ),
            use_container_width=True
        )

    else:

        st.success(
            "No features needed to be removed by VIF."
        )

    st.success(
        f"Selected features: "
        f"{st.session_state.selected_features}"
    )

else:

    st.info(
        'Click "Run Spearman + VIF" '
        "to select features."
    )