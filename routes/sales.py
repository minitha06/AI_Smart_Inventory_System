from flask import Blueprint, render_template, request, redirect, url_for, session

from utils.db import get_products, get_sales, record_sale

sales_bp = Blueprint("sales", __name__, url_prefix="/sales")


def _require_login():
    if "user_id" not in session:
        return redirect(url_for("auth.login"))
    return None


@sales_bp.route("", methods=["GET"])
def sales_dashboard():
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    search = request.args.get("search", "").strip()
    products = get_products()
    sales = get_sales(search)
    message = request.args.get("message", "")

    return render_template(
        "sales.html",
        products=products,
        sales=sales,
        search=search,
        message=message,
    )


@sales_bp.route("/record", methods=["POST"])
def record_sale_entry():
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    product_id = request.form.get("product_id")
    quantity = request.form.get("quantity", "1").strip()
    sale_price = request.form.get("sale_price", "0").strip()
    customer_name = request.form.get("customer_name", "").strip()

    if not product_id:
        return redirect(url_for("sales.sales_dashboard", message="Select a product."))

    try:
        quantity = int(quantity)
    except ValueError:
        quantity = 1

    try:
        sale_price = float(sale_price)
    except ValueError:
        sale_price = 0.0

    new_stock = record_sale(product_id, quantity, sale_price, customer_name)
    if new_stock is None:
        return redirect(url_for("sales.sales_dashboard", message="Product not found."))

    return redirect(url_for("sales.sales_dashboard", message="Sale recorded successfully."))
