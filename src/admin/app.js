/**
 * Neon Admin - Main Application
 * Mobile-first SPA with hash-based routing
 */

import * as API from './client.js';

// --- Components ---
import { renderNav } from './components/nav.js';
import { renderHeader } from './components/header.js';
import { showToast } from './components/toast.js';
import { showModal, closeModal } from './components/modal.js';

// --- Views ---
import { renderLogin } from './views/login.js';
import { renderUsers } from './views/users.js';
import { renderHosts } from './views/hosts.js';
import { renderModels } from './views/models.js';
import { renderCalendar } from './views/calendar.js';
import { renderUserDetail } from './views/user-detail.js';
import { renderProfile, attachProfileHandlers } from './views/profile.js';
import { renderDashboard } from './views/dashboard.js';

// --- Application State ---
export const state = {
    user: API.getUser(),
    isAuthenticated: API.isAuthenticated(),
    currentView: 'login',
    data: {
        users: [],
        hosts: [],
        models: [],
        venues: [],
        calendar: [],
    },
    loading: false,
    filters: {},
};

// --- Router ---
const routes = {
    'login': renderLogin,
    'users': renderUsers,
    'hosts': renderHosts,
    'models': renderModels,
    'calendar': renderCalendar,
    'dashboard': renderDashboard,
    'profile': renderProfile,
};

/**
 * Navigate to a view
 */
export function navigate(view) {
    if (!API.isAuthenticated() && view !== 'login') {
        view = 'login';
    }

    window.location.hash = view;
}

/**
 * Handle route changes
 */
function handleRoute() {
    const hash = window.location.hash.slice(1) || 'login';

    // Check auth
    if (!API.isAuthenticated() && hash !== 'login') {
        navigate('login');
        return;
    }

    // Redirect authenticated users away from login
    if (API.isAuthenticated() && hash === 'login') {
        const user = API.getUser();
        if (user.isAdmin) {
            navigate('dashboard');
        } else {
            navigate('profile');
        }
        return;
    }

    state.currentView = hash;
    render();
}

/**
 * Main render function
 */
export function render() {
    const app = document.getElementById('app');
    const view = state.currentView;
    const renderView = routes[view] || routes['login'];

    // Login view (no nav/header)
    if (view === 'login') {
        app.innerHTML = renderView();
        attachLoginHandlers();
        return;
    }

    // Authenticated views with responsive layout
    app.innerHTML = `
        <div class="app-layout">
            <!-- Sidebar (visible on tablet/desktop) -->
            ${renderSidebar(view)}
            
            <!-- Main Content Area -->
            <div class="main-content">
                <div class="flex flex-col min-h-screen pb-20">
                    ${renderHeader(getViewTitle(view))}
                    <main class="flex-1 view">
                        <div class="content-container">
                            ${renderView()}
                        </div>
                    </main>
                    <!-- Bottom Nav (visible on mobile only) -->
                    ${state.user?.isAdmin ? renderNav(view) : ''}
                </div>
            </div>
        </div>
    `;

    attachViewHandlers(view);
}

/**
 * Render sidebar navigation (for tablet/desktop)
 */
function renderSidebar(activeView) {
    // Hide sidebar for non-admins
    if (!state.user?.isAdmin) {
        return '';
    }

    const navItems = [
        { id: 'users', icon: 'group', label: 'Users' },
        { id: 'hosts', icon: 'storefront', label: 'Hosts' },
        { id: 'models', icon: 'accessibility_new', label: 'Models' },
        { id: 'calendar', icon: 'calendar_month', label: 'Calendar' },
    ];

    return `
        <aside class="sidebar">
            <!-- Brand -->
            <div class="sidebar-brand">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">palette</span>
                </div>
                <div>
                    <h1 class="font-bold text-gray-900">Neon Admin</h1>
                    <p class="text-xs text-gray-500">Life Drawing Platform</p>
                </div>
            </div>
            
            <!-- Navigation -->
            <nav class="sidebar-nav">
                ${navItems.map(item => `
                    <a href="#${item.id}" 
                       class="sidebar-item ${activeView === item.id ? 'active' : ''}">
                        <span class="material-symbols-outlined">${item.icon}</span>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </nav>
            
            <!-- Footer -->
            <div class="sidebar-footer">
                <button onclick="handleLogout()" 
                        class="flex items-center gap-3 w-full px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                    <span class="material-symbols-outlined">logout</span>
                    <span class="text-sm font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    `;
}

/**
 * Get view title for header
 */
function getViewTitle(view) {
    const titles = {
        'users': 'Users',
        'hosts': 'Hosts',
        'models': 'Models',
        'calendar': 'Calendar',
        'dashboard': 'Dashboard',
    };
    return titles[view] || 'Neon Admin';
}

/**
 * Attach login form handlers
 */
function attachLoginHandlers() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const errorEl = document.getElementById('login-error');

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="width:1.25rem;height:1.25rem;border-width:2px;"></span>';
        errorEl.classList.add('hidden');

        try {
            const data = await API.login(email, password);
            state.user = data.user;
            state.isAuthenticated = true;

            showToast('Welcome back!');

            if (state.user.isAdmin) {
                navigate('dashboard');
            } else {
                navigate('profile');
            }
        } catch (error) {
            errorEl.textContent = error.message || 'Invalid credentials';
            errorEl.classList.remove('hidden');

            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In';
        }
    });
}

/**
 * Attach view-specific handlers
 */
function attachViewHandlers(view) {
    switch (view) {
        case 'users':
            attachUsersHandlers();
            break;
        case 'hosts':
            attachHostsHandlers();
            break;
        case 'models':
            attachModelsHandlers();
            break;
        case 'calendar':
            attachCalendarHandlers();
            break;
        case 'dashboard':
            attachDashboardHandlers();
            break;
        case 'profile':
            attachProfileHandlers();
            break;
    }
}

// --- View Handlers ---

async function attachUsersHandlers() {
    // Load data if needed
    if (state.data.users.length === 0) {
        await loadUsers();
    }

    // Search
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterUsers(e.target.value);
        });
    }

    // Filter chips
    document.querySelectorAll('[data-filter]').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            setUserFilter(filter);
        });
    });

    // List items
    document.querySelectorAll('[data-user-id]').forEach(item => {
        item.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.userId;
            openUserDetail(id);
        });
    });

    // Add User FAB
    const addUserBtn = document.getElementById('add-user-btn');
    addUserBtn?.addEventListener('click', () => {
        openAddUserModal();
    });
}

async function loadUsers() {
    const container = document.getElementById('users-list');
    if (!container) return;

    container.innerHTML = '<div class="flex justify-center py-8"><div class="spinner"></div></div>';

    try {
        state.data.users = await API.getUsers();
        render(); // Re-render with data
    } catch (error) {
        container.innerHTML = `<p class="text-center text-red-500 py-8">${error.message}</p>`;
    }
}

function filterUsers(query) {
    const items = document.querySelectorAll('[data-user-id]');
    const q = query.toLowerCase();

    items.forEach(item => {
        const name = item.dataset.userName?.toLowerCase() || '';
        const email = item.dataset.userEmail?.toLowerCase() || '';
        const visible = name.includes(q) || email.includes(q);
        item.style.display = visible ? '' : 'none';
    });
}

function setUserFilter(filter) {
    // Update chip states
    document.querySelectorAll('[data-filter]').forEach(chip => {
        if (chip.dataset.filter === filter) {
            chip.classList.remove('chip-default');
            chip.classList.add('chip-active');
        } else {
            chip.classList.remove('chip-active');
            chip.classList.add('chip-default');
        }
    });

    // Filter items
    const items = document.querySelectorAll('[data-user-id]');

    items.forEach(item => {
        if (filter === 'all') {
            item.style.display = '';
            return;
        }

        const status = item.dataset.userStatus;
        item.style.display = status === filter ? '' : 'none';
    });
}

function openUserDetail(id) {
    const user = state.data.users.find(u => u.id == id);
    if (!user) return;

    // Import dynamically to avoid circular deps
    import('./views/user-detail.js').then(module => {
        showModal(module.renderUserDetail(user), 'user-detail');
        module.attachUserDetailHandlers(user);
    });
}

function openAddUserModal() {
    import('./views/user-detail.js').then(module => {
        showModal(module.renderAddUser(), 'add-user');
        module.attachAddUserHandlers();
    });
}

async function attachHostsHandlers() {
    if (state.data.hosts.length === 0) {
        await loadHosts();
    }

    // Search
    const searchInput = document.getElementById('search-hosts');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterHosts(e.target.value);
        });
    }
}

async function loadHosts() {
    const container = document.getElementById('hosts-list');
    if (!container) return;

    container.innerHTML = '<div class="flex justify-center py-8"><div class="spinner"></div></div>';

    try {
        state.data.hosts = await API.getHosts();
        render();
    } catch (error) {
        container.innerHTML = `<p class="text-center text-red-500 py-8">${error.message}</p>`;
    }
}

function filterHosts(query) {
    const items = document.querySelectorAll('[data-host-id]');
    const q = query.toLowerCase();

    items.forEach(item => {
        const name = item.dataset.hostName?.toLowerCase() || '';
        const visible = name.includes(q);
        item.style.display = visible ? '' : 'none';
    });
}

async function attachModelsHandlers() {
    if (state.data.models.length === 0) {
        await loadModels();
    }

    const searchInput = document.getElementById('search-models');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterModels(e.target.value);
        });
    }

    // Attach click handlers to model cards
    const list = document.getElementById('models-list');
    if (list) {
        list.addEventListener('click', async (e) => {
            const card = e.target.closest('[data-model-id]');
            if (card) {
                const id = card.dataset.modelId;
                const module = await import('./views/model-detail.js');
                module.renderModelDetail(id);
            }
        });
    }
}

async function loadModels() {
    const container = document.getElementById('models-list');
    if (!container) return;

    container.innerHTML = '<div class="flex justify-center py-8"><div class="spinner"></div></div>';

    try {
        state.data.models = await API.getModels();
        render();
    } catch (error) {
        container.innerHTML = `<p class="text-center text-red-500 py-8">${error.message}</p>`;
    }
}

function filterModels(query) {
    const items = document.querySelectorAll('[data-model-id]');
    const q = query.toLowerCase();

    items.forEach(item => {
        const name = item.dataset.modelName?.toLowerCase() || '';
        const visible = name.includes(q);
        item.style.display = visible ? '' : 'none';
    });
}

async function attachCalendarHandlers() {
    if (state.data.calendar.length === 0) {
        await loadCalendar();
    }
}

async function loadCalendar() {
    try {
        state.data.calendar = await API.getCalendar();
        render();
    } catch (error) {
        console.error('Failed to load calendar:', error);
    }
}

function attachDashboardHandlers() {
    // Dashboard click handlers
    document.querySelectorAll('[data-navigate]').forEach(el => {
        el.addEventListener('click', () => {
            navigate(el.dataset.navigate);
        });
    });
}

// --- Logout ---
export function handleLogout() {
    API.logout();
    state.user = null;
    state.isAuthenticated = false;
    state.data = { users: [], hosts: [], models: [], venues: [], calendar: [] };
    navigate('login');
    showToast('Signed out');
}

// Make functions available globally for onclick handlers
window.navigate = navigate;
window.handleLogout = handleLogout;
window.showModal = showModal;
window.closeModal = closeModal;
window.showToast = showToast;

// --- Initialize ---
window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', () => {
    handleRoute();
});
