// Auth Check - Token is in HttpOnly cookie. We fetch role from /api/admin/me
let role = null;
let adminUser = null;

const checkSession = async () => {
    try {
        const BACKEND_URL = 'https://web-12h1.onrender.com';
        const token = localStorage.getItem('admin_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${BACKEND_URL}/api/admin/me`, { 
            credentials: 'include',
            headers: headers
        });
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

// UI RBAC
const initUI = () => {
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

    if (document.getElementById('adminRoleBadge')) {
        document.getElementById('adminRoleBadge').innerText = role;
    }
    
    const vipNav = document.getElementById('vipNav');
    const manageAdminsNav = document.getElementById('manageAdminsNav');

    if (role === 'superadmin') {
        if (vipNav) vipNav.style.display = 'block';
        if (manageAdminsNav) manageAdminsNav.style.display = 'block';
    } else {
        if (vipNav) vipNav.style.display = 'none';
        if (manageAdminsNav) manageAdminsNav.style.display = 'none';
    }
};

// Logout Logic
const handleLogout = async (e) => {
    if (e) e.preventDefault();
    try {
        const BACKEND_URL = 'https://web-12h1.onrender.com';
        const token = localStorage.getItem('admin_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        await fetch(`${BACKEND_URL}/api/admin/logout`, { 
            method: 'POST', 
            credentials: 'include',
            headers: headers 
        });
        localStorage.removeItem('admin_token');
    } catch (err) {
        console.error('Logout error:', err);
    }
    // Session is cleared on server via cookie removal
    window.location.href = 'login.html';
};

const setupLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (dropdownLogoutBtn) dropdownLogoutBtn.addEventListener('click', handleLogout);
};

// Protected Fetch Helper
const authFetch = async (url, options = {}) => {
    const BACKEND_URL = 'https://web-12h1.onrender.com';
    const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
    console.log(`[Dashboard] Fetching: ${fullUrl}`);
    options.credentials = 'include'; // Essential for cookies
    
    const token = localStorage.getItem('admin_token');
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    options.headers = {
        ...authHeader,
        ...options.headers
    };
    try {
        const response = await fetch(fullUrl, options);
        console.log(`[Dashboard] Response from ${fullUrl}: ${response.status}`);
        if (response.status === 401) {
            console.warn('[Dashboard] Unauthorized! Redirecting to login.');
            window.location.href = 'login.html';
        }
        return response;
    } catch (err) {
        console.error(`[Dashboard] Network error on ${fullUrl}:`, err);
        throw err;
    }
};

const createGradient = (color1, color2) => {
    const ctx = document.getElementById('roleChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
};

const listEl = document.getElementById('applicantTable')?.querySelector('tbody');
const totalEl = document.getElementById('totalApplicants');
const modal = document.getElementById('remarkModal');
const modalRemark = document.getElementById('modalRemark');
const confirmBtn = document.getElementById('confirmBtn');
const modalTitle = document.getElementById('modalTitle');

let currentAction = null;
let currentId = null;

// Chart Instances
let totalRegChartInstance = null;
let weeklyGrowthChartInstance = null;

const fetchApplicants = async () => {
    try {
        const response = await authFetch('/api/admin/applicants');
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();

        // Apply filters
        const searchVal = document.getElementById('tableSearch')?.value.toLowerCase() || '';
        const statusVal = document.getElementById('statusFilter')?.value || 'All';
        const roleVal = document.getElementById('roleFilter')?.value || 'All';

        const filteredData = data.filter(app => {
            const matchSearch = String(app.full_name || '').toLowerCase().includes(searchVal) || String(app.email || '').toLowerCase().includes(searchVal);
            const statusDisplay = (app.role === 'VIP' || app.role === 'VVIP' || app.status === 'approved') ? 'approved' : (app.status === 'pending' ? 'pending' : 'rejected');
            const matchStatus = statusVal === 'All' ? true : statusDisplay === statusVal;
            const matchRole = roleVal === 'All' ? true : app.role === roleVal;
            return matchSearch && matchStatus && matchRole;
        });

        // Populate Table with new exact columns: NAME, EMAIL, ORGANIZATION, ROLE, APPLIED, STATUS, ACTIONS
        if (listEl) {
            listEl.innerHTML = filteredData.map((app, index) => {
                // Apply darker alternate backgrounds for mock look
                const bgStr = index % 2 === 0 ? 'background: rgba(255,255,255,0.02);' : 'background: transparent;';
                const appliedDate = app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Oct ' + (14 - (index % 4));
                const statusDisplay = (app.role === 'VIP' || app.role === 'VVIP' || app.status === 'approved') ? 'Approved' : (app.status === 'pending' ? 'Pending' : 'Rejected');
                const statusColor = statusDisplay === 'Approved' ? '#2ecc71' : (statusDisplay === 'Pending' ? '#c29958' : '#e74c3c');

                return `<tr style="${bgStr}">
                    <td style="padding: 1rem 1.5rem; font-size: 0.85rem; color: #fff;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="color: #666; font-size: 0.8rem;">${index + 1}.</span>
                            <div style="width: 25px; height: 25px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #8c7335); display: flex; align-items: center; justify-content: center; color: #000; font-size: 0.7rem; font-weight: bold;">
                                ${String(app.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span style="cursor: pointer; border-bottom: 1px dashed rgba(194,153,88,0.3);" onclick="viewDetails('${app.id}')">${app.full_name}</span>
                        </div>
                    </td>
                    <td style="padding: 1rem 1.5rem; font-size: 0.8rem; color: #aaa;">${app.email}</td>
                    <td style="padding: 1rem 1.5rem; font-size: 0.8rem; color: #aaa;">${app.organization || 'N/A'}</td>
                    <td style="padding: 1rem 1.5rem; font-size: 0.8rem; color: #ccc;">${app.role}</td>
                    <td style="padding: 1rem 1.5rem; font-size: 0.8rem; color: #aaa;">${appliedDate}</td>
                    <td style="padding: 1rem 1.5rem; font-size: 0.8rem; font-weight: 600; color: ${statusColor};">${statusDisplay}</td>
                    <td style="padding: 1rem 1.5rem;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button style="background: rgba(255, 255, 255, 0.05); border: 1px solid #444; color: #ccc; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer;" onclick="viewDetails('${app.id}')">Details</button>
                            ${(statusDisplay === 'Approved') ?
                        `<button style="background: rgba(194, 153, 88, 0.1); border: 1px solid var(--primary); color: var(--primary); padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer;" onclick="viewBadge('${app.id}')">Badge</button>` :
                        `<button style="background: rgba(194, 153, 88, 0.2); border: 1px solid var(--primary); color: var(--primary); padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer;" onclick="openModal('${app.id}', 'approve')">Approve</button>
                         <button style="background: transparent; border: 1px solid #444; color: #888; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer;" onclick="openModal('${app.id}', 'reject')">Reject</button>`
                    }
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }

        // Fetch Summary Stats
        const summaryRes = await authFetch('/api/admin/stats/summary');
        if (summaryRes.ok) {
            const summary = await summaryRes.json();

            // Map the old stats response to our new UI slots
            const totalStr = (summary.total_applications || 0);
            if (document.getElementById('totalApplicants')) document.getElementById('totalApplicants').innerText = totalStr.toLocaleString();

            // Assuming 80% of pending are "new" for this UI illustration
            const pendingCount = data.filter(a => a.status === 'pending').length;
            if (document.getElementById('newApplicants')) document.getElementById('newApplicants').innerText = pendingCount;

            const approvedCount = data.filter(a => a.status === 'approved' || a.role === 'VIP' || a.role === 'VVIP').length;
            if (document.getElementById('approvedAttendees')) document.getElementById('approvedAttendees').innerText = approvedCount.toLocaleString();
        }

    } catch (err) {
        console.error('Failed to fetch applicants or stats', err);
    }
};

// Filter Event Listeners
const setupFilters = () => {
    document.getElementById('tableSearch')?.addEventListener('input', fetchApplicants);
    document.getElementById('statusFilter')?.addEventListener('change', fetchApplicants);
    document.getElementById('roleFilter')?.addEventListener('change', fetchApplicants);
};

window.openModal = (id, action) => {
    currentId = id;
    currentAction = action;
    modalTitle.innerText = action === 'approve' ? 'Approve Applicant' : 'Reject Applicant';
    modalRemark.value = '';
    modal.style.display = 'flex';

    if (action === 'approve') {
        confirmBtn.className = 'premium-button';
        confirmBtn.innerText = 'Confirm Approval';
    } else {
        confirmBtn.className = 'btn-reject';
        confirmBtn.style.padding = '12px 30px';
        confirmBtn.style.fontSize = '0.9rem';
        confirmBtn.innerText = 'Confirm Rejection';
    }
};

window.closeModal = () => {
    modal.style.display = 'none';
};

confirmBtn.onclick = async () => {
    const remark = modalRemark.value || (currentAction === 'approve' ? 'Approved by Admin' : 'Rejected by Admin');
    const endpoint = currentAction === 'approve' ? 'approve' : 'reject';

    console.log(`[Dashboard] Attempting to ${endpoint} applicant ${currentId}`);

    try {
        const response = await authFetch(`/api/admin/${endpoint}/${currentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ remark: remark })
        });

        if (response.ok) {
            console.log(`[Dashboard] Applicant ${currentAction}d successfully`);
            window.showToast(`Applicant ${currentAction}d successfully!`, 'success');
            closeModal();
            // Refresh counts and table
            await fetchApplicants();
            if (typeof initRoleChart === 'function') await initRoleChart();
        } else {
            const errData = await response.json().catch(() => ({}));
            console.error(`[Dashboard] ${currentAction} failed:`, errData);
            window.showToast(`${currentAction} failed: ${errData.error || 'Server error'}`, 'error');
        }
    } catch (err) {
        console.error(`[Dashboard] ${currentAction} error:`, err);
        window.showToast('Server connection error', 'error');
    }
};

window.viewBadge = async (id) => {
    try {
        const response = await authFetch(`/api/admin/applicants/${id}`);
        if (!response.ok) throw new Error('Failed to fetch applicant data');
        const app = await response.json();

        if (app) {
            document.getElementById('badgeName').innerText = app.full_name;
            document.getElementById('badgeRole').innerText = app.role;
            document.getElementById('badgeQrImg').src = app.qr_code || '';
            document.getElementById('badgeIdStr').innerText = app.confirmation_code || app.id;
            document.getElementById('badgeModal').style.display = 'flex';
        }
    } catch (err) {
        console.error(err);
        alert('Failed to load badge data');
    }
};

window.closeBadgeModal = () => {
    document.getElementById('badgeModal').style.display = 'none';
};

window.viewDetails = async (id) => {
    try {
        const response = await authFetch(`/api/admin/applicants/${id}`);
        if (!response.ok) throw new Error('Failed to fetch details');
        const app = await response.json();

        const content = document.getElementById('detailsContent');
        const roleBadge = document.getElementById('detailsRoleBadge');
        
        roleBadge.innerText = app.role;
        
        let metaHtml = '';
        if (app.metadata) {
            const meta = typeof app.metadata === 'string' ? JSON.parse(app.metadata) : app.metadata;
            metaHtml = Object.entries(meta).map(([key, value]) => `
                <div style="grid-column: span 2; padding: 10px; background: rgba(255,255,255,0.02); border-left: 2px solid var(--primary); margin-top: 5px;">
                    <label style="display: block; font-size: 0.65rem; color: var(--primary); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">${key.replace(/_/g, ' ')}</label>
                    <div style="word-break: break-all; color: #fff; font-size: 0.9rem;">${value}</div>
                </div>
            `).join('');
        }

        content.innerHTML = `
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Full Name</label>
                <div style="color: #fff; font-size: 1rem; font-weight: 600;">${app.full_name}</div>
            </div>
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Email</label>
                <div style="color: #fff; font-size: 1rem;">${app.email}</div>
            </div>
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Country</label>
                <div style="color: #fff; font-size: 1rem;">${app.country}</div>
            </div>
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Organization</label>
                <div style="color: #fff; font-size: 1rem;">${app.organization || 'N/A'}</div>
            </div>
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Phone</label>
                <div style="color: #fff; font-size: 1rem;">${app.phone || 'N/A'}</div>
            </div>
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Social Handle</label>
                <div style="color: #fff; font-size: 1rem;">${app.social_handle || 'N/A'}</div>
            </div>
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Status</label>
                <div style="color: ${app.status === 'approved' ? '#2ecc71' : (app.status === 'pending' ? '#c29958' : '#e74c3c')}; font-size: 1rem; font-weight: bold; text-transform: uppercase;">${app.status}</div>
            </div>
            <div style="padding: 10px;">
                <label style="display: block; font-size: 0.65rem; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Registration Code</label>
                <div style="color: var(--primary); font-size: 1rem; font-weight: bold;">${app.confirmation_code || 'Pending'}</div>
            </div>
            ${app.remark ? `
            <div style="grid-column: span 2; padding: 10px; background: rgba(194,153,88,0.05); border: 1px dashed var(--primary); border-radius: 4px; margin-top: 10px;">
                <label style="display: block; font-size: 0.65rem; color: var(--primary); text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Admin Remark</label>
                <div style="color: #fff; font-size: 0.85rem; font-style: italic;">"${app.remark}"</div>
            </div>` : ''}
            
            <h3 style="grid-column: span 2; color: #888; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">Additional Application Metadata</h3>
            ${metaHtml || '<div style="grid-column: span 2; color: #666; font-size: 0.8rem; font-style: italic;">No additional metadata provided.</div>'}
        `;

        document.getElementById('detailsModal').style.display = 'flex';
    } catch (err) {
        console.error(err);
        alert('Failed to load application details');
    }
};

window.closeDetailsModal = () => {
    document.getElementById('detailsModal').style.display = 'none';
};

// Mini Charts Setup
const initRoleChart = async () => {
    try {
        // Destroy existing to prevent overlaps on re-render
        if (totalRegChartInstance) totalRegChartInstance.destroy();
        if (weeklyGrowthChartInstance) weeklyGrowthChartInstance.destroy();

        // 1. Total Registrations Sparkline Bar Chart (Simplified mock data for background vibe)
        const totalCtx = document.getElementById('totalRegChart')?.getContext('2d');
        if (totalCtx) {
            totalRegChartInstance = new Chart(totalCtx, {
                type: 'bar',
                data: {
                    labels: ['1', '2', '3', '4', '5', '6', '7'],
                    datasets: [{
                        data: [12, 19, 15, 25, 22, 30, 28],
                        backgroundColor: '#c29958',
                        borderRadius: 2,
                        barThickness: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false, min: 0 }
                    },
                    animation: { duration: 1500 }
                }
            });
        }

        // 2. Fetch Real Weekly Growth Data from Backend
        let weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let weeklyData = [0, 0, 0, 0, 0, 0, 0];

        try {
            const weeklyRes = await authFetch('/api/stats/weekly');
            if (weeklyRes.ok) {
                const stats = await weeklyRes.json();
                if (stats && stats.length > 0) {
                    weeklyLabels = stats.map(s => s.date);
                    weeklyData = stats.map(s => s.count);
                }
            }
        } catch (err) {
            console.warn('Could not fetch real weekly stats, falling back to mock.', err);
        }

        const weeklyCtx = document.getElementById('weeklyGrowthChart')?.getContext('2d');
        if (weeklyCtx) {
            const gradient = weeklyCtx.createLinearGradient(0, 0, 0, 150);
            gradient.addColorStop(0, 'rgba(194, 153, 88, 0.4)');
            gradient.addColorStop(1, 'rgba(194, 153, 88, 0.1)');

            weeklyGrowthChartInstance = new Chart(weeklyCtx, {
                type: 'line',
                data: {
                    labels: weeklyLabels,
                    datasets: [{
                        label: 'Registrations',
                        data: weeklyData,
                        borderColor: '#c29958',
                        borderWidth: 3,
                        pointBackgroundColor: '#c29958',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 6,
                        pointRadius: 4,
                        fill: true,
                        backgroundColor: gradient,
                        tension: 0.4 
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1a1410',
                            titleColor: '#c29958',
                            bodyColor: '#fff',
                            borderColor: 'rgba(194,153,88,0.5)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => ` ${context.parsed.y} Registrations`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false, drawBorder: false },
                            ticks: { color: '#888', font: { size: 10, weight: 'bold' } }
                        },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                            ticks: { color: '#666', font: { size: 10 } },
                            beginAtZero: true,
                            suggestedMax: Math.max(...weeklyData) + 2
                        }
                    }
                }
            });
        }

    } catch (err) {
        console.error('Failed to init charts:', err);
    }
};

// VIP Modal Logic
const vipModal = document.getElementById('vipModal');
const vipForm = document.getElementById('vipForm');

window.closeVipModal = () => {
    if (vipModal) vipModal.style.display = 'none';
};

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
                window.showToast('VIP Registered and Approved Successfully!', 'success');
                closeVipModal();
                vipForm.reset();
                fetchApplicants();
                if (window.initRoleChart) window.initRoleChart();
            } else {
                const err = await response.json();
                window.showToast('Failed: ' + (err.error || 'Server error'), 'error');
            }
        } catch (error) {
            console.error(error);
            window.showToast('Registration failed', 'error');
        }
    });
}

// Profile Management Logic
const profileDropdown = document.getElementById('profileDropdown');
const profileTrigger = document.getElementById('profileTrigger');
const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');

const setupProfileUI = () => {
    // Dropdown toggle
    if (profileTrigger) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    document.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.style.display = 'none';
    });

    // Populate Initial Admin Info
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    const adminRoleDisplay = document.getElementById('adminRoleDisplay');
    if (adminNameDisplay) adminNameDisplay.innerText = adminUser || 'Admin User';
    if (adminRoleDisplay) adminRoleDisplay.innerText = role || 'Admin';

    // Edit Profile Modal
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

// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
    const admin = await checkSession();
    if (!admin) return;

    initUI();
    setupLogout();
    setupFilters();
    setupProfileUI();
    
    initRoleChart();
    fetchApplicants();

    console.log('[Dashboard] Initialized for:', adminUser);
});
