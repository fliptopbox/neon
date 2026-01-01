/**
 * Users List View
 */

import * as API from '../client.js';
import { showModal } from '../components/modal.js';
import { renderUserDetail, renderAddUser, attachUserDetailHandlers, attachAddUserHandlers } from './user-detail.js';

export function renderUsers() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="relative flex-1 w-full md:max-w-md">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input type="text" id="search-users" placeholder="Search users by name or email..." 
                        class="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                </div>
                
                <button id="add-user-btn" class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95">
                    <span class="material-symbols-outlined">add</span>
                    <span>Add User</span>
                </button>
            </div>

            <!-- Filters -->
            <div class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                <button class="chip chip-active whitespace-nowrap" data-filter="all">All Users</button>
                <button class="chip chip-default whitespace-nowrap" data-filter="admin">Admins</button>
                <button class="chip chip-default whitespace-nowrap" data-filter="active">Active</button>
                <button class="chip chip-default whitespace-nowrap" data-filter="inactive">Inactive</button>
                
                <div class="flex-1"></div>
                
                <button id="sort-users-btn" class="flex items-center gap-1 text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition-colors" title="Sort Alphabetically">
                    <span class="material-symbols-outlined transition-transform duration-300 transform" id="sort-icon" style="transform: rotate(0deg)">arrow_upward</span>
                    <span class="text-xs font-medium">A-Z</span>
                </button>
            </div>

            <!-- Users List -->
            <div id="users-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <!-- Loading State -->
                <div class="col-span-full flex justify-center py-12">
                    <div class="spinner border-4 border-gray-200 border-t-primary w-8 h-8 rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render individual user card
 */
function renderUserCard(user) {
    const profile = user.profile || {};
    const displayName = profile.fullname || (profile.handle ? `@${profile.handle}` : user.email.split('@')[0]);
    const initials = (displayName || user.email).slice(0, 2).toUpperCase();

    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100"
             data-user-id="${user.id}"
             data-user-name="${displayName}"
             data-user-email="${user.email}"
             data-user-status="${user.is_global_active ? 'active' : 'inactive'}"
             data-user-role="${user.is_admin ? 'admin' : 'user'}">
            
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg shadow-inner">
                        ${profile.avatar_url ? `<img src="${profile.avatar_url}" class="w-full h-full object-cover rounded-xl" />` : initials}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">${displayName}</h3>
                         <div class="flex items-center gap-1.5 text-xs text-gray-500">
                             <span>${profile.flag_emoji || '🏳️'}</span>
                             <span>${profile.handle ? '@' + profile.handle : 'No handle'}</span>
                         </div>
                    </div>
                </div>
                ${user.is_admin ? '<span class="material-symbols-outlined text-purple-500 bg-purple-50 p-1 rounded-lg text-sm" title="Admin">shield_person</span>' : ''}
            </div>

            <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <span class="material-symbols-outlined text-gray-400 text-lg">mail</span>
                    <span class="truncate">${user.email}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                     <span class="material-symbols-outlined text-gray-400 text-lg">payments</span>
                     <span class="truncate">${profile.currency_code || 'GBP'}</span>
                </div>
            </div>

            <div class="pt-3 border-t border-gray-50 flex justify-between items-center text-xs font-medium">
                <span class="${user.is_global_active ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded' : 'text-red-600 bg-red-50 px-2 py-0.5 rounded'}">
                    ${user.is_global_active ? 'Active' : 'Inactive'}
                </span>
                <span class="text-gray-400">Created ${new Date(user.date_created).toLocaleDateString()}</span>
            </div>
        </div>
    `;
}


/**
 * Handlers
 */
let usersData = [];
let sortOrder = 'asc'; // 'asc' or 'desc'

// Make loadUsers available globally for user-detail.js to refresh list
window.loadUsers = loadUsers;

async function loadUsers() {
    const container = document.getElementById('users-list');
    if (!container) return;

    try {
        usersData = await API.getUsers();

        if (usersData.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                         <span class="material-symbols-outlined text-gray-400 text-2xl">group_off</span>
                    </div>
                    <h3 class="text-gray-900 font-medium mb-1">No users found</h3>
                    <p class="text-gray-500 text-sm">Get started by creating a new user.</p>
                </div>
            `;
            return;
        }

        // Initial Sort
        sortUsers();

        container.innerHTML = usersData.map(renderUserCard).join('');

        // Re-attach card clicks
        attachCardHandlers();

    } catch (error) {
        container.innerHTML = `<div class="col-span-full text-center text-red-500 py-8 bg-red-50 rounded-xl">${error.message}</div>`;
    }
}

function attachCardHandlers() {
    document.querySelectorAll('[data-user-id]').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if text is selected
            if (window.getSelection().toString()) return;

            const id = e.currentTarget.dataset.userId;
            const user = usersData.find(u => u.id == id);
            if (user) {
                import('./user-detail.js').then(module => {
                    showModal(module.renderUserDetail(user), 'user-detail');
                    module.attachUserDetailHandlers(user);
                });
            }
        });
    });
}

export async function attachUsersHandlers() {
    await loadUsers();

    // Search
    const searchInput = document.getElementById('search-users');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('[data-user-id]');

            cards.forEach(card => {
                const name = card.dataset.userName?.toLowerCase() || '';
                const email = card.dataset.userEmail?.toLowerCase() || '';
                const match = name.includes(q) || email.includes(q);
                card.style.display = match ? '' : 'none';
            });
        });
    }

    // Add User
    const addBtn = document.getElementById('add-user-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            import('./user-detail.js').then(module => {
                showModal(module.renderAddUser(), 'add-user');
                module.attachAddUserHandlers();
            });
        });
    }

    // Filter Chips
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // UI Toggle
            document.querySelectorAll('[data-filter]').forEach(b => {
                b.className = 'chip chip-default whitespace-nowrap';
            });
            e.currentTarget.className = 'chip chip-active whitespace-nowrap';

            // Filter Logic
            const filter = e.currentTarget.dataset.filter;
            const cards = document.querySelectorAll('[data-user-id]');

            cards.forEach(card => {
                const role = card.dataset.userRole;
                const status = card.dataset.userStatus;

                let visible = true;
                if (filter === 'admin') visible = role === 'admin';
                if (filter === 'active') visible = status === 'active';
                if (filter === 'inactive') visible = status === 'inactive';

                card.style.display = visible ? '' : 'none';
            });
        });
    });

    // Sort Button
    const sortBtn = document.getElementById('sort-users-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';

            // Visual feedback
            const icon = document.getElementById('sort-icon');
            const label = sortBtn.querySelector('span:last-child');
            if (icon) {
                icon.textContent = 'arrow_upward';
                icon.style.transform = sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
            }
            if (label) label.textContent = sortOrder === 'asc' ? 'A-Z' : 'Z-A';

            sortUsers();

            // Re-render
            const container = document.getElementById('users-list');
            if (container) {
                container.innerHTML = usersData.map(renderUserCard).join('');
                attachCardHandlers();
            }
        });
    }
}

function sortUsers() {
    usersData.sort((a, b) => {
        const getDisplayName = (u) => {
            const p = u.profile || {};
            return (p.fullname || (p.handle ? `@${p.handle}` : u.email.split('@')[0])).toLowerCase();
        };

        const nameA = getDisplayName(a);
        const nameB = getDisplayName(b);

        if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
}
