const form = document.getElementById('registerForm');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        role: document.getElementById('role').value,
        full_name: document.getElementById('full_name').value,
        email: document.getElementById('email').value,
        country: document.getElementById('country').value,
        social_handle: document.getElementById('social_handle').value,
        organization: document.getElementById('organization').value
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            body: formData
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (response.ok) {
                messageEl.style.display = 'block';
                messageEl.style.color = 'var(--accent)';
                messageEl.innerText = 'Application submitted successfully! Check your email for confirmation.';
                form.reset();
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } else {
            throw new Error(`Server returned an unexpected response (${response.status}). Potential API link issue.`);
        }
    } catch (err) {
        messageEl.style.display = 'block';
        messageEl.style.color = '#ff4d4d';
        messageEl.innerText = err.message;
    }
});
