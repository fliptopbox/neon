// Simple vanilla JS admin app
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// State management
const state = {
    user: null,
    token: localStorage.getItem('token'),
    currentView: 'login',
    calendar: {
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        selectedDate: null,
        selectedEvent: null
    },
    ui: {
        filterNewModels: false,
        bookingModelSearch: '' // New state for search input text
    },
    data: {
        hosts: [],
        venues: [],
        sessions: [],
        models: [],
        users: [],
        calendar: []
    }
};

// API helpers
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(state.token && { 'Authorization': `Bearer ${state.token}` })
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
        if (response.status === 401) {
            logout();
        }
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

// Auth functions
async function login(email, password) {
    try {
        const data = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showView('dashboard');
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showView('login');
}

// View management
function showView(viewName) {
    state.currentView = viewName;
    render();
}
// Navigation helper for dashboard cards
window.navigateTo = function (view) {
    if (!view) return;
    showView(view);
    if (view !== 'dashboard') {
        loadData(view);
    }
};

// Data loading
// Data loading
async function loadData(type) {
    try {
        state.data[type] = await apiCall(`/api/${type}`);
        render();
    } catch (error) {
        console.error(`Failed to load ${type}:`, error);
    }
}

// Render functions
function renderLogin() {
    return `
        <div class="login-container">
            <div class="login-card">
                <h1>🎨 Neon Admin</h1>
                <p class="subtitle">Life Drawing Platform</p>
                <form id="loginForm" class="login-form">
                    <input type="email" id="email" placeholder="Email" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <button type="submit" class="btn-primary">Login</button>
                </form>
            </div>
        </div>
    `;
}

function renderNav() {
    return `
        <div class="mobile-header">
            <div class="logo"><span class="material-symbols-outlined">palette</span> Neon Admin</div>
            <button class="menu-toggle" onclick="toggleSidebar()">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
        <nav class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo"><span class="material-symbols-outlined">palette</span> Neon Admin</div>
                <button class="menu-toggle" onclick="toggleSidebar()">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            <ul class="nav-menu">
                <li><a href="#" data-view="dashboard" class="${state.currentView === 'dashboard' ? 'active' : ''}"><span class="material-symbols-outlined">dashboard</span> Dashboard</a></li>
                <li><a href="#" data-view="hosts" class="${state.currentView === 'hosts' ? 'active' : ''}"><span class="material-symbols-outlined">domain</span> Hosts</a></li>
                <li><a href="#" data-view="venues" class="${state.currentView === 'venues' ? 'active' : ''}"><span class="material-symbols-outlined">location_on</span> Venues</a></li>
                <li><a href="#" data-view="sessions" class="${state.currentView === 'sessions' ? 'active' : ''}"><span class="material-symbols-outlined">event_note</span> Sessions</a></li>
                <li><a href="#" data-view="models" class="${state.currentView === 'models' ? 'active' : ''}"><span class="material-symbols-outlined">person</span> Models</a></li>
                <li><a href="#" data-view="users" class="${state.currentView === 'users' ? 'active' : ''}"><span class="material-symbols-outlined">group</span> Users</a></li>
                <li><a href="#" data-view="calendar" class="${state.currentView === 'calendar' ? 'active' : ''}"><span class="material-symbols-outlined">calendar_month</span> Calendar</a></li>
            </ul>
            <div class="nav-footer">
                <button id="logoutBtn" class="btn-secondary">Logout</button>
            </div>
        </nav>
    `;
}

// Toggle sidebar for mobile
window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
};

// Utility to render FAB based on view
function getFabForView(view) {
    if (view === 'sessions') {
        return `<button class="fab" onclick="showSessionForm()">
                    <span class="material-symbols-outlined">add</span>
                    <span class="fab-label">Add Session</span>
                </button>`;
    }
    if (view === 'calendar') {
        return `<button class="fab" onclick="openNewBooking()">
                    <span class="material-symbols-outlined">add</span>
                    <span class="fab-label">Book Now</span>
                </button>`;
    }
    return '';
}

function renderDashboard() {
    const stats = [
        { label: 'Total Users', value: state.data.users?.length || 0, icon: 'group', view: 'users' },
        { label: 'Hosts', value: state.data.hosts?.length || 0, icon: 'domain', view: 'hosts' },
        { label: 'Venues', value: state.data.venues?.length || 0, icon: 'location_on', view: 'venues' },
        { label: 'Sessions', value: state.data.sessions?.length || 0, icon: 'event_note', view: 'sessions' },
        { label: 'Models', value: state.data.models?.length || 0, icon: 'person', view: 'models' },
        { label: 'Bookings', value: state.data.calendar?.length || 0, icon: 'calendar_month', view: 'calendar' }
    ];

    return `
        <div class="dashboard">
            <div class="content-header mobile-hidden">
                <h1>Dashboard</h1>
            </div>
            
            <div class="stats-grid">
                ${stats.map(stat => `
                    <div class="stat-card" onclick="navigateTo('${stat.view}')" style="cursor: pointer;">
                        <div class="stat-icon"><span class="material-symbols-outlined">${stat.icon}</span></div>
                        <span class="value">${stat.value}</span>
                        <p>${stat.label}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderHosts() {
    return `
        <div class="content">
            <div class="content-header">
                <h1>Hosts</h1>
                <button class="btn-primary" onclick="showHostForm()"><span class="material-symbols-outlined">add</span> Add Host</button>
            </div>
            <div class="card-grid">
                ${state.data.hosts.map(host => `
                    <div class="card">
                        <div class="card-header">
                            <h3>${host.name}</h3>
                            <span class="badge ${host.active ? 'badge-success' : 'badge-inactive'}">
                                ${host.active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div class="card-body">
                            <p class="card-description">${host.description || 'No description available'}</p>
                            ${host.instagram ? `<p class="card-meta"><span class="material-symbols-outlined">camera_alt</span> @${host.instagram}</p>` : ''}
                            ${host.website ? `<p class="card-meta"><span class="material-symbols-outlined">link</span> <a href="${host.website}" target="_blank">Website</a></p>` : ''}
                        </div>
                        <div class="card-footer">
                            <button class="btn-sm btn-secondary" onclick="editHost(${host.id})">Edit</button>
                            <button class="btn-sm btn-text-danger" onclick="deleteHost(${host.id})">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderVenues() {
    return `
        <div class="content">
            <div class="content-header">
                <h1>Venues</h1>
                <button class="btn-primary" onclick="showVenueForm()"><span class="material-symbols-outlined">add</span> Add Venue</button>
            </div>
            <div class="card-grid">
                ${state.data.venues.map(venue => `
                    <div class="card">
                        <div class="card-header">
                            <h3>${venue.host?.name || 'Unknown Host'}</h3>
                            <span class="badge badge-info">${venue.sessions?.length || 0} ${venue.sessions?.length === 1 ? 'Session' : 'Sessions'}</span>
                        </div>
                        <div class="card-body">
                            <p class="card-meta"><span class="material-symbols-outlined">location_on</span> ${venue.area || 'Unknown area'}</p>
                            ${venue.address ? `<p class="card-meta"><span class="material-symbols-outlined">home</span> ${venue.address}</p>` : ''}
                            ${venue.postcode ? `<p class="card-meta"><span class="material-symbols-outlined">markunread_mailbox</span> ${venue.postcode}</p>` : ''}
                        </div>
                        <div class="card-footer">
                            <button class="btn-sm btn-secondary" onclick="editVenue(${venue.id})">Edit</button>
                            <button class="btn-sm btn-text-danger" onclick="deleteVenue(${venue.id})">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

import { renderModelList } from './model-list.js';

// ... existing code ...

function renderModels() {
    return `
        <div class="content">
            <div class="content-header">
                <h1>Models</h1>
                <button class="btn-primary" onclick="openModelCreateModal()">
                    <span class="material-symbols-outlined">add</span> Add Model
                </button>
            </div>
            ${renderModelList(state.data.models, state.data.calendar)}
            ${renderModelModal()}
        </div>
    `;
}

function renderUsers() {
    return `
        <div class="content">
            <div class="content-header">
                <h1>Users</h1>
            </div>
            <div class="card-grid">
                ${(state.data.users || []).map(user => `
                    <div class="card" onclick="openUserEditModal(${user.id})" style="cursor: pointer;">
                        <div class="card-header">
                            <h3>${user.fullname || user.emailaddress || 'Unknown'}</h3>
                            <div>
                                ${user.is_admin ? '<span class="badge badge-info">Admin</span>' : ''}
                                <span class="badge ${user.active ? 'badge-success' : 'badge-inactive'}">
                                    ${user.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div class="card-body">
                            <p class="card-meta"><span class="material-symbols-outlined">mail</span> ${user.emailaddress}</p>
                            ${user.fullname ? `<p class="card-meta"><span class="material-symbols-outlined">person</span> ${user.fullname}</p>` : ''}
                            <p class="card-meta"><span class="material-symbols-outlined">badge</span> User ID: ${user.id}</p>
                            ${user.confirmed_on ? `<p class="card-meta"><span class="material-symbols-outlined">check_circle</span> Confirmed</p>` : '<p class="card-meta"><span class="material-symbols-outlined">pending</span> Pending</p>'}
                        </div>
                    </div>
                `).join('')}
            </div>
            ${renderUserModal()}
        </div>
    `;
}

// User Modal Component
function renderUserModal() {
    return `
    <div id="user-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit User</h2>
                <button class="modal-close" onclick="closeModal('user-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="user-form" onsubmit="saveUser(event)">
                    <input type="hidden" id="edit-user-id" name="id">
                    
                    <div class="form-section">
                        <h3 style="margin-bottom: 1rem; color: var(--md-sys-color-primary);">User Account</h3>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="edit-email" name="emailaddress" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Active Status</label>
                                <select id="edit-active" name="active">
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            </div>
                            <div class="form-group" style="display: flex; align-items: center; gap: 8px; padding-top: 24px;">
                                <input type="checkbox" id="edit-is_admin" name="is_admin" style="width: auto;"> 
                                <label for="edit-is_admin" style="margin: 0;">Grant Admin Access</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-divider" style="margin: 2rem 0; border-top: 1px solid var(--md-sys-color-outline-variant);"></div>

                    <div class="form-section">
                        <h3 style="margin-bottom: 1rem; color: var(--md-sys-color-primary);">Bio Profile</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" id="edit-fullname" name="fullname">
                            </div>
                            <div class="form-group">
                                <label>Known As</label>
                                <input type="text" id="edit-known_as" name="known_as">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Instagram (Username)</label>
                            <input type="text" id="edit-instagram" name="instagram">
                        </div>
                        <div class="form-group">
                            <label>Website URL</label>
                            <input type="url" id="edit-website" name="website">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="edit-description" name="description" rows="3"></textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal('user-modal')">Cancel</button>
                <button type="submit" form="user-form" class="btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
    `;
}

// Edit User Trigger
window.openUserEditModal = function (id) {
    console.log('Opening User Edit for ID:', id);
    // Use loose equality to handle both string and number IDs
    const user = state.data.users.find(u => u.id == id);
    if (!user) {
        console.error('User not found:', id);
        return;
    }

    // Populate Form Synchronously
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    const setCheck = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = val;
    };

    setVal('edit-user-id', user.id);
    setVal('edit-email', user.emailaddress || '');
    setVal('edit-active', user.active);
    setCheck('edit-is_admin', !!user.is_admin);

    setVal('edit-fullname', user.fullname || '');
    setVal('edit-known_as', user.known_as || '');
    setVal('edit-description', user.description || '');
    setVal('edit-instagram', user.instagram || '');

    // Handle websites
    let website = '';
    try {
        if (Array.isArray(user.websites) && user.websites.length > 0) website = user.websites[0];
        // Handle case where websites might be a JSON string from DB
        else if (typeof user.websites === 'string' && user.websites.startsWith('[')) {
            const parsed = JSON.parse(user.websites);
            if (parsed.length) website = parsed[0];
        } else if (typeof user.websites === 'string') {
            website = user.websites;
        }
    } catch (e) { console.error('Error parsing websites', e); }
    setVal('edit-website', website);

    showModal('user-modal');
};

// Save User Handler
window.saveUser = async function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');

    const data = {
        emailaddress: formData.get('emailaddress'),
        active: parseInt(formData.get('active')),
        is_admin: formData.get('is_admin') === 'on',
        fullname: formData.get('fullname'),
        known_as: formData.get('known_as'),
        instagram: formData.get('instagram'),
        description: formData.get('description'),
        websites: formData.get('website') ? [formData.get('website')] : []
    };

    try {
        await apiCall(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        await loadData('users');
        // Logic for closing is handled by re-rendering or manual close
        // Since showModal no longer renders, we should explicitly hide it
        const modal = document.getElementById('user-modal');
        if (modal) modal.style.display = 'none';

    } catch (error) {
        alert('Failed to update user: ' + error.message);
    }
};

function renderSessions() {
    return `
        <div class="content">
            <div class="content-header mobile-hidden">
                <h1>Sessions</h1>
            </div>
            <div class="card-grid">
                ${state.data.sessions.map(session => `
                    <div class="card">
                        <div class="card-header">
                            <h3>${session.host?.name || 'Unknown Host'}</h3>
                            <span class="badge ${session.active ? 'badge-success' : 'badge-inactive'}">
                                ${session.active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div class="card-body">
                            <p class="card-meta"><span class="material-symbols-outlined">location_on</span> ${session.venue?.area || 'Unknown'}</p>
                            <p class="card-meta"><span class="material-symbols-outlined">event</span> ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][session.week_day] || '-'} at ${session.start_time}</p>
                            <p class="card-meta"><span class="material-symbols-outlined">schedule</span> ${session.duration}h</p>
                            <div class="price-tags">
                                <span class="price-tag"><span class="material-symbols-outlined">payments</span> In-person: £${(session.price_inperson / 100).toFixed(2)}</span>
                                <span class="price-tag"><span class="material-symbols-outlined">computer</span> Online: £${(session.price_online / 100).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="btn-sm btn-secondary" onclick="editSession(${session.id})">Edit</button>
                            <button class="btn-sm btn-text-danger" onclick="deleteSession(${session.id})">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ${getFabForView('sessions')}
    `;
}


// Model Modal Component
function renderModelModal() {
    return `
    <div id="model-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Model</h2>
                <button class="modal-close" onclick="closeModal('model-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="model-form" onsubmit="saveModel(event)">
                    <input type="hidden" id="edit-model-id" name="id">
                    
                    <div class="form-section">
                        <h3 style="margin-bottom: 1rem; color: var(--md-sys-color-primary);">1. User Account</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email Address</label>
                                <input type="email" id="edit-model-email" name="email" placeholder="Required for new users">
                                <span class="form-hint">Used for login and notifications.</span>
                            </div>
                            <div class="form-group" id="model-password-group" style="display: none;">
                                <label>Initial Password</label>
                                <input type="text" id="edit-model-password" name="password" placeholder="Set initial password">
                                <span class="form-hint">Visible as text for initial setup.</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-divider" style="margin: 2rem 0; border-top: 1px solid var(--md-sys-color-outline-variant);"></div>

                    <div class="form-section">
                        <h3 style="margin-bottom: 1rem; color: var(--md-sys-color-primary);">2. Public Profile (User Bio)</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" id="edit-model-fullname" name="fullname" required>
                            </div>
                            <div class="form-group">
                                <label>Known As (Stage Name)</label>
                                <input type="text" id="edit-model-known_as" name="known_as">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Bio Instagram</label>
                                <input type="text" id="edit-model-bio-instagram" name="bio_instagram" placeholder="Legacy bio instagram">
                            </div>
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" id="edit-model-phone" name="phone">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Websites</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <input type="url" id="edit-model-website-1" name="website_1" placeholder="Website URL 1">
                                <input type="url" id="edit-model-website-2" name="website_2" placeholder="Website URL 2">
                                <input type="url" id="edit-model-website-3" name="website_3" placeholder="Website URL 3">
                            </div>
                        </div>
                         <div class="form-group">
                            <label>Bio / Description</label>
                            <textarea id="edit-model-description" name="description" rows="4"></textarea>
                        </div>
                    </div>

                    <div class="form-divider" style="margin: 2rem 0; border-top: 1px solid var(--md-sys-color-outline-variant);"></div>

                    <div class="form-section">
                        <h3 style="margin-bottom: 1rem; color: var(--md-sys-color-primary);">3. Model Configuration</h3>
                         <div class="form-row">
                            <div class="form-group">
                                <label>Active Status</label>
                                <select id="edit-model-active" name="active">
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Sex</label>
                                <select id="edit-model-sex" name="sex">
                                    <option value="0">Undefined</option>
                                    <option value="1">Male</option>
                                    <option value="2">Female</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                             <div class="form-group">
                                <label>Model Instagram</label>
                                <input type="text" id="edit-model-instagram" name="instagram" placeholder="Model specific portfolio">
                            </div>
                            <div class="form-group">
                                <label>Portrait Image Filename</label>
                                <input type="text" id="edit-model-portrait" name="portrait">
                            </div>
                        </div>
                        
                        <div class="form-group" style="background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;">
                             <label>Sells Online (Auto-calculated)</label>
                             <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="text" id="edit-model-sells-online" name="sells_online_display" disabled style="width: 100px;">
                                <span class="form-hint">Yes if URLs contain gumroad, patreon, etsy, or onlyfans.</span>
                             </div>
                        </div>

                        <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase;">Bank Details</h4>
                        <div class="form-group">
                            <label>Account Holder</label>
                            <input type="text" id="edit-model-account-holder" name="account_holder">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Account Number</label>
                                <input type="text" id="edit-model-account-number" name="account_number">
                            </div>
                            <div class="form-group">
                                <label>Sort Code</label>
                                <input type="text" id="edit-model-account-sortcode" name="account_sortcode">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal('model-modal')">Cancel</button>
                <button type="submit" form="model-form" class="btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
    `;
}

// Open Model Modal for Create
window.openModelCreateModal = function () {
    // Change Title
    const header = document.querySelector('#model-modal h2');
    if (header) header.textContent = 'Add New Model';

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('edit-model-id', '');
    setVal('edit-model-fullname', '');
    setVal('edit-model-email', '');
    setVal('edit-model-password', ''); // Clear password

    // Show password field for new models
    const pwdGroup = document.getElementById('model-password-group');
    if (pwdGroup) pwdGroup.style.display = 'block';

    setVal('edit-model-known_as', '');
    setVal('edit-model-sex', '0');
    setVal('edit-model-portrait', '');
    setVal('edit-model-active', '1');
    setVal('edit-model-email', '');
    setVal('edit-model-phone', '');
    setVal('edit-model-instagram', '');
    setVal('edit-model-bio-instagram', '');

    setVal('edit-model-sells-online', '');

    setVal('edit-model-account-holder', '');
    setVal('edit-model-account-number', '');
    setVal('edit-model-account-sortcode', '');

    setVal('edit-model-location', '');
    setVal('edit-model-description', '');

    setVal('edit-model-website-1', '');
    setVal('edit-model-website-2', '');
    setVal('edit-model-website-3', '');

    showModal('model-modal');
};

// Open Model Modal
window.viewModel = function (id) {
    const header = document.querySelector('#model-modal h2');
    if (header) header.textContent = 'Edit Model';

    // Hide password field for editing
    const pwdGroup = document.getElementById('model-password-group');
    if (pwdGroup) pwdGroup.style.display = 'none';

    const model = state.data.models.find(m => m.id == id);
    if (!model) {
        console.error('Model not found:', id);
        return;
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('edit-model-id', model.id);
    setVal('edit-model-id', model.id);
    setVal('edit-model-fullname', model.fullname);
    setVal('edit-model-known_as', model.known_as);
    setVal('edit-model-sex', model.sex);
    setVal('edit-model-portrait', model.portrait);
    setVal('edit-model-active', model.active ? '1' : '0');
    setVal('edit-model-email', model.email);
    setVal('edit-model-phone', model.phone);
    setVal('edit-model-instagram', model.instagram);
    setVal('edit-model-bio-instagram', model.bio_instagram);

    // Sells Online (Display only)
    setVal('edit-model-sells-online', model.sells_online ? 'Yes' : 'No');

    setVal('edit-model-account-holder', model.account_holder);
    setVal('edit-model-account-number', model.account_number);
    setVal('edit-model-account-sortcode', model.account_sortcode);

    setVal('edit-model-location', model.location);
    setVal('edit-model-description', model.description);

    // Website (handle array or string)
    let websites = [];
    try {
        if (Array.isArray(model.websites)) {
            websites = model.websites;
        } else if (model.websites && model.websites.startsWith('[')) {
            const parsed = JSON.parse(model.websites);
            if (Array.isArray(parsed)) websites = parsed;
        } else if (typeof model.websites === 'string' && model.websites.trim()) {
            websites = [model.websites]; // Fallback for single string
        }
    } catch (e) { console.error('Error parsing websites', e); }

    setVal('edit-model-website-1', websites[0] || '');
    setVal('edit-model-website-2', websites[1] || '');
    setVal('edit-model-website-3', websites[2] || '');

    showModal('model-modal');
};

// Save Model
window.saveModel = async function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');

    // Handle websites: collection of 3 inputs
    const websites = [
        formData.get('website_1'),
        formData.get('website_2'),
        formData.get('website_3')
    ].filter(url => url && url.trim().length > 0);

    // Calculate sells_online
    const sellKeywords = ['gumroad', 'patreon', 'etsy', 'onlyfans'];
    const sells_online = websites.some(url => {
        const lower = url.toLowerCase();
        return sellKeywords.some(keyword => lower.includes(keyword));
    }) ? 1 : 0;

    const data = {
        fullname: formData.get('fullname'),
        known_as: formData.get('known_as'),
        sex: parseInt(formData.get('sex') || 0),
        portrait: formData.get('portrait'),
        active: parseInt(formData.get('active')),
        email: formData.get('email'),
        password: formData.get('password'), // Add password to payload
        phone: formData.get('phone'),
        instagram: formData.get('instagram'),
        bio_instagram: formData.get('bio_instagram'),
        account_holder: formData.get('account_holder'),
        account_number: formData.get('account_number'),
        account_sortcode: formData.get('account_sortcode'),
        // location: formData.get('location'), // Removed from DB
        description: formData.get('description'),
        websites: websites,
        sells_online: sells_online
    };

    try {
        if (id) {
            await apiCall(`/api/models/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            if (!data.email) {
                throw new Error("Email is required for creating a new model user");
            }
            await apiCall(`/api/models`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        await loadData('models');
        // Manually close since we're not using render() to close
        const modal = document.getElementById('model-modal');
        if (modal) modal.style.display = 'none';

    } catch (error) {
        alert('Failed to update model: ' + error.message);
    }
};

// Calendar functions - add these to main.js after renderModels()

function renderCalendar() {
    const { currentMonth, currentYear } = state.calendar;

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

    // Group events by date
    const eventsByDate = {};
    state.data.calendar.forEach(event => {
        const date = new Date(event.date);
        date.setHours(0, 0, 0, 0); // Normalize event date
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const dateKey = date.getDate();
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        }
    });

    // Build calendar grid
    let calendarHTML = '<div class="calendar-grid">';

    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const events = eventsByDate[day] || [];
        const isToday = isCurrentMonth && day === today.getDate();

        // Check if this day is in the past
        const dayDate = new Date(state.calendar.currentYear, state.calendar.currentMonth, day);
        const isPastDay = dayDate < today;
        const weekdayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${events.length > 0 ? 'has-events' : ''} ${isPastDay ? 'past-day' : ''}" 
                 onclick="${!isPastDay ? `handleDateClick(${day}, ${events.length > 0})` : ''}">
                <div class="day-number"><span class="weekday-label">${weekdayName}</span> ${day}</div>
                <div class="day-events">
                    ${events.map(event => `
                        <div class="calendar-event ${event.tbc ? 'tbc' : ''} ${isPastDay ? 'past' : ''}" 
                             data-event-id="${event.id}"
                             onclick="handleEventClickWrapper(event, this.dataset.eventId)">
                            <div class="event-model">${event.fullname || 'Unknown'}</div>
                            <div class="event-venue">${event.venue_name || 'Unknown'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calendarHTML += '</div>';

    return `
        <div class="content">
            <div class="content-header">
                <div class="calendar-nav">
                    <button class="btn-sm" onclick="changeMonth(-1)"><span class="material-symbols-outlined">arrow_back</span></button>
                    <h1>${firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h1>
                    <button class="btn-sm" onclick="changeMonth(1)"><span class="material-symbols-outlined">arrow_forward</span></button>
                </div>
            </div>
            ${calendarHTML}
            ${renderBookingModal()}
        </div>
        ${getFabForView('calendar')}
        ${renderEventSelectionModal()}
    `;
}

// Calendar navigation
window.changeMonth = function (delta) {
    state.calendar.currentMonth += delta;
    if (state.calendar.currentMonth > 11) {
        state.calendar.currentMonth = 0;
        state.calendar.currentYear++;
    } else if (state.calendar.currentMonth < 0) {
        state.calendar.currentMonth = 11;
        state.calendar.currentYear--;
    }
    render();
};

// Handle date click (always create new booking on this date)
window.handleDateClick = function (day, hasEvents) {
    // Set the selected date
    state.calendar.selectedDate = new Date(state.calendar.currentYear, state.calendar.currentMonth, day);
    // Always create new booking when clicking the date background
    state.calendar.selectedEvent = null;
    render(); // Ensure modal exists
    showModal('booking-modal');
};

// Wrapper to handle event click with proper propagation stopping
window.handleEventClickWrapper = function (e, eventId) {
    e.stopPropagation();
    handleEventClick(eventId);
};

// Handle event click (existing booking)
window.handleEventClick = async function (eventId) {
    const event = state.data.calendar.find(e => e.id === eventId);
    if (event) {
        state.calendar.selectedEvent = event;
        state.calendar.selectedDate = new Date(event.date);
        render(); // Ensure modal exists
        showModal('booking-modal');
    }
};

// Open New Booking (FAB) - Default to Today
window.openNewBooking = function () {
    state.calendar.selectedDate = new Date();
    state.calendar.selectedEvent = null;
    render(); // Ensure modal exists
    showModal('booking-modal');
};

// Modal functions
window.showModal = function (modalId) {
    // render(); // Refactor: Don't re-render everything, just show the modal?
    // Actually, originally it called render() which might be overkill.
    // For User Edit, we definitely DON'T want to re-render and lose the modal HTML if it's dynamic.
    // But render() re-injects the HTML?
    // If render() is called, `renderUsers` runs, creating a NEW `user-modal` (hidden by default).
    // So calling render() inside showModal resets the modal state!
    // BUG FOUND: showModal calls render() which hides existing modals.

    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error('Modal not found:', modalId);
    }
}

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    state.calendar.selectedDate = null;
    state.calendar.selectedEvent = null;
};

// Handle booking date change - maintain local date
window.handleBookingDateChange = function (e) {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    state.calendar.selectedDate = new Date(y, m - 1, d);
    render();
    showModal('booking-modal');
};

// Render booking modal
function renderBookingModal() {
    const { selectedDate, selectedEvent } = state.calendar;
    if (!selectedDate && !selectedEvent) return '';

    const isEdit = !!selectedEvent;
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';

    // Check if event is in the past
    const eventDate = selectedDate || (selectedEvent ? new Date(selectedEvent.date) : new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = eventDate < today;

    // Find "Life Drawing Art" venue as default
    const lifeDrawingArt = state.data.venues.find(v =>
        v.host?.name && v.host.name.toLowerCase().includes('life drawing art')
    );
    const defaultVenueId = lifeDrawingArt?.id || (selectedEvent?.venue_id || '');

    // TBC state for button
    const isTBC = selectedEvent ? selectedEvent.tbc : false;

    return `
        <div id="booking-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit Booking' : 'New Booking'}</h2>
                    <button class="modal-close" onclick="closeModal('booking-modal')">×</button>
                </div>
                <div class="modal-body">
                    <form id="booking-form" onsubmit="saveBooking(event)">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" name="date" value="${dateStr}" onchange="window.handleBookingDateChange(event)" required ${isPast ? 'disabled' : ''}>
                        </div>
                            <input type="hidden" name="tbc" id="tbc-value" value="${isTBC ? '1' : '0'}">

                            <div class="form-group" style="position: relative;">
                                <label>Model</label>
                                <input type="hidden" name="user_id" id="booking-model-id" value="${selectedEvent?.user_id || ''}" required>
                                
                                <div style="display: flex; gap: 5px;">
                                    <div style="position: relative; flex-grow: 1;">
                                        <input type="text" 
                                               id="booking-model-search" 
                                               placeholder="Search model..."
                                               value="${(() => {
            // Populate initial value
            if (selectedEvent?.user_id == -1) return 'Closed';
            if (selectedEvent?.user_id == 0) return 'Unconfirmed';
            const m = state.data.models.find(m => m.user_id == selectedEvent?.user_id);
            return m ? m.fullname : '';
        })()}"
                                               oninput="window.filterBookingModels(event)"
                                               onkeydown="window.handleBookingModelKey(event)"
                                               onfocus="window.filterBookingModels(event)"
                                               onclick="window.filterBookingModels(event)"
                                               onblur="setTimeout(() => { document.getElementById('booking-model-results').style.display='none'; }, 200)"
                                               autocomplete="off"
                                               onblur="setTimeout(() => { document.getElementById('booking-model-results').style.display='none'; }, 200)"
                                               autocomplete="off"
                                               ${isPast ? 'disabled' : ''}
                                               style="width: 100%; padding-right: 50px;">
                                        
                                        <span id="booking-model-count" 
                                              style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); 
                                                     background: black; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; color: white; pointer-events: none;">
                                              ${state.data.models.length}
                                        </span>
                                    </div>
                                           
                                    <button type="button" class="btn-icon btn-sm" onclick="setBookingModelStatus(-1)" title="Set Closed (No Class)" ${isPast ? 'disabled' : ''}>⛔️</button>
                                    <button type="button" class="btn-icon btn-sm" onclick="setBookingModelStatus(0)" title="Set Unconfirmed (TBC)" ${isPast ? 'disabled' : ''}>⚠️</button>
                                    <button type="button" 
                                            class="btn-icon btn-sm ${state.ui?.filterNewModels ? 'active' : ''}" 
                                            onclick="toggleBookingUnbooked()" 
                                            title="Filter Unbooked Only"
                                            style="${state.ui?.filterNewModels ? 'background-color: black; color: white;' : ''}"
                                            ${isPast ? 'disabled' : ''}>⭐️</button>
                                </div>

                                <div id="booking-model-results" class="model-dropdown-results" style="display: none;">
                                    <!-- Populated by JS -->
                                </div>
                            </div>
                                <div class="form-group">
                                    <label>Model Status</label>
                                    <button type="button" id="tbc-toggle" class="tbc-button ${isTBC ? 'tbc' : 'confirmed'}" onclick="toggleTBC()" ${isPast ? 'disabled' : ''}>
                                        ${isTBC ? '<span class="material-symbols-outlined">warning</span> To Be Confirmed' : '<span class="material-symbols-outlined">check</span> Confirmed'}
                                    </button>
                                    <p class="form-hint">Click to toggle between Confirmed and TBC</p>
                                </div>

                                <div class="form-group">
                                    <label>Venue</label>
                                    <select name="venue_id" id="venue-select" onchange="handleVenueChange()" required ${isPast ? 'disabled' : ''}>
                                        <option value="">Select a venue...</option>
                                        ${(() => {
            // Filter venues based on the day of the week
            const dayOfWeek = eventDate.getDay(); // 0 (Sun) - 6 (Sat)
            const lifeDrawingArt = state.data.venues.find(v =>
                v.host?.name && v.host.name.toLowerCase().includes('life drawing art')
            );

            // Get venues that have sessions on this day
            const validVenues = state.data.venues.filter(venue =>
                venue.sessions && venue.sessions.some(s => s.week_day === dayOfWeek)
            );

            // Combine: Life Drawing Art first, then others (unique)
            const filteredVenues = [];
            if (lifeDrawingArt) filteredVenues.push(lifeDrawingArt);

            validVenues.forEach(v => {
                if (!lifeDrawingArt || v.id !== lifeDrawingArt.id) {
                    filteredVenues.push(v);
                }
            });

            return filteredVenues.map(venue => `
                                        <option value="${venue.id}" 
                                                data-sessions='${JSON.stringify(venue.sessions || [])}'
                                                ${(isEdit ? selectedEvent?.venue_id == venue.id : venue.id == defaultVenueId) ? 'selected' : ''}>
                                            ${venue.host?.name} - ${venue.area}
                                        </option>
                                    `).join('');
        })()}
                                    </select>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Start Time</label>
                                        <input type="time" id="start-time" name="start" value="${selectedEvent?.start || '19:00'}" required ${isPast ? 'disabled' : ''}>
                                    </div>
                                    <div class="form-group">
                                        <label>Duration (hours)</label>
                                        <input type="number" id="duration" name="duration" step="0.5" value="${selectedEvent?.duration || 2}" required ${isPast ? 'disabled' : ''}>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>In-Person Attendance</label>
                                        <input type="number" name="attendance_inperson" value="${selectedEvent?.attendance_inperson || 0}" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Online Attendance</label>
                                        <input type="number" name="attendance_online" value="${selectedEvent?.attendance_online || 0}" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Notes</label>
                                    <textarea name="notes" rows="3">${selectedEvent?.notes || ''}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            ${isEdit && !isPast ? `<button type="button" class="btn-danger" onclick="deleteBooking(${selectedEvent.id})">Delete</button>` : ''}
                            <button type="button" class="btn-secondary" onclick="closeModal('booking-modal')">Cancel</button>
                            <button type="submit" form="booking-form" class="btn-primary">${isEdit ? 'Update' : 'Create'} Booking</button>
                        </div>
                </div>
            </div>
    `;
}

// Handle venue change - update start time and duration from venue's first session
window.handleVenueChange = function () {
    const venueSelect = document.getElementById('venue-select');
    const selectedOption = venueSelect.options[venueSelect.selectedIndex];

    if (!selectedOption || !selectedOption.value) return;

    try {
        const sessions = JSON.parse(selectedOption.dataset.sessions || '[]');
        if (sessions.length > 0) {
            const firstSession = sessions[0];

            // Update start time
            const startTimeInput = document.getElementById('start-time');
            if (startTimeInput && firstSession.start_time) {
                // Convert "HH:MM:SS" to "HH:MM"
                const timeParts = firstSession.start_time.split(':');
                startTimeInput.value = `${timeParts[0]}:${timeParts[1]}`;
            }

            // Update duration
            const durationInput = document.getElementById('duration');
            if (durationInput && firstSession.duration) {
                durationInput.value = firstSession.duration;
            }
        }
    } catch (e) {
        console.error('Error parsing venue sessions:', e);
    }
};

// Toggle TBC button
window.toggleTBC = function () {
    const button = document.getElementById('tbc-toggle');
    const hiddenInput = document.getElementById('tbc-value');
    const currentValue = hiddenInput.value;

    if (currentValue === '1') {
        // Currently TBC, change to Confirmed
        hiddenInput.value = '0';
        button.className = 'tbc-button confirmed';
        button.innerHTML = '✓ Confirmed';
    } else {
        // Currently Confirmed, change to TBC
        hiddenInput.value = '1';
        button.className = 'tbc-button tbc';
        button.innerHTML = '⚠️ To Be Confirmed';
    }
};

// --- Model Autocomplete Logic ---

window.filterBookingModels = function (e) {
    const input = e.target;
    const term = input.value.toLowerCase();
    const resultsContainer = document.getElementById('booking-model-results');

    // Booking counts
    const counts = {};
    state.data.calendar.forEach(ev => {
        if (ev.user_id) counts[ev.user_id] = (counts[ev.user_id] || 0) + 1;
    });

    let models = state.data.models.filter(model => {
        // Text Match
        const name = (model.fullname || '').toLowerCase();
        const matchesTerm = name.includes(term);
        // Unbooked Filter
        if (state.ui?.filterNewModels && counts[model.user_id]) return false;

        return matchesTerm;
    });

    // Sort
    models.sort((a, b) => (a.fullname || '').localeCompare(b.fullname || ''));

    // Style results container
    resultsContainer.style.display = 'block';
    resultsContainer.style.position = 'absolute';
    resultsContainer.style.top = '100%';
    resultsContainer.style.left = '0';
    resultsContainer.style.right = '0';
    resultsContainer.style.backgroundColor = 'var(--md-sys-color-surface)';
    resultsContainer.style.border = '1px solid var(--md-sys-color-outline)';
    resultsContainer.style.zIndex = '1000';
    resultsContainer.style.maxHeight = '180px'; // Approx 5 rows
    resultsContainer.style.overflowY = 'auto';
    resultsContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    resultsContainer.style.borderRadius = '0 0 4px 4px';

    if (models.length === 0) {
        resultsContainer.innerHTML = '<div class="model-result-item" style="padding: 10px; cursor: default; color: #888;">No models found</div>';

        // Update count
        const countBadge = document.getElementById('booking-model-count');
        if (countBadge) countBadge.innerText = 0;

        return;
    }

    // Update count
    const countBadge = document.getElementById('booking-model-count');
    if (countBadge) countBadge.innerText = models.length;

    // Render results
    const threeWeeksAgo = Date.now() - (21 * 24 * 60 * 60 * 1000);

    resultsContainer.innerHTML = models.map(model => {
        const count = counts[model.user_id] || 0;
        // Highlight logic: Only unbooked models (count === 0) are paleblue
        const isUnbooked = count === 0;

        return `
            <div class="model-result-item" 
                 style="padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid #eee; ${isUnbooked ? 'background-color: #e3f2fd;' : 'background-color: white;'}"
                 onclick="selectBookingModel(${model.user_id}, '${model.fullname.replace(/'/g, "\\'")}')"
                 onmouseover="this.style.backgroundColor = '${isUnbooked ? '#bbdefb' : '#f5f5f5'}'"
                 onmouseout="this.style.backgroundColor = '${isUnbooked ? '#e3f2fd' : 'white'}'">
                <span>${model.fullname}</span>
                <span style="background: #eee; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; color: #666;">${count}</span>
            </div>
        `;
    }).join('');
};

window.selectBookingModel = function (id, name) {
    document.getElementById('booking-model-id').value = id;
    document.getElementById('booking-model-search').value = name;
    document.getElementById('booking-model-results').style.display = 'none';
};

window.setBookingModelStatus = function (status) {
    const idInput = document.getElementById('booking-model-id');
    const nameInput = document.getElementById('booking-model-search');

    let displayText = '';
    if (status === -1) displayText = 'Closed';
    else if (status === 0) displayText = 'Unconfirmed';

    if (displayText) {
        // Directly set the ID and text value
        // We do NOT search the models list because -1 and 0 are special "magic" IDs 
        // that likely don't correspond to real user records in the database.
        idInput.value = status;
        nameInput.value = displayText;
    }

    // Clear dropdown
    const results = document.getElementById('booking-model-results');
    if (results) results.style.display = 'none';
};

window.toggleBookingUnbooked = function () {
    state.ui.filterNewModels = !state.ui.filterNewModels;
    // Re-trigger filter
    const input = document.getElementById('booking-model-search');
    if (input) {
        // Focus and trigger input event to refresh list
        input.focus();
        input.dispatchEvent(new Event('input'));
    }
    // Update button active state manually since we are not re-rendering the whole modal
    // Actually, calling filterBookingModels handles the list, but not the button class.
    // The user requested a re-render before, but let's try to be smarter.
    // Re-rendering everything is safer for button state.
    const modalContainer = document.getElementById('booking-modal');
    if (modalContainer) {
        const newModalHTML = renderBookingModal();
        modalContainer.outerHTML = newModalHTML;
        const newModal = document.getElementById('booking-modal');
        if (newModal) newModal.style.display = 'flex';
        // After re-render, focus input
        const newInput = document.getElementById('booking-model-search');
        if (newInput) {
            newInput.focus();
            newInput.dispatchEvent(new Event('input')); // Show results immediately
        }
    }
};

window.handleBookingModelKey = function (e) {
    if (e.key === 'Escape') {
        e.target.value = '';
        document.getElementById('booking-model-id').value = '';
        window.filterBookingModels(e); // Clear results
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const results = document.getElementById('booking-model-results');
        // If visible and has items
        if (results.style.display !== 'none' && results.children.length > 0) {
            const firstItem = results.children[0];
            // If it's the "No models found" message, clear
            if (firstItem.innerText.includes('No models found')) {
                e.target.value = '';
                document.getElementById('booking-model-id').value = '';
                window.filterBookingModels(e);
            } else {
                // Trigger click on first item
                firstItem.click();
            }
        } else {
            // No results, clear
            e.target.value = '';
            document.getElementById('booking-model-id').value = '';
            window.filterBookingModels(e);
        }
    }
};

// Global click to close dropdown
window.addEventListener('click', function (e) {
    const container = document.querySelector('.form-group[style*="relative"]'); // A bit weak selector
    if (container && !container.contains(e.target)) {
        const results = document.getElementById('booking-model-results');
        if (results) results.style.display = 'none';
    }
});

// Save booking
window.saveBooking = async function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const data = {
        date: formData.get('date'),
        user_id: parseInt(formData.get('user_id')),
        venue_id: parseInt(formData.get('venue_id')),
        start: formData.get('start'),
        duration: parseFloat(formData.get('duration')),
        attendance_inperson: parseInt(formData.get('attendance_inperson')),
        attendance_online: parseInt(formData.get('attendance_online')),
        notes: formData.get('notes'),
        tbc: parseInt(formData.get('tbc'))  // Read from hidden input (0 or 1)
    };

    try {
        const isEdit = !!state.calendar.selectedEvent;
        const endpoint = isEdit ? `/api/calendar/${state.calendar.selectedEvent.id}` : '/api/calendar';
        const method = isEdit ? 'PUT' : 'POST';

        await apiCall(endpoint, {
            method,
            body: JSON.stringify(data)
        });

        // Reload calendar data
        await loadData('calendar');
        closeModal('booking-modal');
    } catch (error) {
        alert('Failed to save booking: ' + error.message);
    }
};

// Delete booking
window.deleteBooking = async function (id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
        await apiCall(`/api/calendar/${id}`, { method: 'DELETE' });
        await loadData('calendar');
        closeModal('booking-modal');
    } catch (error) {
        alert('Failed to delete booking: ' + error.message);
    }
};

// Render event selection modal (for dates with multiple events)
function renderEventSelectionModal() {
    const { dayEvents, selectedDate } = state.calendar;
    if (!dayEvents || dayEvents.length === 0) return '';

    const dateStr = selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

    return `
        <div id="event-selection-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Events on ${dateStr}</h2>
                    <button class="modal-close" onclick="closeEventSelectionModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="event-list">
                        ${dayEvents.map(event => `
                            <div class="event-list-item" onclick="selectEventToEdit(${event.id})">
                                <div class="event-list-model">${event.fullname || 'Unknown'}</div>
                                <div class="event-list-venue">${event.venue_name || 'Unknown'} - ${event.start}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeEventSelectionModal()">Cancel</button>
                    <button class="btn-primary" onclick="createNewOnSelectedDate()">+ Add Another Booking</button>
                </div>
            </div>
        </div>
        `;
}

window.closeEventSelectionModal = function () {
    const modal = document.getElementById('event-selection-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    state.calendar.dayEvents = null;
};

window.selectEventToEdit = function (eventId) {
    const event = state.data.calendar.find(e => e.id === eventId);
    if (event) {
        state.calendar.selectedEvent = event;
        state.calendar.selectedDate = new Date(event.date);
        closeEventSelectionModal();
        showModal('booking-modal');
    }
};

window.createNewOnSelectedDate = function () {
    state.calendar.selectedEvent = null;
    closeEventSelectionModal();
    showModal('booking-modal');
};

function render() {
    const app = document.getElementById('app');

    if (!state.token) {
        app.innerHTML = renderLogin();
        attachLoginHandlers();
        return;
    }

    const viewRenderers = {
        dashboard: renderDashboard,
        hosts: renderHosts,
        venues: renderVenues,
        sessions: renderSessions,
        models: renderModels,
        users: renderUsers,
        calendar: renderCalendar
    };

    app.innerHTML = `
        ${renderNav()}
    <main class="main-content">
        ${viewRenderers[state.currentView]?.() || renderDashboard()}
    </main>
    `;

    attachHandlers();

    // Auto-focus search input if on models page
    if (state.currentView === 'models') {
        const searchInput = document.getElementById('model-search-input');
        if (searchInput) {
            // Small timeout to ensure DOM is ready
            setTimeout(() => {
                searchInput.focus();
                // Ensure text cursor is at the end if there's value
                const len = searchInput.value.length;
                searchInput.setSelectionRange(len, len);
            }, 0);
        }
    }
}

window.render = render;

function attachLoginHandlers() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }
}

function attachHandlers() {
    // Nav links
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;
            showView(view);
            if (view !== 'dashboard') {
                loadData(view);
            }
            // Close sidebar on mobile after clicking
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Initialize
async function init() {
    // Check if already logged in
    if (state.token) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            state.user = JSON.parse(savedUser);
        }

        // Load initial data
        await Promise.all([
            loadData('hosts'),
            loadData('venues'),
            loadData('sessions'),
            loadData('models'),
            loadData('users'),
            loadData('calendar')
        ]);
    }

    render();
}

// Start the app
init();
