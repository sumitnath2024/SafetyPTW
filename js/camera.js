// camera.js

let currentStream;

function toggleCamera(useBackCamera = true) {
  const video = document.getElementById('video');
  const cameraButton = document.getElementById('cameraButton');
  const captureButton = document.getElementById('captureButton');
  const switchButton = document.getElementById('switchCameraButton');

  if (video.style.display === 'none') {
    openCamera(useBackCamera); // Pass true to open back camera by default
    video.style.display = 'block';
    captureButton.style.display = 'inline';
    cameraButton.style.display = 'none';
    switchButton.style.display = 'inline';
  } else {
    closeCamera();
    video.style.display = 'none';
    captureButton.style.display = 'none';
    cameraButton.style.display = 'inline';
    switchButton.style.display = 'none';
  }
}

function openCamera(useBackCamera = true) {
  const video = document.getElementById('video');
  const constraints = {
    video: {
      facingMode: useBackCamera ? 'environment' : 'user' // Use 'environment' for back camera and 'user' for front camera
    }
  };

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      currentStream = stream;
      video.srcObject = stream;
      video.play();
    }).catch(function(error) {
      console.error('Error accessing camera:', error);
    });
  } else {
    console.error('MediaDevices API not supported.');
  }
}

function closeCamera() {
  if (currentStream) {
    const tracks = currentStream.getTracks();
    tracks.forEach(track => track.stop());
    currentStream = null;
  }
}

function captureImage() {
  const canvas = document.getElementById('canvas');
  const video = document.getElementById('video');
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, 320, 240);
  const img = document.getElementById('capturedImage');
  img.src = canvas.toDataURL('image/png');
  img.style.display = 'block';
  video.style.display = 'none';
  document.getElementById('cameraButton').style.display = 'inline';
  document.getElementById('captureButton').style.display = 'none';
  document.getElementById('switchCameraButton').style.display = 'none';

  // Stop the video stream
  closeCamera();
}

function switchCamera() {
  const video = document.getElementById('video');
  const useBackCamera = video.getAttribute('data-use-back-camera') === 'true';
  video.setAttribute('data-use-back-camera', !useBackCamera);
  closeCamera();
  openCamera(!useBackCamera);
}
