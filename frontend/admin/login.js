document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    errorDiv.style.display = 'none';

    try {
        console.log(`[Login] Attempting sign-in for: ${username}`);
        const response = await fetch('https://web-12h1.onrender.com/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // Required for setting cookies
        });

        console.log(`[Login] Response status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log('[Login] Successful. Storing session info and redirecting...');

            // Store role and username for UI (Removed: Token is in HttpOnly Cookie, and we fetch user info on demand)
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            const err = await response.json();
            console.warn('[Login] Failed:', err.error);
            errorDiv.innerText = err.error || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        console.error('[Login] Error during fetch:', err);
        errorDiv.innerText = 'Server error. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Check if already logged in (using /api/admin/me instead of localStorage)
(async () => {
    try {
        const response = await fetch('https://web-12h1.onrender.com/api/admin/me', { credentials: 'include' });
        if (response.ok) {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.log('[Login] No active session found.');
    }
})();
