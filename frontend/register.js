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
        const response = await fetch('https://web-12h1.onrender.com/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            messageEl.style.display = 'block';
            messageEl.style.color = 'var(--accent)';
            messageEl.innerText = 'Application submitted successfully! Check your email for confirmation.';
            form.reset();
        } else {
            const err = await response.json();
            throw new Error(err.error || 'Registration failed');
        }
    } catch (err) {
        messageEl.style.display = 'block';
        messageEl.style.color = '#ff4d4d';
        messageEl.innerText = err.message;
    }
});
