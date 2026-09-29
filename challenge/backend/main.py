from fastapi import (
    FastAPI,
    HTTPException
)

from fastapi.middleware.cors import (
    CORSMiddleware
)

from pydantic import (
    BaseModel,
    Field
)

from pipeline import (
    load_dataset,
    clean_dataset,
    run_feature_selection,
    prepare_sequences
)

from training import (
    train_and_tune
)

from evaluation import (
    evaluate_model
)

from explainability import (
    explain_model
)

from forecasting import (
    get_forecast_template,
    forecast_next_month
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title=(
        "Philippine Tourist Arrivals "
        "Forecast API"
    ),
    description=(
        "FastAPI backend for Philippine "
        "tourist arrival forecasting using "
        "LSTM and SHAP explainability."
    ),
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class PrepareRequest(
    BaseModel
):

    train_ratio: float = Field(
        default=0.80,
        ge=0.60,
        le=0.95
    )


class ForecastRequest(
    BaseModel
):

    rows: list[
        dict[
            str,
            float
        ]
    ]


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message":
            "Philippine Tourist "
            "Arrivals Forecast API",

        "status":
            "running",

        "pipeline": [
            "dataset",
            "clean",
            "features",
            "prepare",
            "train",
            "evaluate",
            "explain",
            "forecast"
        ]
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {
        "status":
            "ok"
    }


# =========================================================
# STEP 1 - DATASET
# =========================================================

@app.get("/dataset")
def dataset():

    try:

        return (
            load_dataset()
        )

    except FileNotFoundError as error:

        raise HTTPException(
            status_code=404,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 2 - CLEAN
# =========================================================

@app.post("/clean")
def clean():

    try:

        return (
            clean_dataset()
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 3 - FEATURE SELECTION
# =========================================================

@app.post("/features")
def features():

    try:

        return (
            run_feature_selection()
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 4 - PREPARE
# =========================================================

@app.post("/prepare")
def prepare(
    request: PrepareRequest
):

    try:

        return (
            prepare_sequences(
                train_ratio=
                    request.train_ratio,

                lookback=12
            )
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 5 - TRAIN
# =========================================================

@app.post("/train")
def train():

    try:

        return (
            train_and_tune()
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 6 - EVALUATE
# =========================================================

@app.post("/evaluate")
def evaluate():

    try:

        return (
            evaluate_model()
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 7 - SHAP EXPLAINABILITY
# =========================================================

@app.post("/explain")
def explain():

    try:

        return (
            explain_model()
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 8 - FORECAST TEMPLATE
# =========================================================

@app.get(
    "/forecast/template"
)
def forecast_template():

    try:

        return (
            get_forecast_template()
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# STEP 8 - FORECAST
# =========================================================

@app.post("/forecast")
def forecast(
    request: ForecastRequest
):

    try:

        return (
            forecast_next_month(
                request.rows
            )
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )