from flask import Blueprint, render_template, request, redirect, url_for, session

from utils.db import (
    get_products,
    get_product,
    insert_product,
    update_product,
    delete_product,
    adjust_stock,
    get_inventory_logs,
)

inventory_bp = Blueprint("inventory", __name__, url_prefix="/inventory")


def _require_login():
    if "user_id" not in session:
        return redirect(url_for("auth.login"))
    return None


@inventory_bp.route("", methods=["GET"])
def inventory_dashboard():
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    search = request.args.get("search", "").strip()
    products = get_products(search)
    logs = get_inventory_logs()
    message = request.args.get("message", "")

    return render_template(
        "inventory.html",
        products=products,
        search=search,
        logs=logs,
        message=message,
    )


@inventory_bp.route("/add", methods=["POST"])
def add_product():
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    sku = request.form.get("sku", "").strip()
    name = request.form.get("name", "").strip()
    category = request.form.get("category", "").strip()
    rfid_uid = request.form.get("rfid_uid", "").strip()
    description = request.form.get("description", "").strip()
    price = request.form.get("price", "0").strip()
    stock = request.form.get("stock", "0").strip()

    try:
        price = float(price)
    except ValueError:
        price = 0.0

    try:
        stock = int(stock)
    except ValueError:
        stock = 0

    insert_product(sku, name, category, price, stock, rfid_uid, description)
    return redirect(url_for("inventory.inventory_dashboard", message="Product added successfully."))


@inventory_bp.route("/edit/<int:product_id>", methods=["GET", "POST"])
def edit_product(product_id):
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    product = get_product(product_id)
    if product is None:
        return redirect(url_for("inventory.inventory_dashboard", message="Product not found."))

    if request.method == "POST":
        sku = request.form.get("sku", "").strip()
        name = request.form.get("name", "").strip()
        category = request.form.get("category", "").strip()
        rfid_uid = request.form.get("rfid_uid", "").strip()
        description = request.form.get("description", "").strip()
        price = request.form.get("price", "0").strip()
        stock = request.form.get("stock", "0").strip()

        try:
            price = float(price)
        except ValueError:
            price = 0.0

        try:
            stock = int(stock)
        except ValueError:
            stock = 0

        update_product(product_id, sku, name, category, price, stock, rfid_uid, description)
        return redirect(url_for("inventory.inventory_dashboard", message="Product updated successfully."))

    return render_template("edit_product.html", product=product)


@inventory_bp.route("/adjust/<int:product_id>", methods=["POST"])
def adjust_product_stock(product_id):
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    product = get_product(product_id)
    if product is None:
        return redirect(url_for("inventory.inventory_dashboard", message="Product not found."))

    action = request.form.get("action", "").lower()
    amount = request.form.get("quantity", "1").strip()

    try:
        amount = int(amount)
    except ValueError:
        amount = 1

    if action == "decrease":
        amount = -abs(amount)
        log_type = "manual_out"
    else:
        amount = abs(amount)
        log_type = "manual_in"

    new_stock = adjust_stock(product_id, amount, log_type, reference="manual")
    message = "Stock updated." if new_stock is not None else "Unable to update stock."
    return redirect(url_for("inventory.inventory_dashboard", message=message))


@inventory_bp.route("/delete/<int:product_id>", methods=["POST"])
def remove_product(product_id):
    auth_redirect = _require_login()
    if auth_redirect:
        return auth_redirect

    delete_product(product_id)
    return redirect(url_for("inventory.inventory_dashboard", message="Product deleted successfully."))
