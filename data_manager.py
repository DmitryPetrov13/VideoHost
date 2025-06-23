import json
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

class DataManager:
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, 'users.json')
        self.videos_file = os.path.join(data_dir, 'videos.json')
        self.ensure_data_dir()
        self.load_data()
    
    def ensure_data_dir(self):
        os.makedirs(self.data_dir, exist_ok=True)
    
    def load_data(self):
        # Load users
        if os.path.exists(self.users_file):
            with open(self.users_file, 'r') as f:
                self.users = json.load(f)
        else:
            self.users = {}
        
        # Load videos
        if os.path.exists(self.videos_file):
            with open(self.videos_file, 'r') as f:
                self.videos = json.load(f)
        else:
            self.videos = {}
    
    def save_users(self):
        with open(self.users_file, 'w') as f:
            json.dump(self.users, f, indent=2, default=str)
    
    def save_videos(self):
        with open(self.videos_file, 'w') as f:
            json.dump(self.videos, f, indent=2, default=str)
    
    # User methods
    def create_user(self, username, email, password):
        if self.get_user_by_username(username):
            return None, "Username already exists"
        
        if self.get_user_by_email(email):
            return None, "Email already registered"
        
        user_id = str(len(self.users) + 1)
        user = {
            'id': user_id,
            'username': username,
            'email': email,
            'password_hash': generate_password_hash(password),
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.users[user_id] = user
        self.save_users()
        return user, None
    
    def get_user_by_id(self, user_id):
        return self.users.get(str(user_id))
    
    def get_user_by_username(self, username):
        for user in self.users.values():
            if user['username'] == username:
                return user
        return None
    
    def get_user_by_email(self, email):
        for user in self.users.values():
            if user['email'] == email:
                return user
        return None
    
    def verify_password(self, user, password):
        return check_password_hash(user['password_hash'], password)
    
    # Video methods
    def create_video(self, title, description, filename, original_filename, file_size, user_id):
        video_id = str(len(self.videos) + 1)
        video = {
            'id': video_id,
            'title': title,
            'description': description,
            'filename': filename,
            'original_filename': original_filename,
            'file_size': file_size,
            'duration': None,
            'upload_date': datetime.utcnow().isoformat(),
            'views': 0,
            'user_id': str(user_id)
        }
        
        self.videos[video_id] = video
        self.save_videos()
        return video
    
    def get_video_by_id(self, video_id):
        return self.videos.get(str(video_id))
    
    def get_videos_by_user(self, user_id):
        user_videos = []
        for video in self.videos.values():
            if video['user_id'] == str(user_id):
                user_videos.append(video)
        
        # Sort by upload_date descending - handle both string and datetime objects
        def get_sort_key(video):
            upload_date = video['upload_date']
            if isinstance(upload_date, str):
                try:
                    return datetime.fromisoformat(upload_date)
                except (ValueError, TypeError):
                    return datetime.min
            elif isinstance(upload_date, datetime):
                return upload_date
            else:
                return datetime.min
        
        user_videos.sort(key=get_sort_key, reverse=True)
        return user_videos
    
    def increment_video_views(self, video_id):
        video = self.get_video_by_id(video_id)
        if video:
            video['views'] += 1
            self.save_videos()
            return video
        return None
    
    def delete_video(self, video_id):
        if str(video_id) in self.videos:
            video = self.videos.pop(str(video_id))
            self.save_videos()
            return video
        return None
    
    def get_video_file_path(self, video_id):
        video = self.get_video_by_id(video_id)
        if video:
            # Import Flask app to get the configured upload folder
            from app import app
            return os.path.join(app.config['UPLOAD_FOLDER'], video['filename'])
        return None

# Global data manager instance
data_manager = DataManager()