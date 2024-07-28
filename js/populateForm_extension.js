// populateForm.js

// Function to fetch and populate user names in select boxes
async function populateUserNames() {
  const usersSelectBoxes = document.querySelectorAll('select[name="extensionRequesterSignatureSelect"], select[name="extensionEhsSignatureSelect"]');
  const userUID = localStorage.getItem('userUID');

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

    // Set the logged in user as the permit issuer
    if (userUID) {
      const userDoc = await firebase.firestore().collection('users').doc(userUID).get();
      if (userDoc.exists) {
        document.getElementById('extensionIssuerName').value = userDoc.data().fullName;
      }
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// Function to fetch and populate contractor supervisors in select boxes
async function populateContractorSupervisors() {
  const contractorSupervisorSelectBox = document.getElementById('extensionContractorSupervisorSelect');

  try {
    const supervisorsSnapshot = await firebase.firestore().collection('supervisors').get();
    supervisorsSnapshot.forEach((doc) => {
      const supervisorData = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = supervisorData.name;
      contractorSupervisorSelectBox.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
  }
}

// Initialize form fields
document.addEventListener('DOMContentLoaded', async function() {
  await populateUserNames();
  await populateContractorSupervisors();
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
    document.getElementById('extensionDate').value = currentDate;
    document.getElementById('extensionTimeFrom').value = currentTime;
  });
