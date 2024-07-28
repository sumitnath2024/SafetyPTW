document.addEventListener("DOMContentLoaded", function() {
  const db = firebase.firestore();

  const companyForm = document.getElementById("companyForm");
  const companiesList = document.getElementById("companies");
  const companySelect = document.getElementById("companySelect");
  const companySearch = document.getElementById("companySearch");
  const companySubmitButton = companyForm.querySelector("button[type='submit']");

  const supervisorForm = document.getElementById("supervisorForm");
  const supervisorsList = document.getElementById("supervisors");
  const supervisorSubmitButton = supervisorForm.querySelector("button[type='submit']");

  let editingCompanyId = null;
  let editingSupervisorId = null;

  $(document).ready(function() {
    $('#companySelect').select2({
      placeholder: "Select Contractor",
      allowClear: true
    }).on('select2:select', function (e) {
      const companyId = e.params.data.id;
      loadSupervisors(companyId);
    });
    loadCompanyOptions();
  });

  companyForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const companyName = document.getElementById("companyName").value;
    const companyAddress = document.getElementById("companyAddress").value;

    try {
      const companiesCollection = db.collection("companies");
      const companiesSnapshot = await companiesCollection.get();
      const companyCount = companiesSnapshot.size;
      const newCompanyId = `C-${companyCount + 1}`;

      if (editingCompanyId) {
        await companiesCollection.doc(editingCompanyId).update({
          name: companyName,
          address: companyAddress
        });
        alert("Company updated successfully!");
        editingCompanyId = null;
        companyForm.reset();
        companySubmitButton.textContent = "Add Company";
      } else {
        await companiesCollection.doc(newCompanyId).set({
          name: companyName,
          address: companyAddress
        });
        alert("Company added successfully!");
      }

      loadCompanies();
      loadCompanyOptions();
    } catch (error) {
      console.error("Error saving company: ", error);
      alert("Error saving company: " + error.message);
    }
  });

  supervisorForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    const companySelectValue = $('#companySelect').val();
    const supervisorName = document.getElementById("supervisorName").value;
    const supervisorAge = document.getElementById("supervisorAge").value;
    const supervisorAddress = document.getElementById("supervisorAddress").value;
    const supervisorIdentityProof = document.getElementById("supervisorIdentityProof").value;
    const supervisorPhoneNumber = document.getElementById("supervisorPhoneNumber").value;

    try {
      const supervisorsCollection = db.collection("supervisors");
      const supervisorsSnapshot = await supervisorsCollection.get();
      const supervisorCount = supervisorsSnapshot.size;
      const newSupervisorId = `SUP-${supervisorCount + 1}`;

      if (editingSupervisorId) {
        await supervisorsCollection.doc(editingSupervisorId).update({
          name: supervisorName,
          age: supervisorAge,
          address: supervisorAddress,
          identityProof: supervisorIdentityProof,
          phoneNumber: supervisorPhoneNumber,
          companyId: companySelectValue
        });
        alert("Supervisor updated successfully!");
        editingSupervisorId = null;
        supervisorForm.reset();
        supervisorSubmitButton.textContent = "Add Supervisor";
      } else {
        await supervisorsCollection.doc(newSupervisorId).set({
          name: supervisorName,
          age: supervisorAge,
          address: supervisorAddress,
          identityProof: supervisorIdentityProof,
          phoneNumber: supervisorPhoneNumber,
          companyId: companySelectValue
        });
        alert("Supervisor added successfully!");
      }

      loadSupervisors(companySelectValue);
    } catch (error) {
      console.error("Error saving supervisor: ", error);
      alert("Error saving supervisor: " + error.message);
    }
  });

  async function loadCompanies() {
    companiesList.innerHTML = "";

    try {
      const querySnapshot = await db.collection("companies").get();
      querySnapshot.forEach((doc) => {
        const company = doc.data();
        const companyId = doc.id;

        const companyRow = document.createElement("tr");
        companyRow.innerHTML = `
          <td>${company.name}</td>
          <td>${company.address}</td>
          <td>
            <button class="edit-btn" onclick="editCompany('${companyId}', '${company.name}', '${company.address}')">Edit</button>
            <button class="delete-btn" onclick="deleteCompany('${companyId}')">Delete</button>
          </td>
        `;
        companiesList.appendChild(companyRow);
      });
    } catch (error) {
      console.error("Error loading companies: ", error);
    }
  }

  async function loadCompanyOptions() {
    try {
      const querySnapshot = await db.collection("companies").get();
      const companies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().name
      }));

      $('#companySelect').select2({
        data: [],
        placeholder: "Select Contractor",
        allowClear: true
      }).empty().append('<option></option>'); // Ensuring the placeholder is shown

      companies.forEach(company => {
        const newOption = new Option(company.text, company.id, false, false);
        $('#companySelect').append(newOption).trigger('change');
      });

    } catch (error) {
      console.error("Error loading company options: ", error);
    }
  }

  async function loadSupervisors(companyId) {
    supervisorsList.innerHTML = "";

    try {
      const querySnapshot = await db.collection("supervisors").where("companyId", "==", companyId).get();
      querySnapshot.forEach(async (doc) => {
        const supervisor = doc.data();
        const supervisorId = doc.id;

        const companyDoc = await db.collection("companies").doc(supervisor.companyId).get();
        const companyName = companyDoc.exists ? companyDoc.data().name : "Unknown";

        const supervisorRow = document.createElement("tr");
        supervisorRow.innerHTML = `
          <td>${supervisor.name}</td>
          <td>${supervisor.age}</td>
          <td>${supervisor.address}</td>
          <td>${supervisor.identityProof}</td>
          <td>${supervisor.phoneNumber}</td>
          <td>${companyName}</td>
          <td>
            <button class="edit-btn" onclick="editSupervisor('${supervisorId}', '${supervisor.name}', ${supervisor.age}, '${supervisor.address}', '${supervisor.identityProof}', '${supervisor.phoneNumber}', '${supervisor.companyId}')">Edit</button>
            <button class="delete-btn" onclick="deleteSupervisor('${supervisorId}')">Delete</button>
          </td>
        `;
        supervisorsList.appendChild(supervisorRow);
      });
    } catch (error) {
      console.error("Error loading supervisors: ", error);
    }
  }

  window.editCompany = function(companyId, companyName, companyAddress) {
    document.getElementById("companyName").value = companyName;
    document.getElementById("companyAddress").value = companyAddress;
    editingCompanyId = companyId;
    companySubmitButton.textContent = "Update Company";
  };

  window.deleteCompany = async function(companyId) {
    try {
      await db.collection("companies").doc(companyId).delete();
      loadCompanies();
      loadCompanyOptions();
      alert("Company deleted successfully!");
    } catch (error) {
      console.error("Error deleting company: ", error);
      alert("Error deleting company: " + error.message);
    }
  };

  window.editSupervisor = function(supervisorId, supervisorName, supervisorAge, supervisorAddress, supervisorIdentityProof, supervisorPhoneNumber, companyId) {
    document.getElementById("supervisorName").value = supervisorName;
    document.getElementById("supervisorAge").value = supervisorAge;
    document.getElementById("supervisorAddress").value = supervisorAddress;
    document.getElementById("supervisorIdentityProof").value = supervisorIdentityProof;
    document.getElementById("supervisorPhoneNumber").value = supervisorPhoneNumber;
    $('#companySelect').val(companyId).trigger('change');
    editingSupervisorId = supervisorId;
    supervisorSubmitButton.textContent = "Update Supervisor";
  };

  window.deleteSupervisor = async function(supervisorId) {
    try {
      await db.collection("supervisors").doc(supervisorId).delete();
      loadSupervisors($('#companySelect').val());
      alert("Supervisor deleted successfully!");
    } catch (error) {
      console.error("Error deleting supervisor: ", error);
      alert("Error deleting supervisor: " + error.message);
    }
  };

  companySearch.addEventListener("input", function() {
    const filter = companySearch.value.toLowerCase();
    const rows = companiesList.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName("td");
      const companyName = cells[0].textContent || cells[0].innerText;
      if (companyName.toLowerCase().indexOf(filter) > -1) {
        rows[i].style.display = "";
      } else {
        rows[i].style.display = "none";
      }
    }
  });

  loadCompanies();
});
