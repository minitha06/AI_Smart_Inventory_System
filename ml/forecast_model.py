import datetime

import numpy as np
from sklearn.linear_model import LinearRegression


def _build_time_series(sales_history):
    """Convert sales history rows into a numeric time series."""
    if not sales_history:
        return None, None, None

    dates = [datetime.datetime.strptime(row["day"], "%Y-%m-%d").date() for row in sales_history]
    quantities = np.array([float(row["total_quantity"]) for row in sales_history], dtype=float)
    x_values = np.arange(len(quantities)).reshape(-1, 1)
    return dates, x_values, quantities


def train_forecast_model(sales_history):
    """Train a simple linear regression model from daily sales history."""
    dates, x_values, quantities = _build_time_series(sales_history)
    if x_values is None or len(quantities) < 2:
        return None, dates, quantities

    model = LinearRegression()
    model.fit(x_values, quantities)
    confidence = float(max(0.0, min(1.0, model.score(x_values, quantities))))
    return (model, confidence, len(quantities)), dates, quantities


def predict_demand(model_data, horizon=7):
    """Predict demand for the next horizon days."""
    if model_data is None:
        return []

    model, _, history_length = model_data
    if history_length <= 0:
        return []

    future_indices = np.arange(history_length, history_length + horizon).reshape(-1, 1)
    predictions = model.predict(future_indices)
    return [max(0.0, float(round(value, 2))) for value in predictions]


def build_forecast_rows(sales_history, horizon=7):
    """Generate a list of predictions for the next horizon days."""
    if sales_history:
        last_date = datetime.datetime.strptime(sales_history[-1]["day"], "%Y-%m-%d").date()
    else:
        last_date = datetime.date.today()

    model_data, dates, quantities = train_forecast_model(sales_history)
    confidence = model_data[1] if model_data else 0.0
    predictions = predict_demand(model_data, horizon)

    if not predictions and quantities is not None and len(quantities) > 0:
        predictions = [float(quantities[-1])] * horizon

    forecast_rows = []
    for index in range(horizon):
        forecast_date = last_date + datetime.timedelta(days=index + 1)
        quantity = predictions[index] if index < len(predictions) else 0.0
        forecast_rows.append({
            "forecast_date": forecast_date.strftime("%Y-%m-%d"),
            "forecast_quantity": quantity,
            "confidence": confidence,
        })

    return forecast_rows
