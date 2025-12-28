/**
 * User Profile View
 */

import { state, render } from '../app.js';
import * as API from '../client.js';
import { showToast } from '../components/toast.js';
import { countries } from '../utils/countries.js';

export function renderProfile() {
    return `
        <div class="max-w-xl mx-auto py-10 px-4 animate-fade-in">
             <header class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">My Profile</h1>
                <p class="text-gray-500">Manage your account settings</p>
            </header>
            
            <div id="profile-card" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
                <div class="flex justify-center py-12">
                   <span class="spinner text-primary"></span>
                </div>
            </div>
        </div>
    `;
}

export async function attachProfileHandlers() {
    const container = document.getElementById('profile-card');
    if (!container) return;

    const currentUser = API.getUser();
    if (!currentUser) return;

    try {
        const user = await API.getMe();
        renderProfileForm(container, user);
    } catch (err) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-red-500 mb-4">${err.message || 'Failed to load profile'}</p>
                <button onclick="window.location.reload()" class="text-primary font-medium hover:underline">Retry</button>
            </div>
        `;
    }
}

function renderProfileForm(container, user) {
    const showRoleButtons = !user.model_id || !user.host_id;

    container.innerHTML = `
        ${showRoleButtons ? `
        <div class="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50">
            <h3 class="text-lg font-bold text-gray-900 mb-2">Grow your Profile</h3>
            <p class="text-gray-600 mb-4 text-sm">Join as a model or host venue to expand your reach.</p>
            <div class="flex flex-wrap gap-3">
                ${!user.model_id ? `
                    <button type="button" id="create-model-btn" class="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:text-primary hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                        <span class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                            <span class="material-symbols-outlined text-[20px]">accessibility_new</span>
                        </span>
                        Become a Model
                    </button>
                ` : ''}
                ${!user.host_id ? `
                    <button type="button" id="create-host-btn" class="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                        <span class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <span class="material-symbols-outlined text-[20px]">storefront</span>
                        </span>
                        Become a Host
                    </button>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <form id="profile-form" class="p-6 space-y-6">
            <!-- Full Name & Flag -->
             <div class="space-y-1.5 relative">
                <label class="block text-sm font-medium text-gray-700">Full Name</label>
                <div class="flex gap-2">
                    <!-- Flag Selector -->
                     <div class="relative">
                        <button type="button" id="flag-btn" class="flex items-center justify-center w-12 h-[42px] text-2xl bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                            <span id="flag-display">${user.flag_emoji || '🏳️'}</span>
                        </button>
                        <input type="hidden" name="flag_emoji" id="flag-input" value="${user.flag_emoji || '🏳️'}">
                        
                         <!-- Dropdown -->
                        <div id="flag-dropdown" class="absolute top-[50px] left-0 w-64 bg-white shadow-xl rounded-xl border border-gray-100 max-h-64 overflow-y-auto hidden z-20">
                             <div class="p-2 sticky top-0 bg-white border-b border-gray-50">
                                <input type="text" id="flag-search" class="input-field w-full text-sm py-1.5" placeholder="Search country...">
                            </div>
                            <div id="flag-list"></div>
                        </div>
                    </div>
                    
                    <input type="text" name="fullname" value="${user.fullname || ''}" required class="input-field flex-1">
                </div>
            </div>

            <!-- Email (Read Only) -->
            <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value="${user.email}" disabled class="input-field w-full bg-gray-50 text-gray-500 cursor-not-allowed">
            </div>
            
            <!-- Handle -->
             <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">Handle</label>
                <div class="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3">
                    <span class="text-gray-400">@</span>
                    <input type="text" name="handle" value="${user.handle || ''}" class="bg-transparent border-0 focus:ring-0 w-full p-2.5 text-gray-900" placeholder="username">
                </div>
            </div>

            <!-- Bio -->
            <div class="space-y-1.5">
                <label class="block text-sm font-medium text-gray-700">Bio</label>
                <textarea name="description" rows="3" class="input-field w-full" placeholder="Tell us about yourself...">${user.description || ''}</textarea>
            </div>

            <hr class="border-gray-100">

            <!-- Password Change -->
            <div class="space-y-4">
                <h3 class="font-medium text-gray-900">Change Password</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="block text-sm font-medium text-gray-700">New Password</label>
                        <input type="password" name="password" class="input-field w-full" placeholder="Leave blank to keep current" minlength="8">
                    </div>
                </div>
            </div>

            <div class="pt-4 flex justify-end">
                <button type="submit" id="save-profile-btn" class="bg-primary text-white font-semibold hover:bg-primary-dark px-8 py-2.5 rounded-xl transition-colors shadow-lg shadow-primary/20">
                    Save Changes
                </button>
            </div>
        </form>
    `;

    attachFormHandlers(container, user);
}

function attachFormHandlers(container, user) {
    // Role Creation Handlers
    const createModelBtn = container.querySelector('#create-model-btn');
    const createHostBtn = container.querySelector('#create-host-btn');

    if (createModelBtn) {
        createModelBtn.addEventListener('click', async () => {
            const { renderModelDetail } = await import('./model-detail.js');
            renderModelDetail(null);
        });
    }

    if (createHostBtn) {
        createHostBtn.addEventListener('click', async () => {
            const { renderHostDetail } = await import('./host-detail.js');
            renderHostDetail(null);
        });
    }

    const form = container.querySelector('#profile-form');
    const saveBtn = container.querySelector('#save-profile-btn');

    // Flag Logic
    const flagBtn = container.querySelector('#flag-btn');
    const flagDropdown = container.querySelector('#flag-dropdown');
    const flagSearch = container.querySelector('#flag-search');
    const flagList = container.querySelector('#flag-list');
    const flagDisplay = container.querySelector('#flag-display');
    const flagInput = container.querySelector('#flag-input');

    const renderFlags = (query) => {
        const lower = query.toLowerCase();
        // If countries not loaded yet? They are imported.
        const matches = countries.filter(c => c.name.toLowerCase().includes(lower));

        if (matches.length === 0) {
            flagList.innerHTML = '<div class="p-3 text-sm text-gray-500 text-center">No results</div>';
            return;
        }

        flagList.innerHTML = matches.map(c => `
            <div class="flag-option flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer" 
                 data-emoji="${c.emoji}">
                <span class="text-xl">${c.emoji}</span>
                <span class="text-sm font-medium text-gray-700">${c.name}</span>
            </div>
         `).join('');

        flagList.querySelectorAll('.flag-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const emoji = opt.dataset.emoji;
                flagDisplay.textContent = emoji;
                flagInput.value = emoji;
                flagDropdown.classList.add('hidden');
            });
        });
    };

    flagBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        flagDropdown.classList.toggle('hidden');
        if (!flagDropdown.classList.contains('hidden')) {
            renderFlags('');
            flagSearch.focus();
        }
    });

    flagSearch.addEventListener('input', (e) => renderFlags(e.target.value));
    flagSearch.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', (e) => {
        if (!flagBtn.contains(e.target) && !flagDropdown.contains(e.target)) {
            flagDropdown.classList.add('hidden');
        }
    });

    // Save
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnText = saveBtn.innerText;
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const data = {
                fullname: formData.get('fullname'),
                handle: formData.get('handle'),
                description: formData.get('description'),
                flag_emoji: formData.get('flag_emoji'),
                password: formData.get('password') || undefined
            };

            const updated = await API.updateMe(data);

            // Update local state if it matches current user
            if (state.user.id === user.id) {
                // state.user only has { id, email, isAdmin } usually
                // but we can update if we store more
            }

            showToast('Profile updated!');
            form.querySelector('input[name="password"]').value = '';
        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
        } finally {
            saveBtn.innerText = btnText;
            saveBtn.disabled = false;
        }
    });
}
