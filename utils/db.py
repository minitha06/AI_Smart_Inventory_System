"""Database helper module."""

import os
import sqlite3

from config import DATABASE_PATH, INSTANCE_DIR


def get_db_connection():
    """Create and return a SQLite connection to the configured database."""
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_user_by_username(username):
    """Fetch a single user by username."""
    query = "SELECT id, username, password, email, role FROM Users WHERE username = ?"
    with get_db_connection() as conn:
        cursor = conn.execute(query, (username,))
        return cursor.fetchone()


def get_products(search=None):
    """Return all products, optionally filtered by search terms."""
    filters = []
    params = []
    query = "SELECT id, sku, name, category, unit_price, stock, rfid_uid FROM Products"

    if search:
        term = f"%{search}%"
        query += " WHERE name LIKE ? OR category LIKE ? OR sku LIKE ? OR rfid_uid LIKE ?"
        params = [term, term, term, term]

    query += " ORDER BY name"
    with get_db_connection() as conn:
        return conn.execute(query, params).fetchall()


def get_product(product_id):
    """Return a single product by ID."""
    query = "SELECT id, sku, name, description, category, unit_price, stock, rfid_uid FROM Products WHERE id = ?"
    with get_db_connection() as conn:
        return conn.execute(query, (product_id,)).fetchone()


def insert_product(sku, name, category, price, stock, rfid_uid, description=None):
    """Insert a new product into the database."""
    query = (
        "INSERT INTO Products (sku, name, description, category, unit_price, stock, rfid_uid) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    with get_db_connection() as conn:
        conn.execute(query, (sku, name, description, category, price, stock, rfid_uid))
        conn.commit()


def update_product(product_id, sku, name, category, price, stock, rfid_uid, description=None):
    """Update product data by ID."""
    query = (
        "UPDATE Products SET sku = ?, name = ?, description = ?, category = ?, unit_price = ?, "
        "stock = ?, rfid_uid = ? WHERE id = ?"
    )
    with get_db_connection() as conn:
        conn.execute(query, (sku, name, description, category, price, stock, rfid_uid, product_id))
        conn.commit()


def delete_product(product_id):
    """Delete a product by ID."""
    query = "DELETE FROM Products WHERE id = ?"
    with get_db_connection() as conn:
        conn.execute(query, (product_id,))
        conn.commit()


def get_product_by_rfid(rfid_uid):
    """Return a product using its RFID UID."""
    query = "SELECT id, sku, name, description, category, unit_price, stock, rfid_uid FROM Products WHERE rfid_uid = ?"
    with get_db_connection() as conn:
        return conn.execute(query, (rfid_uid,)).fetchone()


def log_inventory_change(product_id, change_quantity, log_type, reference=None):
    """Store a stock change event in InventoryLogs."""
    query = (
        "INSERT INTO InventoryLogs (product_id, change_quantity, log_type, reference) "
        "VALUES (?, ?, ?, ?)"
    )
    with get_db_connection() as conn:
        conn.execute(query, (product_id, change_quantity, log_type, reference))
        conn.commit()


def adjust_stock(product_id, change_quantity, log_type, reference=None):
    """Update a product stock level and log the inventory change."""
    product = get_product(product_id)
    if not product:
        return None

    new_stock = max(product["stock"] + change_quantity, 0)
    update_query = "UPDATE Products SET stock = ? WHERE id = ?"
    with get_db_connection() as conn:
        conn.execute(update_query, (new_stock, product_id))
        conn.execute(
            "INSERT INTO InventoryLogs (product_id, change_quantity, log_type, reference) VALUES (?, ?, ?, ?)",
            (product_id, change_quantity, log_type, reference),
        )
        conn.commit()

    return new_stock


def get_inventory_logs(limit=20):
    """Return the most recent inventory log entries."""
    query = (
        "SELECT Products.name AS product_name, InventoryLogs.change_quantity, InventoryLogs.log_type, "
        "InventoryLogs.reference, InventoryLogs.timestamp "
        "FROM InventoryLogs "
        "LEFT JOIN Products ON Products.id = InventoryLogs.product_id "
        "ORDER BY InventoryLogs.timestamp DESC LIMIT ?"
    )
    with get_db_connection() as conn:
        return conn.execute(query, (limit,)).fetchall()


def get_sales(search=None):
    """Return sales history, optionally filtered by product or customer."""
    query = (
        "SELECT Sales.id, Sales.product_id, Products.sku, Products.name AS product_name, "
        "Sales.quantity, Sales.sale_price, Sales.customer_name, Sales.sale_date "
        "FROM Sales "
        "LEFT JOIN Products ON Products.id = Sales.product_id "
    )
    params = []

    if search:
        term = f"%{search}%"
        query += " WHERE Products.name LIKE ? OR Products.sku LIKE ? OR Sales.customer_name LIKE ?"
        params = [term, term, term]

    query += " ORDER BY Sales.sale_date DESC"
    with get_db_connection() as conn:
        return conn.execute(query, params).fetchall()


def record_sale(product_id, quantity, sale_price, customer_name=None):
    """Save a sale, reduce stock, and log the transaction."""
    product = get_product(product_id)
    if not product:
        return None

    quantity = max(int(quantity), 1)
    new_stock = max(product["stock"] - quantity, 0)

    with get_db_connection() as conn:
        conn.execute(
            "UPDATE Products SET stock = ? WHERE id = ?",
            (new_stock, product_id),
        )
        conn.execute(
            "INSERT INTO Sales (product_id, quantity, sale_price, customer_name) VALUES (?, ?, ?, ?)",
            (product_id, quantity, sale_price, customer_name),
        )
        conn.execute(
            "INSERT INTO InventoryLogs (product_id, change_quantity, log_type, reference) VALUES (?, ?, ?, ?)",
            (product_id, -quantity, "sale", customer_name or "pos"),
        )
        conn.commit()

    return new_stock


def get_sales_history(product_id):
    """Return daily sales totals for a given product."""
    query = (
        "SELECT date(sale_date) AS day, SUM(quantity) AS total_quantity "
        "FROM Sales WHERE product_id = ? "
        "GROUP BY date(sale_date) ORDER BY date(sale_date)"
    )
    with get_db_connection() as conn:
        return conn.execute(query, (product_id,)).fetchall()


def save_forecast(product_id, forecast_date, forecast_quantity, confidence=0.0):
    """Insert a forecast record into the Forecast table."""
    query = (
        "INSERT INTO Forecast (product_id, forecast_date, forecast_quantity, confidence) "
        "VALUES (?, ?, ?, ?)"
    )
    with get_db_connection() as conn:
        conn.execute(query, (product_id, forecast_date, forecast_quantity, confidence))
        conn.commit()


def get_recent_forecasts(product_id, limit=7):
    """Return the most recent stored forecasts for a product."""
    query = (
        "SELECT forecast_date, forecast_quantity, confidence, created_at "
        "FROM Forecast WHERE product_id = ? "
        "ORDER BY forecast_date ASC LIMIT ?"
    )
    with get_db_connection() as conn:
        return conn.execute(query, (product_id, limit)).fetchall()
