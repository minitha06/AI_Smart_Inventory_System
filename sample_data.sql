-- Sample data for AI-Based Smart Inventory Management System

INSERT INTO Users (username, password, email, role)
VALUES
    ('admin', 'admin123', 'admin@example.com', 'admin'),
    ('staff1', 'staff123', 'staff1@example.com', 'staff');

INSERT INTO Products (sku, name, description, category, unit_price, stock, rfid_uid, reorder_level)
VALUES
    ('SKU001', 'Wireless Mouse', 'Compact wireless optical mouse', 'Accessories', 15.99, 25, 'RFID-1001', 5),
    ('SKU002', 'Keyboard', 'Wired mechanical keyboard', 'Accessories', 29.99, 15, 'RFID-1002', 10),
    ('SKU003', 'ESP32 Module', 'WiFi + Bluetooth development board', 'Hardware', 8.50, 12, 'RFID-1003', 3);

INSERT INTO InventoryLogs (product_id, change_quantity, log_type, reference)
VALUES
    (1, 20, 'stock_in', 'Initial stock'),
    (2, 15, 'stock_in', 'Initial stock'),
    (3, 10, 'stock_in', 'Initial stock');

INSERT INTO Sales (product_id, quantity, sale_price, customer_name)
VALUES
    (1, 2, 31.98, 'University Lab'),
    (2, 1, 29.99, 'Research Team');

INSERT INTO Forecast (product_id, forecast_date, forecast_quantity, confidence)
VALUES
    (1, '2026-08-01', 12, 0.88),
    (2, '2026-08-01', 8, 0.80),
    (3, '2026-08-01', 5, 0.92);
