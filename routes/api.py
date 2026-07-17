from flask import Blueprint, request, jsonify

from utils.db import get_product_by_rfid, adjust_stock

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/status")
def status():
    return jsonify({"status": "ok"})


@api_bp.route("/rfid/find", methods=["POST"])
def find_by_rfid():
    payload = request.get_json(silent=True) or {}
    rfid_uid = (payload.get("rfid_uid") or "").strip()

    if not rfid_uid:
        return jsonify({"error": "rfid_uid is required"}), 400

    product = get_product_by_rfid(rfid_uid)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({
        "id": product["id"],
        "sku": product["sku"],
        "name": product["name"],
        "category": product["category"],
        "price": product["unit_price"],
        "stock": product["stock"],
        "rfid_uid": product["rfid_uid"],
    })


@api_bp.route("/rfid/scan", methods=["POST"])
def scan_rfid():
    payload = request.get_json(silent=True) or {}
    rfid_uid = (payload.get("rfid_uid") or "").strip()
    action = (payload.get("action") or "find").lower()
    quantity = payload.get("quantity", 1)
    reference = payload.get("reference", "esp32")

    if not rfid_uid:
        return jsonify({"error": "rfid_uid is required"}), 400

    product = get_product_by_rfid(rfid_uid)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if action not in ["find", "increase", "decrease"]:
        return jsonify({"error": "Invalid action"}), 400

    if action == "find":
        return jsonify({
            "status": "found",
            "product": {
                "id": product["id"],
                "sku": product["sku"],
                "name": product["name"],
                "category": product["category"],
                "price": product["unit_price"],
                "stock": product["stock"],
                "rfid_uid": product["rfid_uid"],
            },
        })

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        quantity = 1

    amount = abs(quantity)
    if action == "decrease":
        amount = -amount
        log_type = "rfid_out"
    else:
        log_type = "rfid_in"

    new_stock = adjust_stock(product["id"], amount, log_type, reference)
    if new_stock is None:
        return jsonify({"error": "Failed to update stock"}), 500

    return jsonify({
        "status": "updated",
        "product_id": product["id"],
        "new_stock": new_stock,
        "action": action,
    })
