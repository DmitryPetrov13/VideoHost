import os
import secrets
from flask import render_template, request, redirect, url_for, flash, send_file, abort
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from app import app, User
from data_manager import data_manager
from datetime import datetime

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'}

def allowed_file(filename):
    if not filename or '.' not in filename:
        return False
    try:
        extension = filename.rsplit('.', 1)[1].lower()
        return extension in ALLOWED_EXTENSIONS
    except (IndexError, AttributeError):
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        # Validation
        if not username or not email or not password:
            flash('All fields are required', 'error')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('register.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long', 'error')
            return render_template('register.html')
        
        # Create new user
        user_data, error = data_manager.create_user(username, email, password)
        
        if error:
            flash(error, 'error')
            return render_template('register.html')
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user_data = data_manager.get_user_by_username(username)
        
        if user_data and data_manager.verify_password(user_data, password):
            user = User(user_data)
            login_user(user)
            flash('Logged in successfully!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    videos = data_manager.get_videos_by_user(current_user.id)
    # Convert datetime strings back to datetime objects for template formatting
    for video in videos:
        if isinstance(video['upload_date'], str):
            video['upload_date'] = datetime.fromisoformat(video['upload_date'])
    return render_template('dashboard.html', videos=videos)

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST':
        try:
            title = request.form.get('title', '').strip()
            description = request.form.get('description', '').strip()
            
            app.logger.debug(f"Form data: title='{title}', files={list(request.files.keys())}")
            app.logger.debug(f"Request content type: {request.content_type}")
            app.logger.debug(f"Request content length: {request.content_length}")
            app.logger.debug(f"All form data: {dict(request.form)}")
            app.logger.debug(f"Request method: {request.method}")
            app.logger.debug(f"Request headers: {dict(request.headers)}")
            
            if 'file' not in request.files:
                app.logger.debug("No 'file' key in request.files")
                app.logger.debug(f"Available keys: {list(request.files.keys())}")
                flash('No file selected', 'error')
                return render_template('upload.html')
            
            file = request.files['file']
            app.logger.debug(f"File object: {file}, filename: {file.filename}")
            
            if not file or file.filename == '':
                app.logger.debug("File is empty or has no filename")
                flash('No file selected', 'error')
                return render_template('upload.html')
            
            if not title:
                flash('Title is required', 'error')
                return render_template('upload.html')
            
            if file and allowed_file(file.filename):
                # Extract extension from original filename before securing it
                if '.' not in file.filename:
                    flash('File must have an extension', 'error')
                    return render_template('upload.html')
                
                file_extension = file.filename.rsplit('.', 1)[1].lower()
                
                # Generate secure filename but preserve extension
                original_filename = secure_filename(file.filename)
                if not original_filename:
                    # If secure_filename removes everything, create a basic name
                    original_filename = f"upload.{file_extension}"
                
                filename = f"{secrets.token_hex(16)}.{file_extension}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                try:
                    # Check upload directory permissions before saving
                    upload_dir = app.config['UPLOAD_FOLDER']
                    app.logger.debug(f"Upload directory: {upload_dir}")
                    app.logger.debug(f"Directory exists: {os.path.exists(upload_dir)}")
                    app.logger.debug(f"Directory writable: {os.access(upload_dir, os.W_OK)}")
                    app.logger.debug(f"File path: {file_path}")
                    
                    # Ensure directory exists
                    os.makedirs(upload_dir, exist_ok=True)
                    
                    file.save(file_path)
                    file_size = os.path.getsize(file_path)
                    
                    app.logger.debug(f"File saved successfully, size: {file_size}")
                    
                    # Create video record
                    video = data_manager.create_video(
                        title=title,
                        description=description,
                        filename=filename,
                        original_filename=original_filename,
                        file_size=file_size,
                        user_id=current_user.id
                    )
                    
                    app.logger.debug(f"Video record created: {video}")
                    flash('Video uploaded successfully!', 'success')
                    return redirect(url_for('dashboard'))
                
                except Exception as e:
                    # Clean up file if save fails
                    if os.path.exists(file_path):
                        try:
                            os.remove(file_path)
                        except:
                            pass
                    flash('Upload failed. Please try again.', 'error')
                    app.logger.error(f"Upload error: {str(e)}")
                    app.logger.error(f"Upload directory: {app.config['UPLOAD_FOLDER']}")
                    app.logger.error(f"Current working directory: {os.getcwd()}")
                    import traceback
                    app.logger.error(f"Full traceback: {traceback.format_exc()}")
            else:
                flash('Invalid file type. Please upload a video file.', 'error')
        
        except Exception as e:
            app.logger.error(f"Upload route error: {str(e)}")
            flash('Upload failed. Please try again.', 'error')
    
    return render_template('upload.html')

@app.route('/player/<int:video_id>')
def player(video_id):
    video = data_manager.get_video_by_id(video_id)
    if not video:
        abort(404)
    
    # Get video owner info
    owner = data_manager.get_user_by_id(video['user_id'])
    video['owner'] = owner
    
    # Convert datetime string for template
    if isinstance(video['upload_date'], str):
        video['upload_date'] = datetime.fromisoformat(video['upload_date'])
    
    # Increment views
    data_manager.increment_video_views(video_id)
    
    return render_template('player.html', video=video)

@app.route('/watch/<int:video_id>')
def watch_direct(video_id):
    """Direct link to video player page with minimal UI"""
    video = data_manager.get_video_by_id(video_id)
    if not video:
        abort(404)
    
    # Get video owner info
    owner = data_manager.get_user_by_id(video['user_id'])
    video['owner'] = owner
    
    # Convert datetime string for template
    if isinstance(video['upload_date'], str):
        video['upload_date'] = datetime.fromisoformat(video['upload_date'])
    
    # Increment views
    data_manager.increment_video_views(video_id)
    
    return render_template('watch.html', video=video)

@app.route('/video/<int:video_id>')
def serve_video(video_id):
    video = data_manager.get_video_by_id(video_id)
    if not video:
        app.logger.error(f"Video {video_id} not found in database")
        abort(404)
    
    file_path = data_manager.get_video_file_path(video_id)
    app.logger.debug(f"Serving video {video_id} from path: {file_path}")
    app.logger.debug(f"File exists: {os.path.exists(file_path)}")
    
    if not os.path.exists(file_path):
        app.logger.error(f"Video file not found at path: {file_path}")
        abort(404)
    
    try:
        return send_file(file_path, mimetype='video/mp4')
    except Exception as e:
        app.logger.error(f"Error serving video {video_id}: {str(e)}")
        abort(500)

@app.route('/delete/<int:video_id>', methods=['POST'])
@login_required
def delete_video(video_id):
    video = data_manager.get_video_by_id(video_id)
    if not video:
        abort(404)
    
    # Check if user owns the video
    if video['user_id'] != current_user.id:
        abort(403)
    
    try:
        # Delete file from filesystem
        file_path = data_manager.get_video_file_path(video_id)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete from data
        data_manager.delete_video(video_id)
        
        flash('Video deleted successfully!', 'success')
    except Exception as e:
        flash('Failed to delete video. Please try again.', 'error')
        app.logger.error(f"Delete error: {str(e)}")
    
    return redirect(url_for('dashboard'))

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500
