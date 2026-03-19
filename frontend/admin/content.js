// Auth Check
let role = null;
let adminUser = null;

const checkSession = async () => {
    try {
        const BACKEND_URL = 'https://web-12h1.onrender.com';
        const response = await fetch(`${BACKEND_URL}/api/admin/me`, { credentials: 'include' });
        if (!response.ok) {
            window.location.href = 'login.html';
            return null;
        }
        const admin = await response.json();
        role = admin.role;
        adminUser = admin.username;
        return admin;
    } catch (err) {
        window.location.href = 'login.html';
        return null;
    }
};

const setupUI = () => {
    const roleBadge = document.getElementById('adminRoleBadge');
    if (roleBadge) roleBadge.innerText = role || 'ADMIN';

    // Populate Sidebar UI
    const vipNav = document.getElementById('vipNav');
    const manageAdminsNav = document.getElementById('manageAdminsNav');

    if (role === 'superadmin') {
        if (vipNav) vipNav.style.display = 'block';
        if (manageAdminsNav) manageAdminsNav.style.display = 'block';
        if (document.getElementById('sponsorManagementPanel')) {
            document.getElementById('sponsorManagementPanel').style.display = 'block';
        }
    }

    // Populate Profile Header
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    const adminRoleDisplay = document.getElementById('adminRoleDisplay');
    if (adminNameDisplay) adminNameDisplay.innerText = adminUser || 'Admin User';
    if (adminRoleDisplay) adminRoleDisplay.innerText = role || 'Admin';

    // Logout Logic
    const handleLogout = async (e) => {
        if (e) e.preventDefault();
        try {
            const BACKEND_URL = 'https://web-12h1.onrender.com';
            await fetch(`${BACKEND_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' });
        } catch (err) {
            console.error('Logout error:', err);
        }
        window.location.href = 'login.html';
    };

    const logoutBtn = document.getElementById('logoutBtn');
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (dropdownLogoutBtn) dropdownLogoutBtn.addEventListener('click', handleLogout);

    // Profile & Dropdown Management
    const profileDropdown = document.getElementById('profileDropdown');
    const profileTrigger = document.getElementById('profileTrigger');
    const profileModal = document.getElementById('profileModal');
    const profileForm = document.getElementById('profileForm');

    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    document.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.style.display = 'none';
    });

    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await openProfileModal();
        });
    }

    window.openProfileModal = async () => {
        try {
            const response = await authFetch('/api/admin/me');
            if (response.ok) {
                const admin = await response.json();
                document.getElementById('profileFullName').value = admin.full_name || '';
                document.getElementById('profileEmail').value = admin.email || '';
                document.getElementById('profileUsername').value = admin.username || '';
                document.getElementById('profilePassword').value = '';
                profileModal.style.display = 'flex';
            }
        } catch (err) {
            console.error('Failed to fetch admin info');
        }
    };

    window.closeProfileModal = () => {
        if (profileModal) profileModal.style.display = 'none';
    };

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updateData = {
                full_name: document.getElementById('profileFullName').value,
                email: document.getElementById('profileEmail').value,
                username: document.getElementById('profileUsername').value
            };

            const password = document.getElementById('profilePassword').value;
            if (password) updateData.password = password;

            try {
                const response = await authFetch('/api/admin/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    alert('Profile updated successfully!');
                    const updatedAdmin = await response.json();
                    adminUser = updatedAdmin.username;
                    document.getElementById('adminNameDisplay').innerText = updatedAdmin.username;
                    closeProfileModal();
                } else {
                    const err = await response.json();
                    alert('Update failed: ' + (err.error || 'Server error'));
                }
            } catch (err) {
                console.error(err);
                alert('Update profile error');
            }
        });
    }

    // VIP Registration Sidebar Logic
    const vBtn = document.getElementById('registerVipSidebar');
    const vModal = document.getElementById('vipModal');
    if (vBtn && vModal) {
        vBtn.addEventListener('click', (e) => {
            e.preventDefault();
            vModal.style.display = 'flex';
        });
    }
};

const authFetch = async (url, options = {}) => {
    const BACKEND_URL = 'https://web-12h1.onrender.com';
    const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
    options.credentials = 'include';
    options.headers = {
        ...options.headers
    };
    const response = await fetch(fullUrl, options);
    if (response.status === 401) {
        window.location.href = 'login.html';
    }
    return response;
};

const API_BASE = 'https://web-12h1.onrender.com/api';

// Handle News Submission
document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('newsTitle').value);
    formData.append('description', document.getElementById('newsDescription').value);
    formData.append('date', document.getElementById('newsDate').value);
    formData.append('link', document.getElementById('newsLink').value);
    formData.append('image', document.getElementById('newsImage').files[0]);

    try {
        const response = await authFetch(`${API_BASE}/admin/news`, {
            method: 'POST',
            body: formData
        });

        if (response.status === 201 || response.ok) {
            document.getElementById('newsStatus').style.display = 'block';
            document.getElementById('newsForm').reset();
            setTimeout(() => document.getElementById('newsStatus').style.display = 'none', 3000);
        } else {
            alert('Failed to publish news');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Server connection error.');
    }
});

// Handle Gallery Submission
document.getElementById('galleryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('galleryTitle').value);
    formData.append('type', document.getElementById('galleryType').value);
    formData.append('event_name', document.getElementById('galleryEvent').value);
    formData.append('media', document.getElementById('galleryMedia').files[0]);

    try {
        const response = await authFetch(`${API_BASE}/admin/gallery`, {
            method: 'POST',
            body: formData
        });

        if (response.status === 201 || response.ok) {
            document.getElementById('galleryStatus').style.display = 'block';
            document.getElementById('galleryForm').reset();
            setTimeout(() => document.getElementById('galleryStatus').style.display = 'none', 3000);
        } else {
            alert('Failed to upload media');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Server connection error.');
    }
});

// VIP Registration Handlers
window.closeVipModal = () => {
    const vModal = document.getElementById('vipModal');
    if (vModal) vModal.style.display = 'none';
};

const vipForm = document.getElementById('vipForm');
if (vipForm) {
    vipForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const vipData = {
            full_name: document.getElementById('vipName').value,
            email: document.getElementById('vipEmail').value,
            role: document.getElementById('vipRole').value,
            country: document.getElementById('vipCountry').value,
            organization: document.getElementById('vipOrg').value
        };

        try {
            const response = await authFetch('/api/admin/register-vip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vipData)
            });

            if (response.ok) {
                alert('VIP Registered and Approved Successfully!');
                closeVipModal();
                vipForm.reset();
            } else {
                const err = await response.json();
                alert('Failed: ' + (err.error || 'Server error'));
            }
        } catch (error) {
            console.error(error);
            alert('Registration failed');
        }
    });
}

// Sponsor Registration Handler
const sponsorForm = document.getElementById('sponsorForm');
if (sponsorForm) {
    sponsorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sponsorData = {
            name: document.getElementById('sponsorName').value,
            logo_url: document.getElementById('sponsorLogo').value,
            website_url: document.getElementById('sponsorWebsite').value
        };

        try {
            const response = await authFetch('/api/admin/sponsors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sponsorData)
            });

            if (response.ok) {
                document.getElementById('sponsorStatus').style.display = 'block';
                sponsorForm.reset();
                setTimeout(() => {
                    const statusMsg = document.getElementById('sponsorStatus');
                    if (statusMsg) statusMsg.style.display = 'none';
                }, 3000);
            } else {
                const err = await response.json();
                alert('Failed to add sponsor: ' + (err.error || 'Server error'));
            }
        } catch (error) {
            console.error(error);
            alert('Sponsor addition failed');
        }
    });
}
// Final Init
document.addEventListener('DOMContentLoaded', async () => {
    const admin = await checkSession();
    if (!admin) return;
    setupUI();
});
