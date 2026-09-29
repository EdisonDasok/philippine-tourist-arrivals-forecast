# Philippine Tourist Arrivals Forecasting with LSTM & XAI

An ITD105 Laboratory Exercise that demonstrates time-series forecasting of Philippine tourist arrivals using a Long Short-Term Memory (LSTM) neural network with SHAP explainability.

The project includes the required Streamlit implementation and an optional richer application using FastAPI and Next.js.

---

## Project Overview

The system processes monthly Philippine tourist arrival data through a complete machine-learning pipeline:

1. Dataset inspection
2. Data cleaning
3. Feature selection
4. Leakage-safe data preparation
5. LSTM training and hyperparameter tuning
6. Test-set evaluation
7. SHAP explainability
8. Next-month forecasting

The project follows a chronological time-series workflow to avoid using future information when training the model.

---

## Main Features

### Dataset

The dataset contains monthly Philippine tourism information together with climate, environmental, hazard, and seasonal variables.

The target variable is:

```text
arrivals
```

### Data Cleaning

The cleaning stage:

- Removes duplicate monthly observations
- Handles missing numeric values using forward filling
- Detects unusual arrival values using the IQR rule
- Flags outliers instead of automatically deleting them

### Feature Selection

Candidate predictors are screened using:

```text
Spearman correlation:
|rho| > 0.10
p < 0.05
```

Features that pass the Spearman filter are then checked using Variance Inflation Factor (VIF).

Features with excessive multicollinearity are iteratively removed until:

```text
VIF < 5
```

A reference run selected the following eight predictors:

```text
quarter
is_holiday_peak
rainy_days
humidity_pct
typhoon_max_wind_kt
storm_signal_days
pm25_ugm3
wave_height_m
```

---

## Leakage-Safe Preparation

The default configuration uses:

```text
Training set: 80%
Test set:     20%
Lookback:     12 months
```

The split is chronological.

The `MinMaxScaler` is fitted only on the training data.

Training and test data are then transformed separately, and LSTM sequences are also created separately.

A reference run produced:

```text
Training rows:     249
Test rows:          63

Training windows:  237
Test windows:       51

X_train shape: (237, 12, 8)
X_test shape:   (51, 12, 8)
```

---

## LSTM Model

The neural network contains:

```text
LSTM
↓
Dropout
↓
Dense(1)
```

The model tests eight combinations of:

```text
LSTM units:   32, 64
Dropout:      0.1, 0.3
Batch size:   16, 32
```

Training uses:

- Adam optimizer
- Mean Squared Error loss
- Validation split
- Early stopping
- `shuffle=False`

Hyperparameters are chosen using validation loss only.

The held-out test set is not used for model selection.

A reference training run selected:

```text
Units:       64
Dropout:     0.3
Batch size:  16
```

Neural-network results may vary slightly between environments.

---

## Model Evaluation

The final LSTM is evaluated on the held-out test months using:

- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Mean Absolute Percentage Error (MAPE)
- R²

The model is compared with:

```text
Naive baseline
Seasonal-naive baseline
```

One reference run produced:

| Model          |        MAE |       RMSE |    MAPE |      R² |
| -------------- | ---------: | ---------: | ------: | ------: |
| LSTM           | 301,017.50 | 409,294.33 | 240.93% | -3.7243 |
| Naive          |  64,242.16 |  83,920.94 |  16.73% |  0.8014 |
| Seasonal Naive | 134,876.63 | 176,339.62 |  39.20% |  0.1231 |

In this run, the LSTM did not outperform the simpler baselines. This is reported as part of the model evaluation rather than hidden or altered.

---

## SHAP Explainability

SHAP is used to inspect what the trained LSTM relied on when producing forecasts.

The application provides:

- Global feature importance
- Feature contributions for one forecast
- Dependence information for the most influential feature

`KernelExplainer` is used for compatibility with the LSTM model.

SHAP values explain the behavior of the trained model. They do not prove that a predictor causes tourist arrivals to increase or decrease.

---

## Forecasting

The forecasting stage uses a 12-month predictor window.

Users can inspect and edit predictor values before requesting the next-month forecast.

A reference run using the default inputs produced approximately:

```text
311,969 tourist arrivals
```

The forecast should be interpreted together with the test-set evaluation results because predictive performance on unseen data was limited in the reference run.

---

# Applications

## 1. Streamlit Version

The Streamlit implementation follows the required laboratory workflow.

Pages:

```text
Dataset
Clean
Features
Prepare
Train
Evaluate
Explain
Forecast
```

Run from the project root:

```bash
source .venv/bin/activate

streamlit run Home.py
```

Then open:

```text
http://localhost:8501
```

---

## 2. FastAPI + Next.js Version

The optional challenge implementation separates the system into:

```text
Next.js
   ↓
FastAPI REST API
   ↓
LSTM + SHAP pipeline
```

### FastAPI Backend

From the project root:

```bash
source .venv/bin/activate

cd challenge/backend

python -m uvicorn main:app --reload
```

FastAPI:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

Available pipeline endpoints include:

```text
GET   /dataset
POST  /clean
POST  /features
POST  /prepare
POST  /train
POST  /evaluate
POST  /explain
GET   /forecast/template
POST  /forecast
```

### Next.js Frontend

Open another terminal:

```bash
cd challenge/frontend

npm install

npm run dev
```

Then open:

```text
http://localhost:3000
```

The interface uses a dashboard layout called **TouristFlow AI** with separate workspaces for each pipeline stage.

---

# Installation

## Python

Clone the repository and enter the project:

```bash
git clone YOUR_REPOSITORY_URL

cd tourist-arrivals-app
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install --upgrade pip

pip install -r requirements.txt
```

---

## Next.js

Install frontend dependencies:

```bash
cd challenge/frontend

npm install
```

---

# Project Structure

```text
tourist-arrivals-app/
│
├── Home.py
├── README.md
├── requirements.txt
├── .gitignore
│
├── data/
│   └── tourist_arrivals.csv
│
├── pages/
│   ├── 1_Dataset.py
│   ├── 2_Clean.py
│   ├── 3_Features.py
│   ├── 4_Prepare.py
│   ├── 5_Train.py
│   ├── 6_Evaluate.py
│   ├── 7_Explain.py
│   └── 8_Forecast.py
│
└── challenge/
    │
    ├── backend/
    │   ├── main.py
    │   ├── pipeline.py
    │   ├── training.py
    │   ├── evaluation.py
    │   ├── explainability.py
    │   └── forecasting.py
    │
    └── frontend/
        ├── package.json
        ├── package-lock.json
        │
        └── src/
            ├── app/
            │   ├── globals.css
            │   ├── layout.tsx
            │   └── page.tsx
            │
            └── components/
                ├── Sidebar.tsx
                ├── Topbar.tsx
                ├── Overview.tsx
                ├── FeaturePrepare.tsx
                ├── TrainModel.tsx
                ├── EvaluateModel.tsx
                ├── ExplainModel.tsx
                └── ForecastModel.tsx
```

---

# Important Methodological Safeguards

This project follows several rules intended to reduce time-series data leakage:

- Data is split chronologically.
- Future test observations are not shuffled into training data.
- Feature and target scalers are fitted on training observations only.
- Hyperparameters are selected using validation data rather than the test set.
- The held-out test set is reserved for final evaluation.
- Outliers are flagged rather than automatically removed.

---

# Limitations

The application is an educational forecasting prototype.

The reference LSTM run performed worse than the naive and seasonal-naive baselines. Therefore, the model should not be presented as a production-ready tourism forecasting system.

SHAP results describe model behavior and should not be interpreted as causal evidence.

Forecast results depend on the supplied predictor values and the performance of the trained model.

---

# Technologies

### Machine Learning

- Python
- TensorFlow / Keras
- NumPy
- pandas
- SciPy
- statsmodels
- scikit-learn
- SHAP

### Required Interface

- Streamlit

### Optional Challenge

- FastAPI
- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide Icons

---

# ITD105 Laboratory Exercise 1

**Forecasting Philippine Tourist Arrivals with LSTM & XAI**
