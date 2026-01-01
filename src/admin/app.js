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
import { renderDashboard, attachDashboardHandlers } from './views/dashboard.js';
import { renderUsers, attachUsersHandlers } from './views/users.js';
import { renderModels, attachModelsHandlers } from './views/models.js';
import { renderHosts, attachHostsHandlers } from './views/hosts.js';
import { renderVenues, attachVenuesHandlers } from './views/venues.js';
import { renderEvents, attachEventsHandlers } from './views/events.js';
import { renderCalendar, attachCalendarHandlers } from './views/calendar.js';
import { renderExchangeRates, attachExchangeRatesHandlers } from './views/exchange-rates.js';

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
        events: [],
        rates: [],
    },
    loading: false,
    filters: {},
};

// --- Router ---
const routes = {
    'login': renderLogin,
    'dashboard': renderDashboard,
    'users': renderUsers,
    'models': renderModels,
    'hosts': renderHosts,
    'venues': renderVenues,
    'events': renderEvents,
    'calendar': renderCalendar,
    'exchange-rates': renderExchangeRates,
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
        navigate('dashboard');
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
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
        { id: 'users', icon: 'group', label: 'Users' },
        { id: 'models', icon: 'person_search', label: 'Models' },
        { id: 'hosts', icon: 'storefront', label: 'Hosts' },
        { id: 'venues', icon: 'location_on', label: 'Venues' },
        { id: 'events', icon: 'event', label: 'Events' },
        { id: 'calendar', icon: 'calendar_month', label: 'Calendar' },
        { id: 'exchange-rates', icon: 'currency_exchange', label: 'Rates' },
    ];

    return `
        <aside class="sidebar">
            <div class="sidebar-brand">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary">palette</span>
                </div>
                <div>
                    <h1 class="font-bold text-gray-900">Neon Admin</h1>
                    <p class="text-xs text-gray-500">Life Drawing Platform</p>
                </div>
            </div>

            <nav class="sidebar-nav">
                ${navItems.map(item => `
                    <a href="#${item.id}" 
                       class="sidebar-item ${activeView === item.id ? 'active' : ''}">
                        <span class="material-symbols-outlined">${item.icon}</span>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </nav>

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
        'dashboard': 'Dashboard',
        'users': 'Users',
        'models': 'Models',
        'hosts': 'Hosts',
        'venues': 'Venues',
        'events': 'Events',
        'calendar': 'Calendar',
        'exchange-rates': 'Exchange Rates',
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

            navigate('dashboard');
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
        case 'dashboard':
            attachDashboardHandlers();
            break;
        case 'users':
            attachUsersHandlers();
            break;
        case 'models':
            attachModelsHandlers();
            break;
        case 'hosts':
            attachHostsHandlers();
            break;
        case 'venues':
            attachVenuesHandlers();
            break;
        case 'events':
            attachEventsHandlers();
            break;
        case 'calendar':
            attachCalendarHandlers();
            break;
        case 'exchange-rates':
            attachExchangeRatesHandlers();
            break;
    }
}

// --- Logout ---
export function handleLogout() {
    API.logout();
    state.user = null;
    state.isAuthenticated = false;
    state.data = { users: [], hosts: [], models: [], venues: [], calendar: [], events: [], rates: [] };
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
