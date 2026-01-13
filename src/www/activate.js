(function () {
    // Generate code on load (simulating backend generating it and emailing it)
    // In a real app the code would already exist on the backend for the user.
    // Here we generate it just to show the flow.
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Activation code (for testing):', activationCode);

    // Also log it to the page for convenience in this demo
    const msg = document.getElementById('activation-msg');

    // Store it so we can check it
    sessionStorage.setItem('activationCode', activationCode);


    const activateBtn = document.getElementById('activate-btn');
    if (activateBtn) {
        activateBtn.addEventListener('click', () => {
            const entered = document.getElementById('activation-code').value.trim();
            const expected = sessionStorage.getItem('activationCode');

            const msgEl = document.getElementById('activation-msg');

            if (!entered) {
                msgEl.textContent = '⚠️ Please enter the activation code.';
                msgEl.className = 'text-red-600 mt-2 text-sm';
                return;
            }

            if (entered === expected) {
                msgEl.textContent = '✅ Your profile is now active! 🎉';
                msgEl.className = 'text-green-600 mt-2 text-sm';

                // Disable button
                activateBtn.disabled = true;
                activateBtn.textContent = 'Activated';

                // Perhaps redirect after a few seconds?
                setTimeout(() => {
                    // alert('Redirecting to home...');
                    // window.location.href = '/'; 
                }, 2000);

                sessionStorage.removeItem('activationCode');
            } else {
                msgEl.textContent = '❌ Wrong code – try again.';
                msgEl.className = 'text-red-600 mt-2 text-sm';
            }
        });
    }
})();
