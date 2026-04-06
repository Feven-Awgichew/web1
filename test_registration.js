const data = {
    role: "Influencer",
    full_name: "Integration Test User",
    email: "integrationtest1@example.com",
    country: "South Africa",
    phone: "+27 800 000 000",
    social_handle: "@integration_test",
    metadata: {
        platform: "Instagram",
        followers: "10K-50K"
    }
};

fetch('https://web-12h1.onrender.com/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
    .then(res => res.json().then(json => ({ status: res.status, ok: res.ok, data: json })))
    .then(result => {
        console.log("Registration Result:");
        console.log(JSON.stringify(result, null, 2));
    })
    .catch(err => console.error("Registration Error:", err));
