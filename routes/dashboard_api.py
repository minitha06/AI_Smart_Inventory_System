import datetime
from flask import Blueprint, request, jsonify, session
from utils.db import (
    get_db_connection,
    get_user_by_username,
    get_products,
    get_product,
    insert_product,
    update_product,
    delete_product,
    adjust_stock,
    get_inventory_logs,
    get_sales,
    record_sale,
    get_sales_history,
    save_forecast,
)
from ml.forecast_model import build_forecast_rows

dashboard_api_bp = Blueprint("dashboard_api", __name__, url_prefix="/api/v2")


def _require_login():
    """Verify if the user session is active."""
    if "user_id" not in session:
        return False
    return True


@dashboard_api_bp.route("/auth/me", methods=["GET"])
def auth_me():
    if not _require_login():
        return jsonify({"logged_in": False}), 200
    return jsonify({
        "logged_in": True,
        "username": session.get("username"),
        "user_id": session.get("user_id")
    })


@dashboard_api_bp.route("/auth/login", methods=["POST"])
def auth_login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    user = get_user_by_username(username)
    if user is None or user["password"] != password:
        return jsonify({"error": "Invalid username or password."}), 401

    session["user_id"] = user["id"]
    session["username"] = user["username"]

    return jsonify({
        "status": "success",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    })


@dashboard_api_bp.route("/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"status": "success"})


@dashboard_api_bp.route("/dashboard/stats", methods=["GET"])
def dashboard_stats():
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    with get_db_connection() as conn:
        # Total Products
        total_products = conn.execute("SELECT COUNT(*) FROM Products").fetchone()[0] or 0

        # Total Stock Value
        total_value = conn.execute("SELECT SUM(stock * unit_price) FROM Products").fetchone()[0] or 0.0

        # Low Stock Items
        low_stock_count = conn.execute("SELECT COUNT(*) FROM Products WHERE stock <= reorder_level").fetchone()[0] or 0

        # Monthly sales revenue (last 30 days)
        thirty_days_ago = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
        monthly_revenue = conn.execute(
            "SELECT SUM(sale_price) FROM Sales WHERE sale_date >= ?", (thirty_days_ago,)
        ).fetchone()[0] or 0.0

        # Recent activities (last 8 inventory logs)
        logs_cursor = conn.execute(
            "SELECT Products.name AS product_name, Products.sku, InventoryLogs.change_quantity, "
            "InventoryLogs.log_type, InventoryLogs.reference, InventoryLogs.timestamp "
            "FROM InventoryLogs "
            "LEFT JOIN Products ON Products.id = InventoryLogs.product_id "
            "ORDER BY InventoryLogs.timestamp DESC LIMIT 8"
        ).fetchall()
        
        recent_logs = []
        for row in logs_cursor:
            recent_logs.append({
                "product_name": row["product_name"] or "Unknown Product",
                "sku": row["sku"] or "N/A",
                "change_quantity": row["change_quantity"],
                "log_type": row["log_type"],
                "reference": row["reference"],
                "timestamp": row["timestamp"]
            })

        # Category Breakdown
        categories_cursor = conn.execute(
            "SELECT category, COUNT(*) as count, SUM(stock) as stock, SUM(stock * unit_price) as value "
            "FROM Products GROUP BY category"
        ).fetchall()
        category_stats = []
        for row in categories_cursor:
            category_stats.append({
                "category": row["category"] or "Uncategorized",
                "count": row["count"],
                "stock": row["stock"] or 0,
                "value": round(row["value"] or 0.0, 2)
            })

        # Sales Trend (past 30 days daily)
        sales_trend_cursor = conn.execute(
            "SELECT date(sale_date) AS day, SUM(sale_price) AS revenue, SUM(quantity) AS quantity "
            "FROM Sales "
            "WHERE sale_date >= ? "
            "GROUP BY date(sale_date) "
            "ORDER BY day ASC", (thirty_days_ago,)
        ).fetchall()
        
        sales_trend = []
        for row in sales_trend_cursor:
            sales_trend.append({
                "date": row["day"],
                "revenue": round(row["revenue"] or 0.0, 2),
                "quantity": row["quantity"] or 0
            })

        # Top products by sales revenue
        top_products_cursor = conn.execute(
            "SELECT Products.name, Products.sku, SUM(Sales.quantity) as total_qty, SUM(Sales.sale_price) as total_revenue "
            "FROM Sales "
            "JOIN Products ON Sales.product_id = Products.id "
            "GROUP BY Products.id "
            "ORDER BY total_revenue DESC LIMIT 5"
        ).fetchall()
        top_products = []
        for row in top_products_cursor:
            top_products.append({
                "name": row["name"],
                "sku": row["sku"],
                "quantity": row["total_qty"],
                "revenue": round(row["total_revenue"] or 0.0, 2)
            })

        # Low Stock Products Details
        low_stock_details_cursor = conn.execute(
            "SELECT id, sku, name, category, stock, reorder_level, unit_price FROM Products WHERE stock <= reorder_level ORDER BY stock ASC LIMIT 5"
        ).fetchall()
        low_stock_details = []
        for row in low_stock_details_cursor:
            low_stock_details.append({
                "id": row["id"],
                "sku": row["sku"],
                "name": row["name"],
                "category": row["category"],
                "stock": row["stock"],
                "reorder_level": row["reorder_level"],
                "unit_price": row["unit_price"]
            })

    return jsonify({
        "stats": {
            "total_products": total_products,
            "total_value": round(total_value, 2),
            "low_stock_count": low_stock_count,
            "monthly_revenue": round(monthly_revenue, 2)
        },
        "recent_logs": recent_logs,
        "category_stats": category_stats,
        "sales_trend": sales_trend,
        "top_products": top_products,
        "low_stock_details": low_stock_details
    })


@dashboard_api_bp.route("/products", methods=["GET"])
def get_products_api():
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    search = request.args.get("search", "").strip()
    products_raw = get_products(search)
    products = []
    
    # We also query reorder_level
    with get_db_connection() as conn:
        for p in products_raw:
            # Let's get the full details (description, reorder_level)
            full_p = conn.execute(
                "SELECT description, reorder_level FROM Products WHERE id = ?", (p["id"],)
            ).fetchone()
            
            products.append({
                "id": p["id"],
                "sku": p["sku"],
                "name": p["name"],
                "category": p["category"],
                "price": p["unit_price"],
                "stock": p["stock"],
                "rfid_uid": p["rfid_uid"],
                "description": full_p["description"] if full_p else "",
                "reorder_level": full_p["reorder_level"] if full_p else 10
            })

    return jsonify(products)


@dashboard_api_bp.route("/products", methods=["POST"])
def add_product_api():
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    sku = (payload.get("sku") or "").strip()
    name = (payload.get("name") or "").strip()
    category = (payload.get("category") or "").strip()
    rfid_uid = (payload.get("rfid_uid") or "").strip()
    description = (payload.get("description") or "").strip()
    price = payload.get("price", 0.0)
    stock = payload.get("stock", 0)
    reorder_level = payload.get("reorder_level", 10)

    if not sku or not name:
        return jsonify({"error": "SKU and Name are required fields."}), 400

    try:
        price = float(price)
    except (ValueError, TypeError):
        price = 0.0

    try:
        stock = int(stock)
    except (ValueError, TypeError):
        stock = 0

    try:
        reorder_level = int(reorder_level)
    except (ValueError, TypeError):
        reorder_level = 10

    # Insert using existing insert_product (let's extend it or write insert manually to include reorder_level)
    with get_db_connection() as conn:
        # Check if sku already exists
        exists = conn.execute("SELECT id FROM Products WHERE sku = ?", (sku,)).fetchone()
        if exists:
            return jsonify({"error": f"Product with SKU '{sku}' already exists."}), 400
        
        conn.execute(
            "INSERT INTO Products (sku, name, description, category, unit_price, stock, rfid_uid, reorder_level) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (sku, name, description, category, price, stock, rfid_uid, reorder_level)
        )
        conn.commit()
        
        new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        # Log change
        if stock > 0:
            conn.execute(
                "INSERT INTO InventoryLogs (product_id, change_quantity, log_type, reference) "
                "VALUES (?, ?, ?, ?)",
                (new_id, stock, "stock_in", "Initial stock")
            )
            conn.commit()

    return jsonify({"status": "success", "product_id": new_id})


@dashboard_api_bp.route("/products/<int:product_id>", methods=["PUT"])
def edit_product_api(product_id):
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    product = get_product(product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    payload = request.get_json(silent=True) or {}
    sku = (payload.get("sku") or "").strip()
    name = (payload.get("name") or "").strip()
    category = (payload.get("category") or "").strip()
    rfid_uid = (payload.get("rfid_uid") or "").strip()
    description = (payload.get("description") or "").strip()
    price = payload.get("price", 0.0)
    stock = payload.get("stock", 0)
    reorder_level = payload.get("reorder_level", 10)

    if not sku or not name:
        return jsonify({"error": "SKU and Name are required fields."}), 400

    try:
        price = float(price)
    except (ValueError, TypeError):
        price = 0.0

    try:
        stock = int(stock)
    except (ValueError, TypeError):
        stock = 0

    try:
        reorder_level = int(reorder_level)
    except (ValueError, TypeError):
        reorder_level = 10

    # If stock changes, log it
    stock_difference = stock - product["stock"]

    with get_db_connection() as conn:
        conn.execute(
            "UPDATE Products SET sku = ?, name = ?, description = ?, category = ?, unit_price = ?, "
            "stock = ?, rfid_uid = ?, reorder_level = ? WHERE id = ?",
            (sku, name, description, category, price, stock, rfid_uid, reorder_level, product_id)
        )
        if stock_difference != 0:
            log_type = "manual_in" if stock_difference > 0 else "manual_out"
            conn.execute(
                "INSERT INTO InventoryLogs (product_id, change_quantity, log_type, reference) "
                "VALUES (?, ?, ?, ?)",
                (product_id, stock_difference, log_type, "Product edit")
            )
        conn.commit()

    return jsonify({"status": "success"})


@dashboard_api_bp.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product_api(product_id):
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    product = get_product(product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    delete_product(product_id)
    return jsonify({"status": "success"})


@dashboard_api_bp.route("/products/<int:product_id>/adjust", methods=["POST"])
def adjust_product_stock_api(product_id):
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    product = get_product(product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    payload = request.get_json(silent=True) or {}
    action = (payload.get("action") or "increase").lower()
    quantity = payload.get("quantity", 1)

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        quantity = 1

    if action == "decrease":
        amount = -abs(quantity)
        log_type = "manual_out"
    else:
        amount = abs(quantity)
        log_type = "manual_in"

    new_stock = adjust_stock(product_id, amount, log_type, reference="Manual Adjust")
    if new_stock is None:
         return jsonify({"error": "Failed to update stock"}), 500

    return jsonify({
        "status": "success",
        "new_stock": new_stock
    })


@dashboard_api_bp.route("/inventory/logs", methods=["GET"])
def get_logs_api():
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    limit = request.args.get("limit", 50, type=int)
    logs_raw = get_inventory_logs(limit)
    logs = []
    for log in logs_raw:
        logs.append({
            "product_name": log["product_name"] or "Unknown Product",
            "change_quantity": log["change_quantity"],
            "log_type": log["log_type"],
            "reference": log["reference"],
            "timestamp": log["timestamp"]
        })
    return jsonify(logs)


@dashboard_api_bp.route("/sales", methods=["GET"])
def get_sales_api():
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    search = request.args.get("search", "").strip()
    sales_raw = get_sales(search)
    sales = []
    for sale in sales_raw:
        sales.append({
            "id": sale["id"],
            "product_id": sale["product_id"],
            "sku": sale["sku"],
            "product_name": sale["product_name"] or "Unknown Product",
            "quantity": sale["quantity"],
            "sale_price": sale["sale_price"],
            "customer_name": sale["customer_name"],
            "sale_date": sale["sale_date"]
        })
    return jsonify(sales)


@dashboard_api_bp.route("/sales", methods=["POST"])
def record_sale_api():
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    product_id = payload.get("product_id")
    quantity = payload.get("quantity", 1)
    sale_price = payload.get("sale_price", 0.0)
    customer_name = (payload.get("customer_name") or "").strip()

    if not product_id:
        return jsonify({"error": "Select a product."}), 400

    product = get_product(product_id)
    if not product:
         return jsonify({"error": "Product not found."}), 404

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        quantity = 1

    try:
        sale_price = float(sale_price)
    except (TypeError, ValueError):
        sale_price = 0.0

    if product["stock"] < quantity:
         return jsonify({"error": f"Insufficient stock. Available: {product['stock']}"}), 400

    new_stock = record_sale(product_id, quantity, sale_price, customer_name)
    if new_stock is None:
        return jsonify({"error": "Failed to record sale"}), 500

    return jsonify({
        "status": "success",
        "new_stock": new_stock
    })


@dashboard_api_bp.route("/forecast", methods=["GET"])
def get_forecast_api():
    if not _require_login():
        return jsonify({"error": "Unauthorized"}), 401

    product_id = request.args.get("product_id", type=int)
    if not product_id:
        return jsonify({"error": "product_id is required."}), 400

    selected_product = get_product(product_id)
    if not selected_product:
        return jsonify({"error": "Product not found."}), 404

    sales_history = get_sales_history(product_id)
    forecast_rows = build_forecast_rows(sales_history, horizon=7)

    # Save to forecast DB
    for row in forecast_rows:
        save_forecast(product_id, row["forecast_date"], row["forecast_quantity"], row["confidence"])

    tomorrow_prediction = forecast_rows[0]["forecast_quantity"] if forecast_rows else 0.0
    predicted_weekly = sum(row["forecast_quantity"] for row in forecast_rows)
    recommended_order = max(0, int(predicted_weekly - selected_product["stock"]))

    # Retrieve history of forecast runs for this product
    with get_db_connection() as conn:
        history_cursor = conn.execute(
            "SELECT forecast_date, forecast_quantity, confidence, created_at "
            "FROM Forecast WHERE product_id = ? "
            "ORDER BY created_at DESC LIMIT 20", (product_id,)
        ).fetchall()
        
        forecast_history = []
        for row in history_cursor:
            forecast_history.append({
                "forecast_date": row["forecast_date"],
                "forecast_quantity": row["forecast_quantity"],
                "confidence": row["confidence"],
                "created_at": row["created_at"]
            })

    return jsonify({
        "product": {
            "id": selected_product["id"],
            "sku": selected_product["sku"],
            "name": selected_product["name"],
            "stock": selected_product["stock"]
        },
        "forecast_rows": forecast_rows,
        "tomorrow_prediction": round(tomorrow_prediction, 2),
        "predicted_weekly": round(predicted_weekly, 2),
        "recommended_order": recommended_order,
        "forecast_history": forecast_history
    })
