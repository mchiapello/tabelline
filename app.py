import os
from flask import Flask, g
from database import init_db, get_db


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-CHANGE-ME')
    app.config['DATABASE']   = os.environ.get('DATABASE', 'mathquest.db')

    init_db()

    @app.teardown_appcontext
    def close_db(error):
        db = g.pop('db', None)
        if db is not None:
            db.close()

    # Page routes
    from routes.pages import pages_bp
    app.register_blueprint(pages_bp)

    # Core API routes
    from routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # Module registry
    from registry import load_active_modules
    load_active_modules(app)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5002)
