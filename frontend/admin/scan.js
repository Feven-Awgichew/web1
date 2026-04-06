// Auth Check helper
let role = null;
let adminUser = null;

const checkSession = async () => {
    try {
        const BACKEND_URL = 'http://204.168.219.139:5005';
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

const authFetch = async (url, options = {}) => {
    const BACKEND_URL = 'http://204.168.219.139:5005';
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

window.showToast = (message, type = 'success') => {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast) {
        alert(message);
        return;
    }

    toastMsg.innerText = message;
    
    toast.className = 'toast-notification'; // Reset classes
    if (type === 'success') {
        toast.classList.add('toast-success');
        toastIcon.className = 'fa-solid fa-circle-check';
    } else {
        toast.classList.add('toast-error');
        toastIcon.className = 'fa-solid fa-circle-exclamation';
    }

    toast.classList.add('show');

    // Auto hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
};

const setupUI = () => {
    // Mobile Sidebar functionality
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const mainSidebar = document.getElementById('mainSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuToggle && mainSidebar && sidebarOverlay) {
        if (window.innerWidth <= 768 && closeSidebarBtn) {
            closeSidebarBtn.style.display = 'block';
        }

        const openSidebar = () => {
            mainSidebar.classList.add('open');
            sidebarOverlay.style.display = 'block';
        };

        const closeSidebar = () => {
            mainSidebar.classList.remove('open');
            sidebarOverlay.style.display = 'none';
        };

        mobileMenuToggle.addEventListener('click', openSidebar);
        if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    const roleBadge = document.getElementById('adminRoleBadge');
    if (roleBadge) roleBadge.innerText = role || 'ADMIN';
    // Populate Sidebar UI
    const vipNav = document.getElementById('vipNav');
    const manageAdminsNav = document.getElementById('manageAdminsNav');

    if (role === 'superadmin') {
        if (vipNav) vipNav.style.display = 'block';
        if (manageAdminsNav) manageAdminsNav.style.display = 'block';
    } else {
        if (vipNav) vipNav.style.display = 'none';
        if (manageAdminsNav) manageAdminsNav.style.display = 'none';
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
            const BACKEND_URL = 'http://204.168.219.139:5005';
            await fetch(`${BACKEND_URL}/api/admin/logout`, { method: 'POST', credentials: 'include' });
            localStorage.removeItem('admin_token'); // Cleanup legacy tokens
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
                    window.showToast('Profile updated successfully!', 'success');
                    const updatedAdmin = await response.json();
                    adminUser = updatedAdmin.username;
                    document.getElementById('adminNameDisplay').innerText = updatedAdmin.username;
                    closeProfileModal();
                } else {
                    const err = await response.json();
                    window.showToast('Update failed: ' + (err.error || 'Server error'), 'error');
                }
            } catch (err) {
                console.error(err);
                window.showToast('Update profile error', 'error');
            }
        });
    }
};

const resultCard = document.getElementById('resultCard');
let isProcessing = false;

const verifyCode = async (code) => {
    if (!code) return;
    try {
        const response = await authFetch(`/api/admin/verify-qr/${code}`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('resName').innerText = data.full_name;
            document.getElementById('resRole').innerText = data.role;
            document.getElementById('resCountry').innerText = data.country;
            document.getElementById('resStatus').innerText = 'Access Granted';
            document.getElementById('resStatus').style.color = '#c29958'; // Gold
            resultCard.style.display = 'block';

            setTimeout(() => { resultCard.style.display = 'none'; }, 5000);
        } else {
            const resStatus = document.getElementById('resStatus');
            const errData = await response.json().catch(() => ({}));
            resStatus.innerText = 'Check Failed: ' + (errData.error || 'Invalid QR');
            resStatus.style.color = '#ff4d4d';
            resultCard.style.display = 'block';
            setTimeout(() => { resultCard.style.display = 'none'; }, 5000);
        }
    } catch (err) {
        console.error('Verification error:', err);
    }
};

function onScanSuccess(decodedText) {
    if (isProcessing) return;
    isProcessing = true;
    console.log(`[QR Scanner] Success! Code = ${decodedText}`);

    document.getElementById('resStatus').innerText = 'Processing...';
    document.getElementById('resStatus').style.color = '#fff';
    resultCard.style.display = 'block';

    verifyCode(decodedText.trim()).finally(() => {
        setTimeout(() => {
            isProcessing = false;
        }, 3000); // 3 second cooldown
    });
}

function onScanFailure(error) {
    // Ignore normal "not found" errors
}

// Initialization logic
const init = async () => {
    const admin = await checkSession();
    if (!admin) return;

    setupUI();
    initScanner();
};

const initScanner = () => {
    if (typeof Html5Qrcode === 'undefined') {
        console.error("Html5Qrcode library not loaded!");
        const statusEl = document.getElementById('resStatus');
        if (statusEl) {
            statusEl.innerText = 'Error: Scanner Library Failed to Load. Check internet connection.';
            statusEl.style.color = '#ff4d4d';
        }
        if (resultCard) resultCard.style.display = 'block';
        return;
    }

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Camera start error:", err);
        const resStatus = document.getElementById('resStatus');
        if (resStatus) {
            resStatus.innerText = 'Camera Error: Please allow camera permissions in your browser.';
            resStatus.style.color = '#ff4d4d';
        }
        if (resultCard) resultCard.style.display = 'block';
    });

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

window.addEventListener('load', init);

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
