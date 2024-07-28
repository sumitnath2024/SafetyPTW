// populateForm.js

// Function to fetch and populate user names in select boxes
async function populateUserNames() {
  const usersSelectBoxes = document.querySelectorAll('select[name="requestingPersonnel"], select[name="requesterSignatureSelect"], select[name="ehsSignatureSelect"]');
  const userUID = localStorage.getItem('userUID');

  if (userUID) {
    try {
      const usersSnapshot = await firebase.firestore().collection('users').get();
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersSelectBoxes.forEach(selectBox => {
          const option = document.createElement('option');
          option.value = doc.id;
          option.textContent = userData.fullName;
          selectBox.appendChild(option);
        });
      });

      // Set the issuer's name in the input box
      const issuerNameInput = document.getElementById('issuerName');
      const userDoc = await firebase.firestore().collection('users').doc(userUID).get();
      if (userDoc.exists) {
        issuerNameInput.value = userDoc.data().fullName;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }
}

// Function to fetch and populate contractor names in the select box
async function populateContractors() {
  const contractorSelectBox = document.getElementById('contractor');

  try {
    const contractorsSnapshot = await firebase.firestore().collection('companies').get();
    contractorsSnapshot.forEach((doc) => {
      const contractorData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = contractorData.name;
      contractorSelectBox.appendChild(option);
    });

    // Add event listener to contractor select box to fetch supervisors when a contractor is selected
    contractorSelectBox.addEventListener('change', populateSupervisors);

  } catch (error) {
    console.error("Error fetching contractors:", error);
  }
}

// Function to fetch and populate supervisor names based on the selected contractor
async function populateSupervisors() {
  const supervisorSelectBox = document.getElementById('contractorSupervisor');
  const supervisorSignatureSelectBox = document.getElementById('contractorSupervisorsignature');
  const selectedContractorId = document.getElementById('contractor').value;

  // Clear the current supervisor options
  supervisorSelectBox.innerHTML = '<option value="">Select Supervisor</option>';
  supervisorSignatureSelectBox.innerHTML = '<option value="">Select Supervisor</option>';

  if (selectedContractorId) {
    try {
      const supervisorsSnapshot = await firebase.firestore().collection('supervisors').where('companyId', '==', selectedContractorId).get();
      supervisorsSnapshot.forEach((doc) => {
        const supervisorData = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = supervisorData.name;
        supervisorSelectBox.appendChild(option);
        supervisorSignatureSelectBox.appendChild(option.cloneNode(true)); // Append the same option to the second select box
      });
    } catch (error) {
      console.error("Error fetching supervisors:", error);
    }
  }
}

// Document ready event
document.addEventListener('DOMContentLoaded', async function() {
  await populateUserNames();
  await populateContractors();
});



document.addEventListener('DOMContentLoaded', function() {
    // Get current date and time
    const now = new Date();
    
    // Format date to ISO format (YYYY-MM-DD)
    const currentDate = now.toISOString().split('T')[0];
    
    // Format time to HH:MM (24-hour format)
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Set default values to the inputs
    document.getElementById('date').value = currentDate;
    document.getElementById('issueTimeFrom').value = currentTime;
  });
