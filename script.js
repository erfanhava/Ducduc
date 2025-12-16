// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const flipCameraBtn = document.getElementById('flipCamera');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const closePreview = document.getElementById('closePreview');
const filterButtons = document.querySelectorAll('.filter-btn');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const batchBtn = document.getElementById('batchBtn');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeModal = document.getElementById('closeModal');

// Camera variables
let currentStream = null;
let facingMode = 'user'; // 'user' for front, 'environment' for back
let currentFilter = 'normal';

// Filter effects (CSS filters for now - will upgrade to AI later)
const filters = {
    normal: '',
    vintage: 'sepia(0.5) contrast(1.2) brightness(0.9)',
    disco: 'hue-rotate(90deg) saturate(2)',
    argentino: 'contrast(1.3) saturate(1.2) hue-rotate(-30deg)',
    cool: 'brightness(1.1) contrast(1.1) hue-rotate(180deg) saturate(1.3)',
    warm: 'brightness(1.1) sepia(0.2) hue-rotate(-20deg) saturate(1.5)'
};

// Initialize camera
async function initCamera() {
    try {
        // Stop any existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Get camera access
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;

    } catch (err) {
        console.error("Camera error:", err);
        alert("Cannot access camera. Please check permissions.");
    }
}

// Capture photo
function capturePhoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    
    // Flip horizontally if using front camera
    if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Reset transformation
    if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    // Apply filter
    applyFilterToCanvas(currentFilter);
    
    // Show preview
    const dataUrl = canvas.toDataURL('image/jpeg');
    previewImage.src = dataUrl;
    previewContainer.style.display = 'flex';
    
    // Enable download button
    downloadBtn.disabled = false;
    downloadBtn.onclick = () => downloadImage(dataUrl);
}

// Apply filter to canvas
function applyFilterToCanvas(filterName) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Basic filter implementations (will upgrade to AI)
    switch(filterName) {
        case 'vintage':
            // Sepia-like effect
            for(let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
            break;
            
        case 'disco':
            // Color shift effect
            for(let i = 0; i < data.length; i += 4) {
                // Swap channels
                const temp = data[i];
                data[i] = data[i + 2];
                data[i + 2] = temp;
                
                // Increase saturation
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i] + (data[i] - avg) * 0.5;
                data[i + 1] = data[i + 1] + (data[i + 1] - avg) * 0.5;
                data[i + 2] = data[i + 2] + (data[i + 2] - avg) * 0.5;
            }
            break;
            
        case 'cool':
            // Cool blue tint
            for(let i = 0; i < data.length; i += 4) {
                data[i] = data[i] * 0.8;     // Reduce red
                data[i + 2] = data[i + 2] * 1.2; // Increase blue
            }
            break;
            
        case 'warm':
            // Warm orange tint
            for(let i = 0; i < data.length; i += 4) {
                data[i] = data[i] * 1.2;     // Increase red
                data[i + 1] = data[i + 1] * 1.1; // Increase green slightly
                data[i + 2] = data[i + 2] * 0.8; // Reduce blue
            }
            break;
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Download image
function downloadImage(dataUrl) {
    const link = document.createElement('a');
    link.download = `ai-camera-${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
}

// Share image (using Web Share API if available)
async function shareImage() {
    if (navigator.share) {
        try {
            canvas.toBlob(async (blob) => {
                const file = new File([blob], 'ai-camera.jpg', { type: 'image/jpeg' });
                await navigator.share({
                    files: [file],
                    title: 'AI Camera Photo',
                    text: 'Check out my AI-enhanced photo!'
                });
            });
        } catch (err) {
            console.log('Sharing cancelled or failed');
        }
    } else {
        alert('Sharing not supported on this device. Download and share manually.');
    }
}

// Event Listeners
captureBtn.addEventListener('click', capturePhoto);

flipCameraBtn.addEventListener('click', () => {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    initCamera();
});

closePreview.addEventListener('click', () => {
    previewContainer.style.display = 'none';
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update current filter
        currentFilter = btn.dataset.filter;
        
        // Apply filter to video preview
        video.style.filter = filters[currentFilter] || '';
    });
});

shareBtn.addEventListener('click', shareImage);

batchBtn.addEventListener('click', () => {
    alert('Style Grid feature coming soon! This will generate multiple AI filter variations.');
});

infoBtn.addEventListener('click', () => {
    infoModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    infoModal.style.display = 'none';
});

// Close modal when clicking outside
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
        infoModal.style.display = 'none';
    }
});

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    initCamera();
    
    // Check if browser supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera API not supported in this browser. Please use Chrome, Firefox, or Safari.');
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause camera when page is hidden
        video.pause();
    } else {
        // Resume camera when page is visible
        video.play();
    }
});