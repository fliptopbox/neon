/**
 * Dashboard View
 * Admin overview matching admin_dashboard_overview mockup
 */

import { state } from '../app.js';

/**
 * Render the dashboard view
 */
export function renderDashboard() {
    const { users, hosts, models, calendar } = state.data;

    return `
        <div class="flex flex-col pb-4">
            <!-- Stats Cards (Horizontal Scroll) -->
            <div class="mt-4">
                <h3 class="text-lg font-bold text-gray-900 px-4 mb-3">Overview</h3>
                <div class="flex overflow-x-auto no-scrollbar px-4 gap-4 pb-2">
                    ${renderStatCard('Users', users.length, 'group', '#6366f1')}
                    ${renderStatCard('Hosts', hosts.length, 'storefront', '#0ea5e9')}
                    ${renderStatCard('Models', models.length, 'accessibility_new', '#a855f7')}
                    ${renderStatCard('Sessions', calendar.length, 'calendar_month', '#22c55e')}
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="mt-6">
                <h3 class="text-lg font-bold text-gray-900 px-4 mb-3">Quick Actions</h3>
                <div class="flex overflow-x-auto no-scrollbar px-4 gap-3 pb-2">
                    <button onclick="navigate('users')" 
                            class="flex items-center gap-2 h-11 px-5 bg-white border border-gray-200 rounded-full shadow-sm shrink-0">
                        <span class="material-symbols-outlined text-primary text-[20px]">person_add</span>
                        <span class="text-sm font-semibold text-gray-700">Add User</span>
                    </button>
                    <button onclick="navigate('hosts')" 
                            class="flex items-center gap-2 h-11 px-5 bg-white border border-gray-200 rounded-full shadow-sm shrink-0">
                        <span class="material-symbols-outlined text-primary text-[20px]">add_business</span>
                        <span class="text-sm font-semibold text-gray-700">Add Host</span>
                    </button>
                    <button onclick="navigate('calendar')" 
                            class="flex items-center gap-2 h-11 px-5 bg-white border border-gray-200 rounded-full shadow-sm shrink-0">
                        <span class="material-symbols-outlined text-primary text-[20px]">calendar_add_on</span>
                        <span class="text-sm font-semibold text-gray-700">New Session</span>
                    </button>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="mt-6 px-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-bold text-gray-900">Recent Activity</h3>
                    <button onclick="navigate('users')" class="text-primary text-sm font-bold">View All</button>
                </div>
                <div class="space-y-3">
                    ${renderRecentActivity()}
                </div>
            </div>
            
            <!-- Navigation Cards -->
            <div class="mt-6 px-4">
                <h3 class="text-lg font-bold text-gray-900 mb-3">Manage</h3>
                <div class="grid grid-cols-2 gap-3">
                    ${renderNavCard('Users', 'group', users.length, 'users')}
                    ${renderNavCard('Hosts', 'storefront', hosts.length, 'hosts')}
                    ${renderNavCard('Models', 'accessibility_new', models.length, 'models')}
                    ${renderNavCard('Calendar', 'calendar_month', calendar.length, 'calendar')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render a stat card
 */
function renderStatCard(label, count, icon, color) {
    return `
        <div class="flex flex-col gap-2 min-w-[140px] bg-white p-4 rounded-2xl shadow-sm border border-gray-100 shrink-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" 
                 style="background-color: ${color}20;">
                <span class="material-symbols-outlined" style="color: ${color};">${icon}</span>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">${formatNumber(count)}</p>
                <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">${label}</p>
            </div>
        </div>
    `;
}

/**
 * Render a navigation card
 */
function renderNavCard(label, icon, count, view) {
    return `
        <button onclick="navigate('${view}')" 
                class="card p-4 text-left hover:shadow-md transition-shadow" 
                data-navigate="${view}">
            <span class="material-symbols-outlined text-primary text-[28px]">${icon}</span>
            <p class="font-semibold text-gray-900 mt-2">${label}</p>
            <p class="text-sm text-gray-500">${count} ${label.toLowerCase()}</p>
        </button>
    `;
}

/**
 * Render recent activity (placeholder)
 */
function renderRecentActivity() {
    const activities = [
        { icon: 'verified_user', color: 'green', title: 'New User Registered', subtitle: 'Just now', iconBg: 'bg-green-100' },
        { icon: 'event_available', color: 'blue', title: 'Session Created', subtitle: '5 minutes ago', iconBg: 'bg-blue-100' },
        { icon: 'person_add', color: 'purple', title: 'Model Added', subtitle: '1 hour ago', iconBg: 'bg-purple-100' },
    ];

    return activities.map(a => `
        <div class="card p-4 flex items-center gap-4">
            <div class="w-10 h-10 rounded-full ${a.iconBg} flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-${a.color}-600 text-[20px]">${a.icon}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm">${a.title}</p>
                <p class="text-xs text-gray-500">${a.subtitle}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Format large numbers
 */
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}
