document.getElementById('addHostForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const rate_max_hour = parseFloat(document.getElementById('rate_max_hour').value);
    const rate_max_day = parseFloat(document.getElementById('rate_max_day').value);

    const hostData = {
        name,
        email,
        rate_max_hour,
        rate_max_day
    };

    const responseDiv = document.getElementById('response');
    responseDiv.textContent = 'Submitting...';
    responseDiv.className = 'response-message';

    try {
        // Placeholder for API endpoint
        const apiEndpoint = '/api/hosts'; 
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hostData)
        });

        const result = await response.json();

        if (response.ok) {
            responseDiv.textContent = 'Host added successfully: ' + JSON.stringify(result);
            responseDiv.className = 'response-message success';
            document.getElementById('addHostForm').reset();
        } else {
            responseDiv.textContent = 'Error adding host: ' + (result.message || JSON.stringify(result));
            responseDiv.className = 'response-message error';
        }
    } catch (error) {
        responseDiv.textContent = 'Network error: ' + error.message;
        responseDiv.className = 'response-message error';
    }
});
