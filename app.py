import os
from flask import Flask, redirect, url_for, session, send_from_directory
from config import Config
from routes import init_routes


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.config.from_object(Config)
    app.secret_key = app.config["SECRET_KEY"]

    init_routes(app)

    # Route to serve Vite production build assets
    @app.route("/assets/<path:path>")
    def serve_assets(path):
        return send_from_directory("frontend/dist/assets", path)

    # Catch-all frontend route to serve the React SPA
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        # Skip API and auth routes
        if path.startswith("api/") or path.startswith("auth/") or path.startswith("assets/"):
            return "Not Found", 404
        
        # If the file exists in the old static folder, serve it (for compatibility/images)
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return app.send_static_file(path)
            
        # Serve React frontend index.html
        return send_from_directory("frontend/dist", "index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)