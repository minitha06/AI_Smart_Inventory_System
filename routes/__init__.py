from .auth import auth_bp
from .inventory import inventory_bp
from .forecast import forecast_bp
from .api import api_bp
from .sales import sales_bp
from .dashboard_api import dashboard_api_bp


def init_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(forecast_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(sales_bp)
    app.register_blueprint(dashboard_api_bp)
