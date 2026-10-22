"""
Aureon Platform - Production WSGI Application Entry Point.
Used by Gunicorn or other production WSGI servers on Linux/Render.

Usage:
    gunicorn wsgi:app
"""
import os
from app import create_app

# Instantiate production application
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
