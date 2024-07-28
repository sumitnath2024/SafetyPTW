// Function to populate General PTW Number select box
async function populateGeneralPTWNumberSelect() {
  const ptwNumberSelect = document.getElementById('generalPtwNumber');

  try {
    // Fetch PTW records with status 'Open' or 'Extended'
    const querySnapshot = await db.collection('General PTW Issue')
      .where('status', 'in', ['Open', 'Extended'])
      .get();

    querySnapshot.forEach(doc => {
      const ptwData = doc.data();
      const option = document.createElement('option');
      option.value = ptwData.ptwNumber; // Use PTW number as the value
      option.textContent = ptwData.ptwNumber;
      ptwNumberSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
  }
}

//***************************************************************************************************************


// Function to auto-generate Electrical PTW Number
async function generateElectricalPTWNumber() {
  try {
    console.log('Generating Electrical PTW Number');
    const generalPtwNumberSelect = document.getElementById('generalPtwNumber');
    const selectedGeneralPTWNumber = generalPtwNumberSelect.value;

    if (!selectedGeneralPTWNumber) {
      console.error('No General PTW Number selected');
      alert('No General PTW Number selected');
      return;
    }

    console.log(`Selected General PTW Number: ${selectedGeneralPTWNumber}`);

    // Reference to the collection
    const ptwRef = db.collection('Electrical PTW Issue');

    // Query to get the PTW documents with the selected general PTW number and "-EL-"
    const snapshot = await ptwRef.where('ptwNumber', '>=', `${selectedGeneralPTWNumber}-EL-`)
                                 .where('ptwNumber', '<', `${selectedGeneralPTWNumber}-EM`)
                                 .orderBy('ptwNumber', 'desc')
                                 .get();
    
    console.log('Query executed, processing results');

    let newPTWNumber = `${selectedGeneralPTWNumber}-EL-1`; // Default if no documents found

    if (!snapshot.empty) {
      let highestNumber = 0;
      snapshot.forEach(doc => {
        const ptwNumberParts = doc.data().ptwNumber.split('-EL-');
        if (ptwNumberParts.length === 2) {
          const numberPart = parseInt(ptwNumberParts[1]);
          if (!isNaN(numberPart) && numberPart > highestNumber) {
            highestNumber = numberPart;
          }
        }
      });
      newPTWNumber = `${selectedGeneralPTWNumber}-EL-${highestNumber + 1}`; // Generate new PTW number
    }

    console.log(`Generated new PTW Number: ${newPTWNumber}`);

    const ptwNumberElement = document.getElementById('ptwNumber');
    if (ptwNumberElement) {
      ptwNumberElement.value = newPTWNumber; // Set the new PTW number
      ptwNumberElement.parentElement.style.display = 'block'; // Show the PTW Number field
      console.log('New PTW Number set in the input field');
    }
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
    alert('Error fetching Electrical PTW Numbers: ' + error.message);
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

async function checkUserRole() {
  try {
    const user = firebase.auth().currentUser; // Get the current logged-in user
    const userEmail = user.email; // Extract the email from the user object

    // Query the Firestore database for the user document with the specific email
    const userDoc = await db.collection('users').where('email', '==', userEmail).get();

    if (userDoc.empty) {
      console.error('No user found with the provided email.');
      return false;
    }

    // Assuming there's only one document matching the email
    const userData = userDoc.docs[0].data();
    return userData.role === 'Electrical';
  } catch (error) {
    console.error('Error checking user role: ', error);
    return false;
  }
}

//*******************************************************************************************************************

async function saveElectricalPTWFormData(event) {
  event.preventDefault();

const isAuthorized = await checkUserRole();
  if (!isAuthorized) {
    alert('You do not have permission to submit this PTW.');
    return;
  }


  if (!confirm('Do you want to generate the Electrical PTW?')) {
    return;
  }

  const ptwForm = document.getElementById('ptwForm');
  if (!ptwForm) {
    console.error('Form element not found');
    alert('Form element not found');
    return;
  }

  showLoading();

  try {
    const getSelectText = (element) => {
      const selectElement = ptwForm[element];
      if (selectElement && selectElement.options) {
        return selectElement.options[selectElement.selectedIndex].text;
      }
      return '';
    };

    const getRadioValue = (name) => {
      const radios = document.getElementsByName(name);
      for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
          return radios[i].value;
        }
      }
      return ''; // Return an empty string if no radio button is selected
    };

    const formData = {
      requesterSignature: document.getElementById('requesterSignatureCanvas')?.toDataURL() || '',
      issuerSignature: document.getElementById('issuerSignatureCanvas')?.toDataURL() || '',
      ehsSignature: document.getElementById('ehsSignatureCanvas')?.toDataURL() || '',
      contractorSupervisorSignature: document.getElementById('contractorSupervisorSignatureCanvas')?.toDataURL() || '',
      status: 'Open',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Iterate through all form elements and add them to formData
    const elements = ptwForm.elements;
    if (!elements) {
      throw new Error('Form elements not found');
    }

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
      } else if (element.type === 'radio') {
        formData[element.name] = getRadioValue(element.name);
      } else if (element.type !== 'button' && element.type !== 'submit') {
        formData[element.id] = element.value;
      }
    }

    const ptwNumber = formData.ptwNumber;

    const docRef = db.collection('Electrical PTW Issue').doc(ptwNumber);
    await docRef.set(formData);

    const captureSection = document.getElementById('capture-section');
    if (!captureSection) {
      throw new Error('Capture section element not found');
    }

    html2canvas(captureSection, { useCORS: true, scale: 2 }).then(async (canvas) => {
      canvas.toBlob(async (blob) => {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`electrical_ptw_forms/${ptwNumber}.jpeg`);
        await fileRef.put(blob);

        const downloadURL = await fileRef.getDownloadURL();
        await docRef.update({ formImageUrl: downloadURL });

        ptwForm.reset();
        hideLoading();
        alert('Electrical PTW successfully submitted with ID: ' + ptwNumber);

        // Redirect to ptw_share.html with image URL
        window.location.href = `ptw_share.html?imageUrl=${encodeURIComponent(downloadURL)}`;

      }, 'image/jpeg', 0.5);
    }).catch(error => {
      console.error('Error capturing PTW form image: ', error);
      hideLoading();
      alert('Error capturing PTW form image: ' + error.message);
    });
  } catch (error) {
    console.error('Error adding Electrical PTW form data: ', error);
    hideLoading();
    alert('Error submitting Electrical PTW: ' + error.message);
  }
}

// Attach the event listener to the form submission
document.getElementById('ptwForm').addEventListener('submit', saveElectricalPTWFormData);


//*******************************************************************************************************************

// Initialize select2 for the general PTW number dropdown
$(document).ready(function() {
  $('#generalPtwNumber').select2({
    placeholder: 'Select General PTW Number',
    allowClear: true
  });

  // Set up the change event listener for generalPtwNumber
  $('#generalPtwNumber').on('change', handleGeneralPtwNumberSelection);
});

function handleGeneralPtwNumberSelection() {
  const selectedValue = $('#generalPtwNumber').val();
  if (selectedValue) {
     generateElectricalPTWNumber();
  }
}

// Call functions when document is ready
document.addEventListener('DOMContentLoaded', function() {
  populateGeneralPTWNumberSelect();
  handleGeneralPtwNumberSelection();
  saveElectricalPTWFormData(); // Save PTW form data on form submission
});
