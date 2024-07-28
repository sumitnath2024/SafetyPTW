document.addEventListener('DOMContentLoaded', function() {
  populatePTWNumberSelect();
  document.getElementById('airMonitoringForm').addEventListener('submit', saveAirMonitoringData);
  $('#ptwNumber').on('select2:select', fetchPreviousReadings);
});

async function populatePTWNumberSelect() {
  const ptwNumberSelect = document.getElementById('ptwNumber');

  try {
    const issueSnapshot = await db.collection('Confined Space PTW Issue')
      .where('status', 'in', ['Open', 'Extended'])
      .get();

    for (const doc of issueSnapshot.docs) {
      const ptwData = doc.data();
      let option;
      if (ptwData.status === 'Open') {
        option = document.createElement('option');
        option.value = doc.id;
        option.textContent = ptwData.ptwNumber;
        ptwNumberSelect.appendChild(option);
      } else if (ptwData.status === 'Extended') {
        const highestExtension = await getHighestExtension(ptwData.ptwNumber);
        if (highestExtension) {
          option = document.createElement('option');
          option.value = highestExtension.docId;
          option.textContent = highestExtension.extensionNumber;
          ptwNumberSelect.appendChild(option);
        }
      }
    }

    initializeSelect2();
  } catch (error) {
    console.error('Error fetching PTW numbers: ', error);
  }
}

async function getHighestExtension(ptwNumber) {
  const extensionSnapshot = await db.collection('Confined Space PTW Extension')
    .where('ptwNumber', '==', ptwNumber)
    .get();

  if (!extensionSnapshot.empty) {
    let extensions = [];
    extensionSnapshot.forEach(doc => {
      extensions.push({
        docId: doc.id,
        extensionNumber: doc.data().extensionNumber
      });
    });

    extensions.sort((a, b) => b.extensionNumber.localeCompare(a.extensionNumber));
    return extensions[0];
  } else {
    return null;
  }
}

function initializeSelect2() {
  $('#ptwNumber').select2({
    placeholder: 'Select PTW Number',
    allowClear: true
  });
}

function addRow() {
  const table = document.getElementById('airMonitoringTable');
  const tbody = table.getElementsByTagName('tbody')[0];
  const newRow = tbody.insertRow();

  const slNoCell = newRow.insertCell(0);
  const timeCell = newRow.insertCell(1);
  const monitoringPersonCell = newRow.insertCell(2);
  const dateCell = newRow.insertCell(3);
  const oxygenCell = newRow.insertCell(4);
  const lelCell = newRow.insertCell(5);

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });

  slNoCell.textContent = tbody.rows.length;
  timeCell.innerHTML = `<input type="text" name="time[]" value="${currentTime}" readonly>`;
  monitoringPersonCell.innerHTML = `<input type="text" name="monitoringPerson[]" value="${document.getElementById('issuerName').value}" readonly>`;
  dateCell.innerHTML = `<input type="text" name="date[]" value="${currentDate}" readonly>`;
  oxygenCell.innerHTML = '<input type="text" name="oxygen[]">';
  lelCell.innerHTML = '<input type="text" name="lel[]">';

  table.style.display = 'table';
}

async function fetchPreviousReadings() {
  const ptwNumber = document.getElementById('ptwNumber').value;
  if (!ptwNumber) return;

  const table = document.getElementById('airMonitoringTable');
  const tbody = table.getElementsByTagName('tbody')[0];
  tbody.innerHTML = ''; // Clear existing rows

  try {
    const snapshot = await db.collection('Confined Space Air Monitoring')
      .where('ptwNumber', '==', ptwNumber)
      .get();

    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        const data = doc.data();
        data.readings.forEach((reading, index) => {
          const newRow = tbody.insertRow();
          const slNoCell = newRow.insertCell(0);
          const timeCell = newRow.insertCell(1);
          const monitoringPersonCell = newRow.insertCell(2);
          const dateCell = newRow.insertCell(3);
          const oxygenCell = newRow.insertCell(4);
          const lelCell = newRow.insertCell(5);

          slNoCell.textContent = index + 1;
          timeCell.innerHTML = `<input type="text" name="time[]" value="${reading.time}" readonly>`;
          monitoringPersonCell.innerHTML = `<input type="text" name="monitoringPerson[]" value="${data.monitoringPersonnel}" readonly>`;
          dateCell.innerHTML = `<input type="text" name="date[]" value="${new Date(data.createdAt.toDate()).toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })}" readonly>`;
          oxygenCell.innerHTML = `<input type="text" name="oxygen[]" value="${reading.oxygen}">`;
          lelCell.innerHTML = `<input type="text" name="lel[]" value="${reading.lel}">`;
        });
      });

      table.style.display = 'table';
    }
  } catch (error) {
    console.error('Error fetching previous readings: ', error);
  }
}

async function saveAirMonitoringData(event) {
  event.preventDefault();

  const form = document.getElementById('airMonitoringForm');
  const ptwNumber = form.ptwNumber.value;
  const monitoringPersonnel = "";
  const times = Array.from(form.querySelectorAll('input[name="time[]"]')).map(input => input.value);
  const monitoringPersons = Array.from(form.querySelectorAll('input[name="monitoringPerson[]"]')).map(input => input.value);
  const dates = Array.from(form.querySelectorAll('input[name="date[]"]')).map(input => input.value);
  const oxygens = Array.from(form.querySelectorAll('input[name="oxygen[]"]')).map(input => input.value);
  const lels = Array.from(form.querySelectorAll('input[name="lel[]"]')).map(input => input.value);

  const readings = times.map((time, index) => ({
    time,
    monitoringPerson: monitoringPersons[index],
    date: dates[index],
    oxygen: oxygens[index],
    lel: lels[index]
  }));

  const formData = {
    ptwNumber,
    monitoringPersonnel,
    readings,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('Confined Space Air Monitoring').doc(ptwNumber).set(formData, { merge: true });
    alert('Air Monitoring Data successfully submitted');
    fetchPreviousReadings(); // Refresh the table with the updated data
  } catch (error) {
    console.error('Error submitting Air Monitoring Data: ', error);
    alert('Error submitting Air Monitoring Data: ' + error.message);
  }
}
