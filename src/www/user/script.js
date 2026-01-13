document.getElementById('addUserForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const is_global_active = document.getElementById('is_global_active').checked;
    const is_admin = document.getElementById('is_admin').checked;

    const userData = {
        email,
        password,
        is_global_active,
        is_admin
    };

    const responseDiv = document.getElementById('response');
    responseDiv.textContent = 'Submitting...';
    responseDiv.className = 'response-message';

    try {
        // Placeholder for API endpoint
        const apiEndpoint = '/api/users';
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            responseDiv.textContent = 'User added successfully: ' + JSON.stringify(result);
            responseDiv.className = 'response-message success';
            document.getElementById('addUserForm').reset();
        } else {
            responseDiv.textContent = 'Error adding user: ' + (result.message || JSON.stringify(result));
            responseDiv.className = 'response-message error';
        }
    } catch (error) {
        responseDiv.textContent = 'Network error: ' + error.message;
        responseDiv.className = 'response-message error';
    }
});
