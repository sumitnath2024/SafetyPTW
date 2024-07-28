// signatureCanvas.js

// Function to initialize signature pads
const initializeSignaturePad = (canvasId) => {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  let drawing = false;

  // Set canvas resolution to a lower value (adjust as needed)
  const resolution = 300; // Example resolution
  canvas.width = resolution;
  canvas.height = resolution;

  // Set initial background color to grey
  canvas.style.backgroundColor = "#d3d3d3";

  const getMousePos = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const getTouchPos = (canvas, touch) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    drawing = true;
    ctx.beginPath();
    const pos = e.type.includes('touch') ? getTouchPos(canvas, e.touches[0]) : getMousePos(canvas, e);
    ctx.moveTo(pos.x, pos.y);
    if (e.type.includes('touch')) e.preventDefault(); // Prevent scrolling
  };

  const draw = (e) => {
    if (!drawing) return;
    const pos = e.type.includes('touch') ? getTouchPos(canvas, e.touches[0]) : getMousePos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (e.type.includes('touch')) e.preventDefault(); // Prevent scrolling
  };

  const stopDrawing = () => {
    drawing = false;
    ctx.closePath();
  };

  // Add toggle button
  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginBottom = "10px";

  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Enable";
  toggleButton.type = "button"; // Prevents the button from submitting the form

  const enableDrawing = () => {
    canvas.style.backgroundColor = "#ffffff"; // Change background to white
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    // Touch events for mobile devices
    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);

    canvas.isDrawingEnabled = true;
    toggleButton.textContent = "Disable";
  };

  const disableDrawing = () => {
    canvas.style.backgroundColor = "#d3d3d3"; // Change background to grey
    canvas.removeEventListener("mousedown", startDrawing);
    canvas.removeEventListener("mousemove", draw);
    canvas.removeEventListener("mouseup", stopDrawing);
    canvas.removeEventListener("mouseout", stopDrawing);

    // Touch events for mobile devices
    canvas.removeEventListener("touchstart", startDrawing);
    canvas.removeEventListener("touchmove", draw);
    canvas.removeEventListener("touchend", stopDrawing);
    canvas.removeEventListener("touchcancel", stopDrawing);

    canvas.isDrawingEnabled = false;
    toggleButton.textContent = "Enable";
  };

  const toggleDrawing = () => {
    if (canvas.isDrawingEnabled) {
      disableDrawing();
    } else {
      enableDrawing();
    }
  };

  // Initialize with drawing disabled
  disableDrawing();

  toggleButton.addEventListener("click", toggleDrawing);
  buttonContainer.appendChild(toggleButton);

  canvas.parentNode.insertBefore(buttonContainer, canvas);

  // Store the state in the canvas element
  canvas.isDrawingEnabled = false;
};

// Function to clear the canvas
const clearCanvas = (canvasId) => {
  const canvas = document.getElementById(canvasId);
  if (canvas.isDrawingEnabled) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

// Expose clearCanvas to the global scope
window.clearCanvas = clearCanvas;


// Initialize all signature pads
document.addEventListener('DOMContentLoaded', () => {
  initializeSignaturePad("terminationRequesterSignatureCanvas");
  initializeSignaturePad("terminationIssuerSignatureCanvas");
  initializeSignaturePad("terminationEhsSignatureCanvas");
  initializeSignaturePad("terminationContractorSupervisorSignatureCanvas");
});
