from flask import Blueprint, render_template, request, redirect, url_for, session

from ml.forecast_model import build_forecast_rows
from utils.db import (
    get_products,
    get_product,
    get_sales_history,
    save_forecast,
    get_recent_forecasts,
)

forecast_bp = Blueprint("forecast", __name__, url_prefix="/forecast")


def _require_login():
    if "user_id" not in session:
        return redirect(url_for("auth.login"))
    return None


@forecast_bp.route("", methods=["GET"])
def forecast_dashboard():
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    product_id = request.args.get("product_id", type=int)
    products = get_products()
    selected_product = None
    forecast_rows = []
    forecast_message = ""
    predicted_weekly = 0
    tomorrow_prediction = 0
    recommended_order = 0

    if product_id:
        selected_product = get_product(product_id)
        if not selected_product:
            forecast_message = "Product not found."
        else:
            sales_history = get_sales_history(product_id)
            forecast_rows = build_forecast_rows(sales_history, horizon=7)
            for row in forecast_rows:
                save_forecast(product_id, row["forecast_date"], row["forecast_quantity"], row["confidence"])

            tomorrow_prediction = forecast_rows[0]["forecast_quantity"] if forecast_rows else 0
            predicted_weekly = sum(row["forecast_quantity"] for row in forecast_rows)
            recommended_order = max(0, int(predicted_weekly - selected_product["stock"]))
            forecast_message = "Forecast generated from sales history."

    return render_template(
        "forecast.html",
        products=products,
        selected_product=selected_product,
        forecast_rows=forecast_rows,
        tomorrow_prediction=tomorrow_prediction,
        predicted_weekly=predicted_weekly,
        recommended_order=recommended_order,
        forecast_message=forecast_message,
    )
