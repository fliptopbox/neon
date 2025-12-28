/**
 * User Detail View (Modal)
 * For viewing/editing a single user
 */

import * as API from '../client.js';
import { state, render } from '../app.js';
import { closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { countries } from '../utils/countries.js';

/**
 * Render user detail modal content
 */
export function renderUserDetail(user) {
    const fullname = user.fullname || extractNameFromEmail(user.email || user.emailaddress);
    const email = user.email || user.emailaddress;
    const isActive = user.active || user.is_global_active;
    const isAdmin = user.is_admin;
    const initials = getInitials(fullname);
    const avatarColor = getAvatarColor(user.id);
    const flagEmoji = user.flag_emoji || '🏳️';

    // Find country name from emoji if possible, or default to "Select Flag"
    const foundCountry = countries.find(c => c.emoji === flagEmoji);
    const countryName = foundCountry ? foundCountry.name : '';

    return `
        <!-- Header -->
        <header class="flex items-center bg-white p-4 border-b border-gray-100">
            <button onclick="closeModal()" class="btn-icon">
                <span class="material-symbols-outlined">close</span>
            </button>
            <h2 class="text-lg font-bold leading-tight flex-1 text-center">User Details</h2>
            <button id="save-user-btn" class="text-primary text-base font-bold">Save</button>
        </header>
        
        <!-- Profile Header -->
        <div class="flex flex-col items-center p-6 pb-4">
            <div class="avatar avatar-lg flex items-center justify-center text-white font-bold text-2xl mb-4"
                 style="background-color: ${avatarColor};">
                ${initials}
            </div>
            <h3 class="text-xl font-bold text-gray-900">${fullname}</h3>
            <p class="text-gray-500 text-sm mt-1">${email}</p>
        </div>
        
        <!-- Form -->
        <form id="user-detail-form" class="p-4 space-y-4">
            <input type="hidden" name="id" value="${user.id}">
            
            <!-- Full Name -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" name="fullname" value="${fullname}" class="input-field">
            </div>
            
            <!-- Email -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" name="email" value="${email}" class="input-field">
            </div>
            
            <!-- Handle -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Handle</label>
                <input type="text" name="handle" value="${user.handle || ''}" 
                       class="input-field" placeholder="e.g., bruce-thomas">
            </div>

            <!-- Flag Emoji / Country -->
            <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Country Flag</label>
                <div class="flex items-center gap-2">
                    <div id="selected-flag-display" class="w-10 h-10 flex items-center justify-center text-2xl bg-gray-50 rounded-lg border border-gray-200">
                        ${flagEmoji}
                    </div>
                    <input type="hidden" name="flag_emoji" id="flag-emoji-input" value="${flagEmoji}">
                    <div class="relative flex-1">
                        <input type="text" id="country-search" 
                               class="input-field" 
                               value="${countryName}"
                               placeholder="Search country (e.g. South)..." 
                               autocomplete="off">
                        
                        <!-- Dropdown Results -->
                        <div id="country-dropdown" 
                             class="hidden absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            <!-- Items will be populated by JS -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Description -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea name="description" rows="3" class="input-field h-auto py-3" 
                          placeholder="Brief description...">${user.description || ''}</textarea>
            </div>

            <!-- Change Password -->
            <div class="pt-2">
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Change Password</label>
                <input type="password" name="password" class="input-field" placeholder="Leave empty to keep current password">
                <p class="text-xs text-gray-400 mt-1">Min 8 characters. Only enter if you want to change it.</p>
            </div>
            
            <!-- Toggle Switches -->
            <div class="pt-4 border-t border-gray-100 space-y-4">
                <!-- Active Toggle -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-medium text-gray-900">Active Status</p>
                        <p class="text-sm text-gray-500">User can log in and access platform</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="active" class="sr-only peer" ${isActive ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/20 
                                    rounded-full peer peer-checked:after:translate-x-full 
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                    after:bg-white after:rounded-full after:h-5 after:w-5 
                                    after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                
                <!-- Admin Toggle -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-medium text-gray-900">Admin Access</p>
                        <p class="text-sm text-gray-500">Can manage all users and data</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="is_admin" class="sr-only peer" ${isAdmin ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/20 
                                    rounded-full peer peer-checked:after:translate-x-full 
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                    after:bg-white after:rounded-full after:h-5 after:w-5 
                                    after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
            
            <!-- Danger Zone -->
            <div class="pt-4 mt-4 border-t border-gray-100">
                <button type="button" id="delete-user-btn"
                        class="w-full py-3 rounded-xl border border-red-100 bg-red-50 
                               text-red-600 font-semibold text-sm flex items-center justify-center gap-2
                               hover:bg-red-100 transition-colors">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                    Delete User
                </button>
            </div>
        </form>
        
        <!-- Bottom padding for safe area -->
        <div class="h-8"></div>
    `;
}

/**
 * Attach handlers for user detail modal
 */
export function attachUserDetailHandlers(user) {
    const form = document.getElementById('user-detail-form');
    const saveBtn = document.getElementById('save-user-btn');
    const deleteBtn = document.getElementById('delete-user-btn');

    // Country Search Logic
    const countrySearch = document.getElementById('country-search');
    const countryDropdown = document.getElementById('country-dropdown');
    const flagDisplay = document.getElementById('selected-flag-display');
    const flagInput = document.getElementById('flag-emoji-input');

    if (countrySearch && countryDropdown) {
        // Show all on focus
        countrySearch.addEventListener('focus', () => {
            renderFlagOptions('');
            countryDropdown.classList.remove('hidden');
        });

        // Filter on input
        countrySearch.addEventListener('input', (e) => {
            renderFlagOptions(e.target.value);
            countryDropdown.classList.remove('hidden');
        });

        // Close on click outside (simple implementation)
        document.addEventListener('click', (e) => {
            if (!countrySearch.contains(e.target) && !countryDropdown.contains(e.target)) {
                countryDropdown.classList.add('hidden');
            }
        });
    }

    function renderFlagOptions(query) {
        const lowerQuery = query.toLowerCase();
        const filtered = countries.filter(c => c.name.toLowerCase().includes(lowerQuery));

        if (filtered.length === 0) {
            countryDropdown.innerHTML = '<div class="p-3 text-sm text-gray-500 text-center">No countries found</div>';
            return;
        }

        countryDropdown.innerHTML = filtered.map(c => `
            <div class="flag-option flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                 data-emoji="${c.emoji}" data-name="${c.name}">
                <span class="text-2xl">${c.emoji}</span>
                <span class="text-sm font-medium text-gray-900">${c.name}</span>
            </div>
        `).join('');

        // Add matching logic for suggestions
        countryDropdown.querySelectorAll('.flag-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const emoji = opt.dataset.emoji;
                const name = opt.dataset.name;

                flagDisplay.textContent = emoji;
                flagInput.value = emoji;
                countrySearch.value = name;
                countryDropdown.classList.add('hidden');
            });
        });
    }

    // Save handler
    saveBtn?.addEventListener('click', async () => {
        const formData = new FormData(form);
        const fullname = formData.get('fullname');
        const handleFromForm = formData.get('handle');

        const data = {
            email: formData.get('email'),
            fullname: fullname,
            handle: handleFromForm || (fullname ? fullname.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : `user-${user.id}`),
            description: formData.get('description') || '',
            flag_emoji: formData.get('flag_emoji') || '🏳️',
            is_global_active: formData.get('active') === 'on',
            is_admin: formData.get('is_admin') === 'on',
            password: formData.get('password') || undefined // Only send if set
        };

        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        try {
            await API.updateUser(user.id, data);

            // Update local state
            const index = state.data.users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                // Remove password from local state update (security)
                const { password, ...updateData } = data;
                state.data.users[index] = { ...state.data.users[index], ...updateData };
            }

            showToast('User updated');
            closeModal();
            render();
        } catch (error) {
            showToast(error.message || 'Failed to save');
            saveBtn.textContent = 'Save';
            saveBtn.disabled = false;
        }
    });

    // Delete handler
    deleteBtn?.addEventListener('click', async () => {
        if (!confirm(`Delete ${user.fullname || user.email}? This cannot be undone.`)) {
            return;
        }

        try {
            await API.deleteUser(user.id);

            // Remove from local state
            state.data.users = state.data.users.filter(u => u.id !== user.id);

            showToast('User deleted');
            closeModal();
            render();
        } catch (error) {
            showToast(error.message || 'Failed to delete');
        }
    });
}

/**
 * Render Add User modal content
 */
export function renderAddUser() {
    return `
        <!-- Header -->
        <header class="flex items-center bg-white p-4 border-b border-gray-100">
            <button onclick="closeModal()" class="btn-icon">
                <span class="material-symbols-outlined">close</span>
            </button>
            <h2 class="text-lg font-bold leading-tight flex-1 text-center">Add New User</h2>
            <button id="create-user-btn" class="text-primary text-base font-bold">Create</button>
        </header>
        
        <!-- Form -->
        <form id="add-user-form" class="p-4 space-y-4">
            <!-- Full Name -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input type="text" name="fullname" required class="input-field" placeholder="e.g., John Smith">
            </div>
            
            <!-- Email -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input type="email" name="email" required class="input-field" placeholder="e.g., john@example.com">
            </div>
            
            <!-- Password -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <input type="password" name="password" required minlength="8" class="input-field" placeholder="Min 8 characters">
            </div>
            
            <!-- Handle -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Handle</label>
                <input type="text" name="handle" class="input-field" placeholder="Auto-generated if empty">
                <p class="text-xs text-gray-400 mt-1">URL-friendly username (e.g., john-smith)</p>
            </div>
            
            <!-- Admin Toggle -->
            <div class="pt-4 border-t border-gray-100">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-medium text-gray-900">Admin Access</p>
                        <p class="text-sm text-gray-500">Can manage all users and data</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="is_admin" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/20 
                                    rounded-full peer peer-checked:after:translate-x-full 
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                    after:bg-white after:rounded-full after:h-5 after:w-5 
                                    after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
        </form>
        
        <!-- Bottom padding for safe area -->
        <div class="h-8"></div>
    `;
}

/**
 * Attach handlers for Add User modal
 */
export function attachAddUserHandlers() {
    const form = document.getElementById('add-user-form');
    const createBtn = document.getElementById('create-user-btn');

    createBtn?.addEventListener('click', async () => {
        const formData = new FormData(form);

        const email = formData.get('email');
        const password = formData.get('password');
        const fullname = formData.get('fullname');

        // Validate required fields
        if (!email || !password || !fullname) {
            showToast('Please fill in all required fields');
            return;
        }

        if (password.length < 8) {
            showToast('Password must be at least 8 characters');
            return;
        }

        createBtn.textContent = 'Creating...';
        createBtn.disabled = true;

        try {
            // Use the register API to create user
            const response = await API.register(email, password, fullname);

            // Add to local state
            const newUser = {
                id: response.user.id,
                email: response.user.email,
                fullname: fullname,
                handle: fullname.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                is_global_active: true,
                is_admin: response.user.isAdmin || false,
                description: '',
                flag_emoji: '🏳️',
            };
            state.data.users.unshift(newUser);

            showToast('User created successfully');
            closeModal();
            render();
        } catch (error) {
            showToast(error.message || 'Failed to create user');
            createBtn.textContent = 'Create';
            createBtn.disabled = false;
        }
    });
}

// Helper functions
function extractNameFromEmail(email) {
    if (!email) return 'Unknown';
    const localPart = email.split('@')[0];
    return localPart.replace(/[-_.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(id) {
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
        '#0ea5e9', '#3b82f6'];
    return colors[(id || 0) % colors.length];
}
