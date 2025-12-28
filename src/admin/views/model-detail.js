/**
 * Model Detail View
 * Handles editing of individual model profiles
 */

import { state, render } from '../app.js';
import * as API from '../client.js';
import { showToast } from '../components/toast.js';
import { countries } from '../utils/countries.js';

let currentModel = null;

const WRAPPER_CLASS = 'model-detail-modal-wrapper';

/**
 * Render the Model Detail modal
 */
export async function renderModelDetail(modelId = null) {
    // Find model in local state or initialize new
    let m = {};
    if (modelId) {
        const index = state.data.models.findIndex(m => m.id == modelId);
        if (index === -1) {
            // If checking edit but not found?
            try {
                // Try fetch direct
                m = await API.getModel(modelId);
            } catch {
                showToast('Model not found', 'error');
                return;
            }
        } else {
            // Fetch fresh data
            try {
                currentModel = await API.getModel(modelId);
                state.data.models[index] = { ...state.data.models[index], ...currentModel };
                m = currentModel;
            } catch {
                m = state.data.models[index];
            }
        }
    } else {
        // Init New
        m = {
            display_name: '',
            phone_number: '',
            flag_emoji: '🏳️',
            description: '',
            currency_code: 'GBP',
            rate_min_hour: 20,
            rate_min_day: 120,
            sex: 0,
            pronouns: '',
            tz: 'Europe/London',
            work_inperson: true,
            work_online: false,
            work_photography: false,
            work_seeks: ["nude", "portrait", "clothed", "underwear", "costume"],
            social_urls: [],
            product_urls: []
        };
        currentModel = m;
    }

    // const m = currentModel; // Removed to avoid redeclaration
    const birthday = m.date_birthday ? m.date_birthday.split('T')[0] : '';
    const experience = m.date_experience ? m.date_experience.split('T')[0] : '';

    // Remove existing modal if any to prevent duplicates/zombies
    const existing = document.querySelector(`.${WRAPPER_CLASS}`);
    if (existing) existing.remove();

    const content = `
        <div class="${WRAPPER_CLASS} fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                
                <!-- Header -->
                <header class="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
                    <div class="flex items-center gap-3">
                        <button type="button" class="close-modal-btn btn-icon -ml-2">
                            <span class="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-900">${m.id ? 'Edit Model' : 'New Model'}</h2>
                            <p class="text-xs text-gray-500">${m.id ? `ID: ${m.id}` : 'Create a new profile'}</p>
                        </div>
                    </div>
                    <button type="button" class="save-model-btn text-primary font-semibold hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors">
                        Save
                    </button>
                </header>

                <!-- Scrollable Content -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="model-detail-form" class="space-y-6">
                        
                        <!-- Core Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Display Name</label>
                                <input type="text" name="display_name" value="${m.display_name || ''}" class="input-field w-full" placeholder="Stage name">
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" name="phone_number" value="${m.phone_number || ''}" class="input-field w-full" placeholder="+44...">
                            </div>
                        </div>

                         <!-- Flag / Country -->
                        <div class="space-y-1.5 relative px-1">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Country Flag</label>
                            <div class="flex gap-2">
                                <div id="selected-flag-display" class="flex items-center justify-center w-12 h-[42px] text-2xl bg-gray-50 border border-gray-300 rounded-lg shrink-0">
                                    ${m.flag_emoji || '🏳️'}
                                </div>
                                <div class="relative flex-1">
                                    <input type="text" id="country-search" class="input-field w-full pl-9" placeholder="Search country...">
                                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                </div>
                            </div>
                            <!-- Hidden input for form submission -->
                            <input type="hidden" name="flag_emoji" id="flag-emoji-input" value="${m.flag_emoji || '🏳️'}">
                            
                            <!-- Search Results Dropdown -->
                            <div id="country-dropdown" class="absolute top-[75px] left-0 right-0 bg-white shadow-xl rounded-xl border border-gray-100 max-h-48 overflow-y-auto hidden z-20">
                                <!-- Populated by JS -->
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <label class="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" rows="3" class="input-field w-full" placeholder="Model bio...">${m.description || ''}</textarea>
                        </div>

                        <!-- Dates (Birthday / Experience) -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                             <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Date of Birth</label>
                                <input type="date" name="date_birthday" value="${birthday}" class="input-field w-full">
                                <p class="text-xs text-gray-400">Legal requirement (18+)</p>
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Experience Since</label>
                                <input type="date" name="date_experience" value="${experience}" class="input-field w-full">
                            </div>
                        </div>

                         <!-- Work Settings -->
                        <div class="space-y-4 border-t border-gray-100 pt-4">
                            <h3 class="font-semibold text-gray-900">Work Preferences</h3>
                            
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Timezone</label>
                                <input type="text" name="tz" value="${m.tz || 'Europe/London'}" class="input-field w-full" placeholder="e.g. Europe/London">
                            </div>

                            <div class="flex flex-wrap gap-6">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="work_inperson" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" ${m.work_inperson ? 'checked' : ''}>
                                    <span class="text-sm text-gray-700">In-person</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="work_online" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" ${m.work_online ? 'checked' : ''}>
                                    <span class="text-sm text-gray-700">Online</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="work_photography" class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" ${m.work_photography ? 'checked' : ''}>
                                    <span class="text-sm text-gray-700">Photography</span>
                                </label>
                            </div>
                        </div>

                        <!-- Work Seeks -->
                        <div class="space-y-2">
                             <label class="block text-sm font-medium text-gray-700">Categories (Seeks)</label>
                             <div class="flex flex-wrap gap-2" id="work-seeks-container">
                                ${['nude', 'portrait', 'clothed', 'underwear', 'costume', 'fashion', 'bodypaint'].map(tag => `
                                    <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${m.work_seeks?.includes(tag) ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-gray-600'} cursor-pointer text-sm transition-colors hover:bg-gray-50">
                                        <input type="checkbox" name="work_seeks" value="${tag}" class="hidden peer" ${m.work_seeks?.includes(tag) ? 'checked' : ''}>
                                        <span>${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                                    </label>
                                `).join('')}
                             </div>
                        </div>

                        <!-- Social & Product URLs -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-4">
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Social Links</label>
                                <div id="social-urls-list" class="space-y-2">
                                    ${(m.social_urls || []).map(url => `
                                        <div class="flex gap-2">
                                            <input type="url" name="social_urls[]" value="${url}" class="input-field w-full text-sm" placeholder="https://instagram.com/...">
                                            <button type="button" class="text-red-400 hover:text-red-600" onclick="this.parentElement.remove()">
                                                <span class="material-symbols-outlined text-xl">remove_circle</span>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" id="add-social-btn" class="text-sm text-primary hover:underline flex items-center gap-1">
                                    <span class="material-symbols-outlined text-lg">add</span> Add Social Link
                                </button>
                            </div>

                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-gray-700">Product/Shop Links</label>
                                <div id="product-urls-list" class="space-y-2">
                                     ${(m.product_urls || []).map(url => `
                                        <div class="flex gap-2">
                                            <input type="url" name="product_urls[]" value="${url}" class="input-field w-full text-sm" placeholder="https://etsy.com/...">
                                            <button type="button" class="text-red-400 hover:text-red-600" onclick="this.parentElement.remove()">
                                                <span class="material-symbols-outlined text-xl">remove_circle</span>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button type="button" id="add-product-btn" class="text-sm text-primary hover:underline flex items-center gap-1">
                                    <span class="material-symbols-outlined text-lg">add</span> Add Product Link
                                </button>
                            </div>
                        </div>

                        <!-- Rates & Currency -->
                        <div class="grid grid-cols-3 gap-4">
                             <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Currency</label>
                                <select name="currency_code" class="input-field w-full">
                                    <option value="GBP" ${m.currency_code === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                                    <option value="EUR" ${m.currency_code === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                    <option value="USD" ${m.currency_code === 'USD' ? 'selected' : ''}>USD ($)</option>
                                    <option value="AUD" ${m.currency_code === 'AUD' ? 'selected' : ''}>AUD ($)</option>
                                    <option value="CAD" ${m.currency_code === 'CAD' ? 'selected' : ''}>CAD ($)</option>
                                    <option value="CHF" ${m.currency_code === 'CHF' ? 'selected' : ''}>CHF (Fr)</option>
                                    <option value="CNY" ${m.currency_code === 'CNY' ? 'selected' : ''}>CNY (¥)</option>
                                    <option value="HKD" ${m.currency_code === 'HKD' ? 'selected' : ''}>HKD ($)</option>
                                    <option value="JPY" ${m.currency_code === 'JPY' ? 'selected' : ''}>JPY (¥)</option>
                                    <option value="NZD" ${m.currency_code === 'NZD' ? 'selected' : ''}>NZD ($)</option>
                                </select>
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Min Rate (Hour)</label>
                                <input type="number" step="0.01" name="rate_min_hour" value="${m.rate_min_hour || ''}" class="input-field w-full">
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Min Rate (Day)</label>
                                <input type="number" step="0.01" name="rate_min_day" value="${m.rate_min_day || ''}" class="input-field w-full">
                            </div>
                        </div>
                        
                        <!-- Demographics -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Sex</label>
                                <select name="sex" class="input-field w-full">
                                    <option value="0" ${m.sex == 0 ? 'selected' : ''}>Prefer not to say</option>
                                    <option value="1" ${m.sex == 1 ? 'selected' : ''}>Male</option>
                                    <option value="2" ${m.sex == 2 ? 'selected' : ''}>Female</option>
                                    <option value="3" ${m.sex == 3 ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                             <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Pronouns</label>
                                <input type="text" name="pronouns" value="${m.pronouns || ''}" class="input-field w-full" placeholder="e.g. she/her">
                            </div>
                        </div>

                    </form>
                    
                    <div class="pt-8 pb-4">
                        ${m.id ? `
                        <button type="button" class="delete-model-btn w-full py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors">
                            Delete Model Profile
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', content);
    attachModelDetailHandlers(m);
}

function attachModelDetailHandlers(model) {
    const modal = document.querySelector(`.${WRAPPER_CLASS}`);
    const saveBtn = modal.querySelector('.save-model-btn');
    const deleteBtn = modal.querySelector('.delete-model-btn');
    const closeBtn = modal.querySelector('.close-modal-btn');
    const form = modal.querySelector('#model-detail-form');

    // Custom close logic to handle removal
    const close = () => {
        // Simple removal, ignored animation for robustness
        modal.remove();
        render(); // Re-render list
    };

    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    // Country Search Logic (Scoped)
    const countrySearch = modal.querySelector('#country-search');
    const countryDropdown = modal.querySelector('#country-dropdown');
    const flagDisplay = modal.querySelector('#selected-flag-display');
    const flagInput = modal.querySelector('#flag-emoji-input');

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

        // Close logic for dropdown (attached to document, but checked for existence)
        const docClickHandler = (e) => {
            // If modal is gone, remove listener?
            if (!document.body.contains(modal)) {
                document.removeEventListener('click', docClickHandler);
                return;
            }
            if (!countrySearch.contains(e.target) && !countryDropdown.contains(e.target)) {
                countryDropdown.classList.add('hidden');
            }
        };
        setTimeout(() => document.addEventListener('click', docClickHandler), 0);

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
    }

    // URL List Handlers
    const socialList = modal.querySelector('#social-urls-list');
    const productList = modal.querySelector('#product-urls-list');

    modal.querySelector('#add-social-btn')?.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'flex gap-2';
        div.innerHTML = `
            <input type="url" name="social_urls[]" class="input-field w-full text-sm" placeholder="https://instagram.com/...">
            <button type="button" class="text-red-400 hover:text-red-600" onclick="this.parentElement.remove()">
                <span class="material-symbols-outlined text-xl">remove_circle</span>
            </button>
        `;
        socialList.appendChild(div);
    });

    modal.querySelector('#add-product-btn')?.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'flex gap-2';
        div.innerHTML = `
            <input type="url" name="product_urls[]" class="input-field w-full text-sm" placeholder="https://shop.com/...">
            <button type="button" class="text-red-400 hover:text-red-600" onclick="this.parentElement.remove()">
                <span class="material-symbols-outlined text-xl">remove_circle</span>
            </button>
        `;
        productList.appendChild(div);
    });

    // Seeks checkbox styling toggler
    modal.querySelector('#work-seeks-container')?.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const label = e.target.closest('label');
            if (e.target.checked) {
                label.classList.add('bg-primary/10', 'border-primary', 'text-primary');
                label.classList.remove('bg-white', 'border-gray-200', 'text-gray-600');
            } else {
                label.classList.remove('bg-primary/10', 'border-primary', 'text-primary');
                label.classList.add('bg-white', 'border-gray-200', 'text-gray-600');
            }
        }
    });

    // Save handler
    saveBtn.addEventListener('click', async () => {
        const btnText = saveBtn.innerText;
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const data = {
                display_name: formData.get('display_name'),
                phone_number: formData.get('phone_number'),
                description: formData.get('description'),

                flag_emoji: formData.get('flag_emoji'),

                currency_code: formData.get('currency_code'),
                rate_min_hour: parseFloat(formData.get('rate_min_hour')) || 0,
                rate_min_day: parseFloat(formData.get('rate_min_day')) || 0,

                date_birthday: formData.get('date_birthday') || null,
                date_experience: formData.get('date_experience') || null,

                sex: parseInt(formData.get('sex')),
                pronouns: formData.get('pronouns'),

                // New Fields
                tz: formData.get('tz'),
                work_inperson: formData.get('work_inperson') === 'on',
                work_online: formData.get('work_online') === 'on',
                work_photography: formData.get('work_photography') === 'on',

                work_seeks: Array.from(formData.querySelectorAll('input[name="work_seeks"]:checked')).map(cb => cb.value),
                social_urls: Array.from(formData.getAll('social_urls[]')).filter(u => u.trim()),
                product_urls: Array.from(formData.getAll('product_urls[]')).filter(u => u.trim()),

                user_id: model.user_id
            };

            if (model.id) {
                const updatedModel = await API.updateModel(model.id, data);
                // Update local state
                const index = state.data.models.findIndex(m => m.id == model.id);
                if (index !== -1) {
                    state.data.models[index] = updatedModel;
                }
                showToast('Model updated successfully');
            } else {
                const newModel = await API.createModel(data);
                state.data.models.unshift(newModel);
                showToast('Model created successfully');
            }

            close();
            if (window.location.hash === '#profile') {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Failed to update model', 'error');
            saveBtn.innerText = btnText;
            saveBtn.disabled = false;
        }
    });

    // Delete handler
    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this model profile? This action cannot be undone.')) {
            try {
                await API.deleteModel(model.id);
                state.data.models = state.data.models.filter(m => m.id != model.id);
                showToast('Model profile deleted');
                close();
            } catch (err) {
                showToast(err.message || 'Failed to delete model', 'error');
            }
        }
    });
}
