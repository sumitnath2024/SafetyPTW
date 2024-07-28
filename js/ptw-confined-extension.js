// Function to populate PTW Number select box
async function populatePTWNumberSelect() {
  const ptwNumberSelect = document.getElementById('ptwNumber');

  try {
    // Fetch PTW records with status 'Open' or 'Extended'
    const querySnapshot = await db.collection('Confined Space PTW Issue')
      .where('status', 'in', ['Open', 'Extended'])
      .get();

    querySnapshot.forEach(doc => {
      const ptwData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id; // Use document ID as the value
      option.textContent = ptwData.ptwNumber;
      ptwNumberSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
  }
}

//************************************************************************************************************************************************************

// Function to fetch PTW details and check for extensions
async function fetchPTWDetails() {
  const ptwNumberSelect = document.getElementById('ptwNumber');
  const selectedPTWId = ptwNumberSelect.value;

  if (selectedPTWId) {
    try {
      const doc = await db.collection('Confined Space PTW Issue').doc(selectedPTWId).get();

      if (doc.exists) {
        const ptwData = doc.data();
        if (ptwData.status !== 'Open' && ptwData.status !== 'Extended') {
          alert('The selected PTW is not Open or Extended.');
          return;
        }

        const issuedPtwNumber = document.getElementById('issuedPtwNumber');
        const issuedDate = document.getElementById('issuedDate');
        const issuedTimeFrom = document.getElementById('issuedTimeFrom');
        const issuedTimeTo = document.getElementById('issuedTimeTo'); 
        const issuedRequestingDepartment = document.getElementById('issuedRequestingDepartment');
	const jobDescription = document.getElementById('jobDescription');
        const issuedIssuerName = document.getElementById('issuedIssuerName');
        const generalPtwNumber = document.getElementById('generalPtwNumber');
        const issuedRequestingPersonnel = document.getElementById('issuedRequestingPersonnel');
        const issuedContractor = document.getElementById('issuedContractor');
        const issuedContractorSupervisor = document.getElementById('issuedContractorSupervisor');

        if (issuedPtwNumber) issuedPtwNumber.value = ptwData.ptwNumber || '';
        if (issuedDate) issuedDate.value = ptwData.date || '';
        if (issuedTimeFrom) issuedTimeFrom.value = ptwData.issueTimeFrom || '';
        if (issuedTimeTo) issuedTimeTo.value = ptwData.issueTimeTo || '';
        if (issuedRequestingDepartment) issuedRequestingDepartment.value = ptwData.requestingDepartment || '';
	if (jobDescription) jobDescription.value = ptwData.jobDescription || '';
        if (issuedIssuerName) issuedIssuerName.value = ptwData.issuerName || '';
        if (generalPtwNumber) generalPtwNumber.value = ptwData.generalPtwNumber || '';
        if (issuedRequestingPersonnel) issuedRequestingPersonnel.value = ptwData.requestingPersonnel || '';
        if (issuedContractor) issuedContractor.value = ptwData.contractor || '';
        if (issuedContractorSupervisor) issuedContractorSupervisor.value = ptwData.contractorSupervisor || '';


        // Fetch company ID based on contractor name
        const contractorName = ptwData.contractor;
        const companyDoc = await db.collection('companies').where('name', '==', contractorName).get();

        if (!companyDoc.empty) {
          const companyId = companyDoc.docs[0].id;
          await fetchSupervisors(companyId); // Call fetchSupervisors with the company ID
        } else {
          console.error('Company not found for the contractor name:', contractorName);
        }

        // Enable the extend button
        document.getElementById('extendPermitBtn').disabled = false;
      }
    } catch (error) {
      console.error('Error fetching PTW details: ', error);
    }
  }
}

// Function to fetch supervisors based on the selected contractor
async function fetchSupervisors(companyId) {
  try {
    const supervisorsSelect = $('#extensionContractorSupervisorSelect');
    supervisorsSelect.empty(); // Clear existing options

    const querySnapshot = await db.collection('supervisors')
      .where('companyId', '==', companyId)
      .get();

    supervisorsSelect.append(new Option('Select Supervisor', '', true, true)); // Add default option

    querySnapshot.forEach(doc => {
      const supervisorData = doc.data();
      const option = new Option(supervisorData.name, doc.id, false, false);
      supervisorsSelect.append(option);
    });

    supervisorsSelect.val(null).trigger('change'); // Clear selection and show default option
  } catch (error) {
    console.error('Error fetching supervisors: ', error);
  }
}

//*********************************************************************************************************************************************************************

// Function to check for extensions and generate new extension number
async function checkForExtensions(ptwNumber) {
  try {
    console.log(`Checking for extensions for PTW Number: ${ptwNumber}`);

    const querySnapshot = await db.collection('Confined Space PTW Extension')
      .where('issuedPtwNumber', '==', ptwNumber)
      .get();

    console.log(`Number of extensions found: ${querySnapshot.size}`);
    let extensions = '';
    querySnapshot.forEach(doc => {
      extensions += `\nExisting Extension: ${doc.id} - ${JSON.stringify(doc.data())}`;
    });
    if (extensions) {
      console.log(`Existing extensions:\n${extensions}`);
    } else {
      console.log('No existing extensions found.');
    }

    const extensionCount = querySnapshot.size;
    const newExtensionNumber = `${ptwNumber}-Ext-${extensionCount + 1}`;
    document.getElementById('extensionNumber').value = newExtensionNumber;
    console.log(`New extension number generated: ${newExtensionNumber}`);
    document.getElementById('extensionSection').classList.remove('hidden');
  } catch (error) {
    console.error('Error checking for extensions: ', error);
    alert(`Error checking for extensions: ${error.message}`);
    document.getElementById('extensionNumber').value = `${ptwNumber}/Ext-1`;
    document.getElementById('extensionSection').classList.remove('hidden');
  }
}

// Event listener for the extend button
document.getElementById('extendPermitBtn').addEventListener('click', function() {
  const ptwNumber = document.getElementById('issuedPtwNumber').value;
  if (ptwNumber) {
    checkForExtensions(ptwNumber);
  } else {
    alert('Please select a PTW Number first.');
  }
});


//***************************************************************************************************************************************************

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}


//***************************************************************************************************************************************************


async function saveConfinedSpaceExtensionFormData(event) {
  event.preventDefault();

  if (!confirm('Do you want to generate the Confined Space PTW?')) {
    return;
  }

  const ptwForm = document.getElementById('ptwForm');
  showLoading();

  try {
    const getSelectText = (element) => {
      const selectElement = ptwForm[element];
      if (selectElement && selectElement.options) {
        return selectElement.options[selectElement.selectedIndex].text;
      }
      return '';
    };

    const selectedPTWId = document.getElementById('ptwNumber') ? document.getElementById('ptwNumber').value : '';

    const formData = {
      requesterSignature: document.getElementById('extensionRequesterSignatureCanvas') ? document.getElementById('extensionRequesterSignatureCanvas').toDataURL() : '',
      issuerSignature: document.getElementById('extensionIssuerSignatureCanvas') ? document.getElementById('extensionIssuerSignatureCanvas').toDataURL() : '',
      ehsSignature: document.getElementById('extensionEhsSignatureCanvas') ? document.getElementById('extensionEhsSignatureCanvas').toDataURL() : '',
      contractorSupervisorSignature: document.getElementById('extensionContractorSupervisorSignatureCanvas') ? document.getElementById('extensionContractorSupervisorSignatureCanvas').toDataURL() : '',
      status: 'Extended',
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
        formData[element.id] = element.value || '';
      }
    }

    const ptwNumber = formData.extensionNumber;

    const docRef = db.collection('Confined Space PTW Extension').doc(ptwNumber);
    await docRef.set(formData);

    // Update the status of the Confined Space PTW Issue to 'Extended'
    if (selectedPTWId) {
      await db.collection('Confined Space PTW Issue').doc(selectedPTWId).update({ status: 'Extended' });
      console.log('Confined Space PTW status updated to Extended');
    }


const captureSection = document.getElementById('captureSection');
    if (captureSection) {
      html2canvas(captureSection, { useCORS: true, scale: 2 }).then(async (canvas) => {
        canvas.toBlob(async (blob) => {
          const storageRef = firebase.storage().ref();
          const fileRef = storageRef.child(`confined_space_ptw_forms/${ptwNumber}.jpeg`);
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

// Attach the event listener to the form submission
document.getElementById('ptwForm').addEventListener('submit', saveConfinedSpaceExtensionFormData);


//*******************************************************************************************************************************************************************

// Call functions when document is ready
document.addEventListener('DOMContentLoaded', function() {
  populatePTWNumberSelect(); // Populate PTW Number select box on page load
  document.getElementById('ptwNumber').addEventListener('change', fetchPTWDetails); // Fetch PTW details on selection change
});

// Initialize Select2 and set up event listeners
$(document).ready(function() {
  $('#ptwNumber').select2({
    placeholder: 'Select PTW Number',
    allowClear: true
  });

  // Fetch PTW details on selection change
  $('#ptwNumber').on('change', fetchPTWDetails);
});
