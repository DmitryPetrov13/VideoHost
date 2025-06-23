// Custom Video Player JavaScript

class VideoPlayer {
    constructor(videoId) {
        this.video = document.getElementById(videoId);
        this.controls = document.getElementById('videoControls');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFilled = document.getElementById('progressFilled');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.speedBtn = document.getElementById('speedBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.loading = document.getElementById('videoLoading');
        
        this.speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
        this.currentSpeedIndex = 2; // 1x speed
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateVolumeIcon();
        this.hideLoading();
    }
    
    bindEvents() {
        // Video events
        this.video.addEventListener('loadstart', () => this.showLoading());
        this.video.addEventListener('canplay', () => this.hideLoading());
        this.video.addEventListener('loadedmetadata', () => this.updateDuration());
        this.video.addEventListener('timeupdate', () => this.updateProgress());
        this.video.addEventListener('ended', () => this.onVideoEnded());
        this.video.addEventListener('play', () => this.updatePlayButton());
        this.video.addEventListener('pause', () => this.updatePlayButton());
        this.video.addEventListener('waiting', () => this.showLoading());
        this.video.addEventListener('playing', () => this.hideLoading());
        
        // Control events
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', () => this.changeVolume());
        this.speedBtn.addEventListener('click', () => this.changeSpeed());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Click to play/pause
        this.video.addEventListener('click', () => this.togglePlay());
        
        // Hide controls on mouse leave for custom player
        const playerContainer = this.video.closest('.custom-video-player');
        if (playerContainer) {
            playerContainer.addEventListener('mouseleave', () => {
                if (!this.video.paused) {
                    this.hideControlsDelayed();
                }
            });
            
            playerContainer.addEventListener('mouseenter', () => {
                this.clearHideControlsTimeout();
                playerContainer.classList.add('show-controls');
            });
            
            playerContainer.addEventListener('mouseleave', () => {
                playerContainer.classList.remove('show-controls');
            });
        }
    }
    
    togglePlay() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }
    
    updatePlayButton() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.video.paused) {
            icon.className = 'fas fa-play';
        } else {
            icon.className = 'fas fa-pause';
        }
    }
    
    updateProgress() {
        const progress = (this.video.currentTime / this.video.duration) * 100;
        this.progressFilled.style.width = `${progress}%`;
        this.updateCurrentTime();
    }
    
    updateCurrentTime() {
        this.currentTimeEl.textContent = this.formatTime(this.video.currentTime);
    }
    
    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.video.duration);
    }
    
    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        this.video.currentTime = percentage * this.video.duration;
    }
    
    toggleMute() {
        this.video.muted = !this.video.muted;
        this.updateVolumeIcon();
        this.volumeSlider.value = this.video.muted ? 0 : this.video.volume * 100;
    }
    
    changeVolume() {
        const volume = this.volumeSlider.value / 100;
        this.video.volume = volume;
        this.video.muted = volume === 0;
        this.updateVolumeIcon();
    }
    
    updateVolumeIcon() {
        const icon = this.volumeBtn.querySelector('i');
        if (this.video.muted || this.video.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (this.video.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    changeSpeed() {
        this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speeds.length;
        const speed = this.speeds[this.currentSpeedIndex];
        this.video.playbackRate = speed;
        this.speedBtn.textContent = `${speed}x`;
    }
    
    toggleFullscreen() {
        const player = this.video.closest('.custom-video-player');
        
        if (!document.fullscreenElement) {
            if (player.requestFullscreen) {
                player.requestFullscreen();
            } else if (player.webkitRequestFullscreen) {
                player.webkitRequestFullscreen();
            } else if (player.msRequestFullscreen) {
                player.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    onVideoEnded() {
        this.updatePlayButton();
        this.progressFilled.style.width = '100%';
    }
    
    handleKeyboard(e) {
        // Only handle keyboard shortcuts when video player is focused or hovered
        const playerContainer = this.video.closest('.custom-video-player');
        if (!playerContainer.matches(':hover') && document.activeElement !== this.video) {
            return;
        }
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.video.currentTime = Math.max(0, this.video.currentTime - 10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.video.volume = Math.min(1, this.video.volume + 0.1);
                this.volumeSlider.value = this.video.volume * 100;
                this.updateVolumeIcon();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.video.volume = Math.max(0, this.video.volume - 0.1);
                this.volumeSlider.value = this.video.volume * 100;
                this.updateVolumeIcon();
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'KeyF':
                e.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    showLoading() {
        this.loading.style.display = 'block';
    }
    
    hideLoading() {
        this.loading.style.display = 'none';
    }
    
    hideControlsDelayed() {
        this.hideControlsTimeout = setTimeout(() => {
            if (!this.video.paused && !this.controls.matches(':hover')) {
                this.controls.style.opacity = '0';
            }
        }, 3000);
    }
    
    clearHideControlsTimeout() {
        if (this.hideControlsTimeout) {
            clearTimeout(this.hideControlsTimeout);
        }
        this.controls.style.opacity = '1';
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('videoPlayer');
    if (video) {
        new VideoPlayer('videoPlayer');
    }
});

// Fullscreen change handler
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('msfullscreenchange', updateFullscreenButton);

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        const icon = fullscreenBtn.querySelector('i');
        if (document.fullscreenElement) {
            icon.className = 'fas fa-compress';
        } else {
            icon.className = 'fas fa-expand';
        }
    }
}
