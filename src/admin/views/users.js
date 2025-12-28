/**
 * Users View
 * Matches user_management_1 mockup
 */

import { state } from '../app.js';

/**
 * Render the users list view
 */
export function renderUsers() {
    const users = state.data.users || [];

    return `
        <div class="flex flex-col">
            <!-- Search Bar -->
            <div class="px-4 py-3 sticky top-[72px] z-10 bg-background-light">
                <div class="search-container">
                    <span class="icon material-symbols-outlined">search</span>
                    <input 
                        type="text" 
                        id="search-users"
                        class="input-field"
                        placeholder="Search by name or email..."
                    />
                </div>
            </div>
            
            <!-- Filter Chips -->
            <div class="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar">
                <button class="chip chip-active" data-filter="all">All</button>
                <button class="chip chip-default" data-filter="active">Active</button>
                <button class="chip chip-default" data-filter="admin">Admins</button>
                <button class="chip chip-default" data-filter="inactive">Inactive</button>
            </div>
            
            <!-- Users List -->
            <div id="users-list" class="mt-2 px-4 pb-4 cards-grid">
                ${users.length === 0
            ? '<div class="flex justify-center py-8 col-span-full"><div class="spinner"></div></div>'
            : users.map(user => renderUserItem(user)).join('')
        }
            </div>
            
            <!-- FAB: Add User -->
            <button id="add-user-btn" 
                    class="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 
                           bg-primary text-white rounded-full shadow-lg 
                           flex items-center justify-center
                           hover:bg-primary-light active:scale-95 transition-all
                           z-20">
                <span class="material-symbols-outlined text-[28px]">person_add</span>
            </button>
        </div>
    `;
}

/**
 * Render a single user list item
 */
function renderUserItem(user) {
    const isActive = user.active || user.is_global_active;
    const isAdmin = user.is_admin;
    const fullname = user.fullname || extractNameFromEmail(user.email || user.emailaddress);
    const email = user.email || user.emailaddress;

    // Determine status
    let status = 'active';
    let statusLabel = 'Active';
    let statusClass = 'badge-success';

    if (!isActive) {
        status = 'inactive';
        statusLabel = 'Inactive';
        statusClass = 'badge-error';
    } else if (isAdmin) {
        statusLabel = 'Admin';
        statusClass = 'badge-info';
    }

    // Generate avatar initials
    const initials = getInitials(fullname);
    const avatarColor = getAvatarColor(user.id || 0);

    return `
        <div class="card p-4 flex items-center gap-4 cursor-pointer"
             data-user-id="${user.id}"
             data-user-name="${fullname}"
             data-user-email="${email}"
             data-user-status="${isAdmin ? 'admin' : status}">
            
            <!-- Avatar with status indicator -->
            <div class="relative shrink-0">
                <div class="avatar flex items-center justify-center text-white font-semibold text-sm"
                     style="background-color: ${avatarColor};">
                    ${initials}
                </div>
                <span class="status-dot ${status}"></span>
            </div>
            
            <!-- User Info -->
            <div class="flex flex-col justify-center flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                    <p class="text-gray-900 text-base font-semibold leading-tight truncate">
                        ${fullname}
                    </p>
                    <span class="badge ${statusClass} shrink-0">${statusLabel}</span>
                </div>
                <p class="text-gray-500 text-sm font-normal leading-normal truncate mt-0.5">
                    ${email}
                </p>
            </div>
            
            <!-- Action -->
            <button class="btn-icon shrink-0" onclick="event.stopPropagation()">
                <span class="material-symbols-outlined text-gray-400">more_vert</span>
            </button>
        </div>
    `;
}

/**
 * Extract a display name from an email address
 */
function extractNameFromEmail(email) {
    if (!email) return 'Unknown';

    const localPart = email.split('@')[0];
    // Convert kebab-case or dots to spaces and title case
    return localPart
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get initials from a name
 */
function getInitials(name) {
    if (!name) return '?';

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get a consistent avatar color based on ID
 */
function getAvatarColor(id) {
    const colors = [
        '#6366f1', // indigo
        '#8b5cf6', // violet
        '#a855f7', // purple
        '#d946ef', // fuchsia
        '#ec4899', // pink
        '#f43f5e', // rose
        '#ef4444', // red
        '#f97316', // orange
        '#eab308', // yellow
        '#22c55e', // green
        '#14b8a6', // teal
        '#06b6d4', // cyan
        '#0ea5e9', // sky
        '#3b82f6', // blue
    ];
    return colors[id % colors.length];
}
