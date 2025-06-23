// Upload Form Enhancement JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressContainer = document.getElementById('uploadProgress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    
    // File input change handler
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            validateFile(file);
        }
    });
    
    // Form submit handler
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission
        
        console.log('Form submission started');
        console.log('Files:', fileInput.files);
        console.log('File input value:', fileInput.value);
        
        const file = fileInput.files[0];
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        
        if (!file) {
            console.log('No file selected');
            showAlert('Please select a video file', 'error');
            return;
        }
        
        if (!title) {
            showAlert('Title is required', 'error');
            return;
        }
        
        console.log('File selected:', file.name, file.size);
        
        if (!validateFile(file)) {
            console.log('File validation failed');
            return;
        }
        
        console.log('File validation passed, submitting via FormData');
        
        // Use FormData and fetch for better control
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('file', file);
        
        console.log('FormData created, sending request');
        
        // Show upload progress
        showUploadProgress();
        disableForm();
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('Response received:', response.status);
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                return response.text();
            }
        })
        .then(html => {
            if (html) {
                document.open();
                document.write(html);
                document.close();
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showAlert('Upload failed. Please try again.', 'error');
            enableForm();
        });
    });
    
    function validateFile(file) {
        const maxSize = 500 * 1024 * 1024; // 500MB
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 
                             'video/x-flv', 'video/webm', 'video/x-matroska'];
        
        // Check file size
        if (file.size > maxSize) {
            showAlert('File size must be less than 500MB', 'error');
            fileInput.value = '';
            return false;
        }
        
        // Check file type
        if (!allowedTypes.includes(file.type) && !isValidVideoExtension(file.name)) {
            showAlert('Please select a valid video file (MP4, AVI, MOV, WMV, FLV, WebM, MKV)', 'error');
            fileInput.value = '';
            return false;
        }
        
        // Show file info
        showFileInfo(file);
        return true;
    }
    
    function isValidVideoExtension(filename) {
        const validExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return validExtensions.includes(extension);
    }
    
    function showFileInfo(file) {
        const fileSize = formatFileSize(file.size);
        const fileName = file.name;
        
        // Remove existing file info
        const existingInfo = document.querySelector('.file-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // Create file info element
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info alert alert-info mt-2';
        fileInfo.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-file-video me-2"></i>
                <div>
                    <strong>${fileName}</strong><br>
                    <small>Size: ${fileSize}</small>
                </div>
            </div>
        `;
        
        fileInput.parentNode.appendChild(fileInfo);
    }
    
    function showUploadProgress() {
        progressContainer.style.display = 'block';
        
        // Simulate progress (since we can't track real progress in standard form submission)
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) {
                progress = 90;
            }
            progressBar.style.width = progress + '%';
            
            if (progress >= 90) {
                clearInterval(interval);
                // The form submission will complete the process
            }
        }, 200);
    }
    
    function disableForm() {
        const inputs = uploadForm.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';
        uploadBtn.classList.add('loading');
    }
    
    function enableForm() {
        const inputs = uploadForm.querySelectorAll('input, textarea, button');
        inputs.forEach(input => {
            input.disabled = false;
        });
        
        uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Video';
        uploadBtn.classList.remove('loading');
        
        progressContainer.style.display = 'none';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.upload-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show upload-alert`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert alert at the top of the form
        uploadForm.insertBefore(alert, uploadForm.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    // Drag and drop functionality
    const dropZone = fileInput.parentNode;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            validateFile(files[0]);
        }
    }
    
    // Add CSS for drag and drop styling
    const style = document.createElement('style');
    style.textContent = `
        .drag-over {
            border-color: var(--primary-color) !important;
            background-color: rgba(13, 110, 253, 0.1) !important;
        }
        
        .form-control:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        }
        
        .file-info {
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});
