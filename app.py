import os
import logging
from flask import Flask
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix
from data_manager import data_manager

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure upload settings - use absolute path for PythonAnywhere compatibility
def is_pythonanywhere():
    """Detect if running on PythonAnywhere"""
    return (os.environ.get('PYTHONANYWHERE_DOMAIN') or 
            '/home/' in os.getcwd() and 'pythonanywhere' in os.environ.get('USER', '').lower() or
            os.path.exists('/home/eclipse111'))

if is_pythonanywhere():
    # PythonAnywhere environment
    app.config['UPLOAD_FOLDER'] = '/home/eclipse111/uploads'
else:
    # Local development
    app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')

app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

# Configure additional settings for file uploads
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Initialize extensions
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

# Create upload directory if it doesn't exist
try:
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.logger.info(f"Upload folder configured: {app.config['UPLOAD_FOLDER']}")
    app.logger.info(f"Upload folder exists: {os.path.exists(app.config['UPLOAD_FOLDER'])}")
    app.logger.info(f"Upload folder writable: {os.access(app.config['UPLOAD_FOLDER'], os.W_OK)}")
except Exception as e:
    app.logger.error(f"Failed to create upload directory: {e}")

class User:
    def __init__(self, user_data):
        self.id = user_data['id']
        self.username = user_data['username']
        self.email = user_data['email']
        self.password_hash = user_data['password_hash']
        self.created_at = user_data['created_at']
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
    
    def get_id(self):
        return str(self.id)

@login_manager.user_loader
def load_user(user_id):
    user_data = data_manager.get_user_by_id(user_id)
    if user_data:
        return User(user_data)
    return None

# Add error handlers
@app.errorhandler(413)
def request_entity_too_large(error):
    from flask import flash, redirect, url_for
    flash('File too large. Maximum size is 500MB.', 'error')
    return redirect(url_for('upload'))

@app.errorhandler(400)
def bad_request_error(error):
    from flask import flash, redirect, url_for, request
    flash('Bad request. Please check your input and try again.', 'error')
    return redirect(request.referrer or url_for('index'))

# Import routes
import routes
