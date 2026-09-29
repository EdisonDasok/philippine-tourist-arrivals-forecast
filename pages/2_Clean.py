import streamlit as st

st.title("2. Clean the data")

if "raw_df" not in st.session_state:
    st.warning("Run the Dataset page first.")
    st.stop()

if st.button("Run cleaning"):
    df = st.session_state.raw_df.copy()

    # --------------------------------------------------
    # 1. Remove duplicate months
    # --------------------------------------------------
    duplicates_removed = int(
        df.duplicated(subset="date").sum()
    )

    df = df.drop_duplicates(
        subset="date",
        keep="first"
    ).reset_index(drop=True)

    # --------------------------------------------------
    # 2. Record missing values BEFORE filling
    # --------------------------------------------------
    missing_before = df.isna().sum()
    missing_before = missing_before[
        missing_before > 0
    ]

    rows_with_missing = df.loc[
        df.isna().any(axis=1)
    ].copy()

    # --------------------------------------------------
    # 3. Fill missing numeric values using past values
    # --------------------------------------------------
    numeric_columns = df.select_dtypes(
        include="number"
    ).columns

    df[numeric_columns] = (
        df[numeric_columns]
        .ffill()
    )

    # Check whether anything is still missing
    missing_after = df.isna().sum()
    missing_after = missing_after[
        missing_after > 0
    ]

    # --------------------------------------------------
    # 4. IQR outlier check on arrivals
    # --------------------------------------------------
    q1, q3 = df["arrivals"].quantile(
        [0.25, 0.75]
    )

    iqr = q3 - q1

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    flagged = df[
        (df["arrivals"] < lower) |
        (df["arrivals"] > upper)
    ]

    # --------------------------------------------------
    # 5. Save cleaned data for later pages
    # --------------------------------------------------
    st.session_state.clean_df = df

    st.session_state.clean_report = {
        "duplicates_removed": duplicates_removed,
        "missing_before": missing_before,
        "rows_with_missing": rows_with_missing,
        "missing_after": missing_after,
        "flagged": flagged[["date", "arrivals"]],
    }


# --------------------------------------------------
# Display results
# --------------------------------------------------

if "clean_report" in st.session_state:

    report = st.session_state.clean_report

    st.write(
        f"Duplicates removed: "
        f"{report['duplicates_removed']}"
    )

    st.subheader("Missing values found")

    st.dataframe(
        report["missing_before"]
    )

    st.subheader("Rows containing missing values")

    st.dataframe(
        report["rows_with_missing"]
    )

    if len(report["missing_after"]) == 0:
        st.success(
            "All missing numeric values were filled "
            "using the previous available value."
        )
    else:
        st.warning(
            "Some missing values still remain:"
        )

        st.dataframe(
            report["missing_after"]
        )

    st.subheader("Flagged outliers")

    st.dataframe(
        report["flagged"]
    )

else:

    st.info(
        'Click "Run cleaning" to process '
        "the dataset."
    )