// Function to auto-generate PTW Number
async function generatePTWNumber() {
  try {
    const currentYear = new Date().getFullYear(); // Get the current year
    const prefix = `${currentYear}-G-`;

    // Reference to the collection
    const ptwRef = db.collection('General PTW Issue');

    // Query to get PTWs of the current year
    const snapshot = await ptwRef
      .where('ptwNumber', '>=', prefix)
      .where('ptwNumber', '<=', `${prefix}\uf8ff`)
      .orderBy('ptwNumber', 'desc')
      .limit(1)
      .get();

    let newPTWNumber = `${prefix}1`; // Default to CurrentYear-G-1 if no documents found

    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastPTWNumber = parseInt(lastDoc.data().ptwNumber.split('-')[2], 10); // Extract number part only
      if (!isNaN(lastPTWNumber)) {
        newPTWNumber = `${prefix}${lastPTWNumber + 1}`; // Generate new PTW number
      }
    }

    document.getElementById('ptwNumber').value = newPTWNumber; // Set the new PTW number
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
  }
}

//*******************************************************************************************************************

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}


//*******************************************************************************************************************

async function savePTWFormData(event) {
  event.preventDefault();

  if (!confirm('Do you want to generate the PTW?')) {
    return;
  }

  const ptwForm = document.getElementById('ptwForm');
  showLoading();

  try {
    const capturedPhoto = document.getElementById('canvas').toDataURL('image/jpeg');
    
    const getSelectText = (element) => {
      const selectElement = ptwForm[element];
      if (selectElement && selectElement.options) {
        return selectElement.options[selectElement.selectedIndex].text;
      }
      return '';
    };

    const formData = {
      capturedPhoto: capturedPhoto,
      requesterSignature: document.getElementById('requesterSignatureCanvas').toDataURL(),
      issuerSignature: document.getElementById('issuerSignatureCanvas').toDataURL(),
      ehsSignature: document.getElementById('ehsSignatureCanvas').toDataURL(),
      contractorSupervisorSignature: document.getElementById('contractorSupervisorSignatureCanvas').toDataURL(),
      status: 'Open',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Iterate through all form elements and add them to formData
    const elements = ptwForm.elements;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.tagName === 'SELECT') {
        formData[element.id] = getSelectText(element.id);
      } else if (element.type === 'checkbox') {
        if (!formData[element.name]) {
          formData[element.name] = [];
        }
        if (element.checked) {
          formData[element.name].push(element.value);
        }
      } else if (element.type !== 'button' && element.type !== 'submit') {
        formData[element.id] = element.value;
      }
    }

    const ptwNumber = formData.ptwNumber;

    const docRef = db.collection('General PTW Issue').doc(ptwNumber);
    await docRef.set(formData);

    const captureSection = document.getElementById('captureSection');
    if (captureSection) {
      html2canvas(captureSection, { useCORS: true, scale: 2 }).then(async (canvas) => {
        canvas.toBlob(async (blob) => {
          const storageRef = firebase.storage().ref();
          const fileRef = storageRef.child(`general_ptw_forms/${ptwNumber}.jpeg`);
          await fileRef.put(blob);

          const downloadURL = await fileRef.getDownloadURL();
          await docRef.update({ formImageUrl: downloadURL });

          ptwForm.reset();
          hideLoading();
          alert('PTW successfully submitted with ID: ' + ptwNumber);

          // Redirect to ptw_share.html with image URL
          window.location.href = `ptw_share.html?imageUrl=${encodeURIComponent(downloadURL)}`;

        }, 'image/jpeg', 0.5);
      }).catch(error => {
        console.error('Error capturing PTW form image: ', error);
        hideLoading();
        alert('Error capturing PTW form image: ' + error.message);
      });
    } else {
      throw new Error('Capture section element not found');
    }
  } catch (error) {
    console.error('Error adding PTW form data: ', error);
    hideLoading();
    alert('Error submitting PTW: ' + error.message);
  }
}


//*************************************************************************************************************************


// Call functions when document is ready
document.addEventListener('DOMContentLoaded', function() {
  generatePTWNumber(); // Auto-generate PTW number on page load

  // Attach event listener to the form's submit event
  const ptwForm = document.getElementById('ptwForm');
  ptwForm.addEventListener('submit', savePTWFormData);
});
