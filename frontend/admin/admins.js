// Auth & RBAC Check
let role = null;
let adminUser = null;

const checkSession = async () => {
    try {
        const response = await fetch('https://web-12h1.onrender.com/api/admin/me', { credentials: 'include' });
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
    if (roleBadge) roleBadge.innerText = role;

    // Populate Sidebar UI
    const vipNav = document.getElementById('vipNav');
    const manageAdminsNav = document.getElementById('manageAdminsNav');

    if (role === 'superadmin') {
        if (vipNav) vipNav.style.display = 'block';
        if (manageAdminsNav) manageAdminsNav.style.display = 'block';
    } else {
        // Strict redirection for non-superadmins
        window.location.href = 'dashboard.html';
    }

    // Populate Profile Header
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    const adminRoleDisplay = document.getElementById('adminRoleDisplay');
    if (adminNameDisplay) adminNameDisplay.innerText = adminUser || 'Admin User';
    if (adminRoleDisplay) adminRoleDisplay.innerText = role || 'Admin';
};

// Logout Logic
const handleLogout = async (e) => {
    if (e) e.preventDefault();
    try {
        await fetch('https://web-12h1.onrender.com/api/admin/logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    }
    window.location.href = 'login.html';
};

const setupLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (dropdownLogoutBtn) dropdownLogoutBtn.addEventListener('click', handleLogout);
};

// Protected Fetch
const authFetch = async (url, options = {}) => {
    options.credentials = 'include';
    options.headers = {
        ...options.headers
    };
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        window.location.href = 'login.html';
    }
    return response;
};

// Admin Management Logic
const adminsList = document.getElementById('adminsList');
const adminModal = document.getElementById('adminModal');
const adminForm = document.getElementById('adminForm');
const adminModalTitle = document.getElementById('adminModalTitle');
let isEditing = false;

const fetchAdmins = async () => {
    try {
        const response = await authFetch('https://web-12h1.onrender.com/api/admin/admins');
        const data = await response.json();
        const listEl = document.getElementById('adminsList');

        listEl.innerHTML = data.map(adm => `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #fff;">${adm.username}</div>
                    <div style="font-size: 0.7rem; color: #555;">ID: ${adm.id}</div>
                </td>
                <td><span class="role-badge role-${adm.role.toLowerCase()}">${adm.role}</span></td>
                <td style="color: #666;">${new Date(adm.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        ${adm.role !== 'superadmin' ?
                `<button class="premium-button" style="padding: 6px 12px; font-size: 0.7rem;" onclick="openEditModal(${adm.id}, '${adm.username}', '${adm.role}')">Edit</button>
                             <button class="btn-reject" style="padding: 6px 12px; font-size: 0.7rem;" onclick="deleteAdmin(${adm.id})">Delete</button>`
                : `<small style="color: #444; font-style: italic;">Protected</small>`
            }
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to fetch admins');
    }
};

document.getElementById('addAdminBtn').addEventListener('click', () => {
    isEditing = false;
    adminModalTitle.innerText = 'Create New Admin';
    document.getElementById('adminId').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').required = true;
    document.getElementById('passwordHint').innerText = '(Required)';
    document.getElementById('adminRole').value = 'admin';
    adminModal.style.display = 'flex';
});

window.openEditModal = (id, username, role) => {
    isEditing = true;
    adminModalTitle.innerText = 'Edit Admin';
    document.getElementById('adminId').value = id;
    document.getElementById('adminUsername').value = username;
    document.getElementById('adminPassword').required = false;
    document.getElementById('passwordHint').innerText = '(Leave blank to keep current)';
    document.getElementById('adminRole').value = role;
    adminModal.style.display = 'flex';
};

window.closeAdminModal = () => {
    adminModal.style.display = 'none';
};

adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('adminId').value;
    const adminData = {
        username: document.getElementById('adminUsername').value,
        role: document.getElementById('adminRole').value,
    };

    const pass = document.getElementById('adminPassword').value;
    if (pass) {
        adminData.password = pass;
    }

    const url = isEditing ? `/api/admin/admins/${id}` : 'https://web-12h1.onrender.com/api/admin/admins';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await authFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData)
        });

        if (response.ok) {
            closeAdminModal();
            fetchAdmins();
        } else {
            const err = await response.json();
            alert('Failed: ' + (err.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Server error saving admin');
    }
});

window.deleteAdmin = async (id) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
        const response = await authFetch(`/api/admin/admins/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchAdmins();
        } else {
            alert('Failed to delete admin');
        }
    } catch (err) {
        alert('Server error deleting admin');
    }
};

// Profile & Dropdown Management
const profileDropdown = document.getElementById('profileDropdown');
const profileTrigger = document.getElementById('profileTrigger');
const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');

const setupProfileDropdown = () => {
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
};

window.openProfileModal = async () => {
    try {
        const response = await authFetch('https://web-12h1.onrender.com/api/admin/me');
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

// VIP Modal Logic for Sidebar Link
const vipModal = document.getElementById('vipModal');
const registerVipSidebar = document.getElementById('registerVipSidebar');
if (registerVipSidebar) {
    registerVipSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        vipModal.style.display = 'flex';
    });
}
window.closeVipModal = () => { if (vipModal) vipModal.style.display = 'none'; };

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

// Final Initialization
document.addEventListener('DOMContentLoaded', async () => {
    const admin = await checkSession();
    if (!admin) return;

    setupUI();
    setupLogout();
    setupProfileDropdown();
    fetchAdmins();
});
