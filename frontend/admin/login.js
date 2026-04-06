// Dynamic URL Discovery
const getBackendURL = () => {
    // If on numeric IP or domain on port 5274, assume backend is on port 5005
    if (window.location.port === '5274') {
        return `${window.location.protocol}//${window.location.hostname}:5005`;
    }
    return 'https://web-12h1.onrender.com';
};

const BACKEND_URL = getBackendURL();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    errorDiv.style.display = 'none';

    try {
        console.log(`[Login] Attempting sign-in for: ${username} via ${BACKEND_URL}`);
        const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
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

            // Storing token in localStorage as a fallback for the cookie session
            if (data.token) {
                localStorage.setItem('admin_token', data.token);
                console.log('[Login] Token saved to localStorage');
            } else {
                console.warn('[Login] No token received in JSON response');
            }
            
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
        const BACKEND_URL = 'https://web-12h1.onrender.com';
        const response = await fetch(`${BACKEND_URL}/api/admin/me`, { credentials: 'include' });
        if (response.ok) {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.log('[Login] No active session found.');
    }
})();
