document.addEventListener('DOMContentLoaded', (event) => {
    const viewButton = document.getElementById('viewButton');
    const ptwNumberSelect = $('#ptwNumber');
    const ptwDetailsDiv = document.getElementById('ptwDetails');

    
    // Initialize Select2
    ptwNumberSelect.select2({
        placeholder: "Select a PTW number",
        allowClear: true
    });

    document.getElementById('backButton').addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    // Fetch all PTW numbers from all collections and populate the select box
    const collections = [
        'Confined Space PTW Extension', 'Confined Space PTW Issue', 'Confined Space PTW Termination',
        'Electrical PTW Extension', 'Electrical PTW Issue', 'Electrical PTW Termination',
        'Excavation PTW Extension', 'Excavation PTW Issue', 'Excavation PTW Termination',
        'General PTW Extension', 'General PTW Issue', 'General PTW Termination',
        'Height PTW Extension', 'Height PTW Issue', 'Height PTW Termination',
        'Hot Work PTW Extension', 'Hot Work PTW Issue', 'Hot Work PTW Termination'
    ];

    collections.forEach(collection => {
        db.collection(collection).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const docId = doc.id;
                ptwNumberSelect.append(new Option(docId, `${collection}:${docId}`));
            });
        });
    });

    viewButton.addEventListener('click', () => {
        const selectedValue = ptwNumberSelect.val();
        if (selectedValue) {
            const [collection, docId] = selectedValue.split(':');
            fetchPtwDetails(collection, docId);
        } else {
            ptwDetailsDiv.innerHTML = '<p>Please select a PTW Number.</p>';
        }
    });

    function fetchPtwDetails(collection, docId) {
        db.collection(collection).doc(docId).get().then((doc) => {
            if (doc.exists) {
                const ptwData = doc.data();
                const formImageUrl = ptwData.formImageUrl;
                if (formImageUrl) {
                    ptwDetailsDiv.innerHTML = `
                        <p>Form Image URL: <a href="${formImageUrl}" target="_blank">${formImageUrl}</a></p>
                        <button id="copyButton">Copy URL</button>
                    `;
                    document.getElementById('copyButton').addEventListener('click', () => {
                        navigator.clipboard.writeText(formImageUrl).then(() => {
                            alert('URL copied to clipboard');
                        }).catch(err => {
                            console.error('Error copying URL:', err);
                        });
                    });
                } else {
                    ptwDetailsDiv.innerHTML = '<p>No form image URL found for the given PTW number.</p>';
                }
            } else {
                ptwDetailsDiv.innerHTML = '<p>No PTW found with the given number.</p>';
            }
        }).catch((error) => {
            console.error('Error fetching PTW details:', error);
            ptwDetailsDiv.innerHTML = '<p>Error fetching PTW details. Please try again later.</p>';
        });
    }
});
