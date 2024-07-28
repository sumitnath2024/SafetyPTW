// Function to populate PTW Number select box
async function populatePTWNumberSelect() {
  const ptwNumberSelect = document.getElementById('ptwNumber');

  try {
    // Fetch PTW records with status 'Open' or 'Extended'
    const querySnapshot = await db.collection('General PTW Issue')
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

//*****************************************************************************************************

// Function to fetch PTW details and check for extensions
async function fetchPTWDetails() {
  const ptwNumberSelect = document.getElementById('ptwNumber');
  const selectedPTWId = ptwNumberSelect.value;

  if (selectedPTWId) {
    try {
      const doc = await db.collection('General PTW Issue').doc(selectedPTWId).get();

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
      }
    } catch (error) {
      console.error('Error fetching PTW details: ', error);
    }
  }
}

//*****************************************************************************************************


// Function to fetch supervisors based on the selected contractor
async function fetchSupervisors(companyId) {
  try {
    const supervisorsSelect = $('#terminationContractorSupervisorSelect');
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

//*****************************************************************************************************


function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}


//*****************************************************************************************************


async function savePTWTerminationFormData(event) {
  event.preventDefault();

  if (!confirm('Do you want to submit the PTW Termination?')) {
    return;
  }

  const ptwForm = document.getElementById('ptwForm');
  showLoading();

  try {
    const canvasIds = [
      'terminationRequesterSignatureCanvas',
      'terminationIssuerSignatureCanvas',
      'terminationEhsSignatureCanvas',
      'terminationContractorSupervisorSignatureCanvas'
    ];

    for (const canvasId of canvasIds) {
      if (!document.getElementById(canvasId)) {
        throw new Error(`Canvas element ${canvasId} not found`);
      }
    }

    const selectedPTWId = document.getElementById('ptwNumber').value;

    const isAllRelatedPTWsClosed = await checkRelatedPTWStatuses(selectedPTWId);
    if (!isAllRelatedPTWsClosed) {
      hideLoading();
      return;
    }

    const capturedPhoto = canvas.toDataURL('image/jpeg');

    const getSelectText = (element) => {
      const selectElement = ptwForm[element];
      if (selectElement && selectElement.options) {
        return selectElement.options[selectElement.selectedIndex].text;
      }
      return '';
    };

    const formData = {
      capturedPhoto: capturedPhoto,
      requesterSignature: getSignatureDataURL('terminationRequesterSignatureCanvas'),
      issuerSignature: getSignatureDataURL('terminationIssuerSignatureCanvas'),
      ehsSignature: getSignatureDataURL('terminationEhsSignatureCanvas'),
      contractorSupervisorSignature: getSignatureDataURL('terminationContractorSupervisorSignatureCanvas'),
      status: 'Closed',
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

    // Save to Firestore
    const terminationNumber = formData.issuedPtwNumber + "-termination";
    const docRef = db.collection('General PTW Termination').doc(terminationNumber);
    await docRef.set(formData);

    // Update the status of the General PTW Issue to 'Closed'
    await db.collection('General PTW Issue').doc(selectedPTWId).update({ status: 'Closed' });
    console.log('PTW status updated to Closed');

    // Update the status of all extended permits in General PTW Extension to 'Closed'
    const extensionQuerySnapshot = await db.collection('General PTW Extension')
      .where('issuedPtwNumber', '==', formData.issuedPtwNumber)
      .where('status', '==', 'Extended')
      .get();

    const batch = db.batch();

    extensionQuerySnapshot.forEach(doc => {
      const docRef = db.collection('General PTW Extension').doc(doc.id);
      batch.update(docRef, { status: 'Closed' });
    });

    await batch.commit();
    console.log('All extended PTW statuses updated to Closed');

    const captureSection = document.getElementById('capture-section');
    html2canvas(captureSection, { useCORS: true, scale: 2 }).then(async (canvas) => {
      canvas.toBlob(async (blob) => {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`general_ptw_forms/${terminationNumber}.jpeg`);
        await fileRef.put(blob);

        const downloadURL = await fileRef.getDownloadURL();
        await docRef.update({ formImageUrl: downloadURL });

        ptwForm.reset();
        hideLoading();
        alert('General PTW successfully submitted with ID: ' + terminationNumber);

        // Redirect to ptw_share.html with image URL
        window.location.href = `ptw_share.html?imageUrl=${encodeURIComponent(downloadURL)}`;

      }, 'image/jpeg', 0.5);
    }).catch(error => {
      console.error('Error capturing General PTW form image: ', error);
      hideLoading();
      alert('Error capturing General PTW form image: ' + error.message);
    });

  } catch (error) {
    console.error('Error adding General PTW form data: ', error);
    hideLoading();
    alert('Error submitting General PTW: ' + error.message);
  }
}

async function checkRelatedPTWStatuses(generalPtwNumber) {
  const collections = [
    'Confined Space PTW Issue',
    'Electrical PTW Issue',
    'Excavation PTW Issue',
    'Height PTW Issue',
    'Hot Work PTW Issue'
  ];

  let allClosed = true;
  let notClosedPTWs = [];

  for (const collection of collections) {
    const querySnapshot = await db.collection(collection)
      .where('generalPtwNumber', '==', generalPtwNumber)
      .get();

    querySnapshot.forEach(doc => {
      if (doc.data().status !== 'Closed') {
        allClosed = false;
        notClosedPTWs.push({ collection, ptwNumber: doc.data().ptwNumber });
      }
    });
  }

  if (!allClosed) {
    const notClosedMessage = notClosedPTWs.map(ptw => `${ptw.collection}: ${ptw.ptwNumber}`).join('\n');
    alert(`The following PTWs are not closed:\n${notClosedMessage}`);
  }

  return allClosed;
}

// Helper function to get the signature data URL
function getSignatureDataURL(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element ${canvasId} not found`);
    return '';
  }
  return canvas.toDataURL();
}

// Helper function to get selected text from a select element
function getSelectText(element) {
  const selectElement = document.getElementById(element);
  if (selectElement && selectElement.options) {
    return selectElement.options[selectElement.selectedIndex].text;
  }
  return '';
}

// Attach the event listener to the form submission
document.getElementById('ptwForm').addEventListener('submit', savePTWTerminationFormData);

//*****************************************************************************************************


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
