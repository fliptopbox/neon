/**
 * Host Detail View
 * Handles editing of host/venue profiles
 */

import { state, render } from '../app.js';
import * as API from '../client.js';
import { showToast } from '../components/toast.js';

let currentHost = null;
const WRAPPER_CLASS = 'host-detail-modal-wrapper';

export async function renderHostDetail(hostId = null) {
    let h = {};
    if (hostId) {
        // Find existing in local state or fetch
        const index = state.data.hosts?.findIndex(x => x.id == hostId);
        if (index !== -1 && index !== undefined) {
            h = state.data.hosts[index];
            currentHost = h;
        } else {
            try {
                currentHost = await API.getHostById(hostId);
                h = currentHost;
            } catch {
                showToast('Host not found', 'error');
                return;
            }
        }
    } else {
        // New Host
        h = {
            name: '',
            phone_number: '',
            description: '',
            currency_code: 'GBP',
            rate_max_hour: 25,
            rate_max_day: 150,
            social_urls: []
        };
        currentHost = h;
    }

    // Remove existing modal if present
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
                            <h2 class="text-xl font-bold text-gray-900">${h.id ? 'Edit Host' : 'New Host'}</h2>
                            <p class="text-xs text-gray-500">${h.id ? `ID: ${h.id}` : 'Create a new venue profile'}</p>
                        </div>
                    </div>
                     <button type="button" class="save-host-btn text-primary font-semibold hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors">
                        Save
                    </button>
                </header>
                
                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="host-detail-form" class="space-y-6">
                         
                         <!-- Name -->
                         <div class="space-y-1.5">
                            <label class="block text-sm font-medium text-gray-700">Display Name</label>
                            <input type="text" name="name" value="${h.name || ''}" class="input-field w-full" placeholder="Venue or Organization Name" required>
                        </div>
                        
                         <!-- Description -->
                         <div class="space-y-1.5">
                            <label class="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" rows="3" class="input-field w-full" placeholder="About the venue...">${h.description || ''}</textarea>
                        </div>
                        
                        <!-- Contact -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" name="phone_number" value="${h.phone_number || ''}" class="input-field w-full" placeholder="+44...">
                            </div>
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Currency</label>
                                <select name="currency_code" class="input-field w-full">
                                    <option value="GBP" ${h.currency_code === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                                    <option value="EUR" ${h.currency_code === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                    <option value="USD" ${h.currency_code === 'USD' ? 'selected' : ''}>USD ($)</option>
                                </select>
                            </div>
                        </div>
                        
                         <!-- Rates -->
                         <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Max Rate (Hour)</label>
                                <input type="number" step="0.01" name="rate_max_hour" value="${h.rate_max_hour || ''}" class="input-field w-full">
                            </div>
                             <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700">Max Rate (Day)</label>
                                <input type="number" step="0.01" name="rate_max_day" value="${h.rate_max_day || ''}" class="input-field w-full">
                            </div>
                        </div>

                    </form>
                </div>
             </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', content);
    attachHostDetailHandlers(h);
}

function attachHostDetailHandlers(host) {
    const modal = document.querySelector(`.${WRAPPER_CLASS}`);
    const saveBtn = modal.querySelector('.save-host-btn');
    const closeBtn = modal.querySelector('.close-modal-btn');
    const form = modal.querySelector('#host-detail-form');

    const close = () => {
        modal.remove();
    };

    // Close on back button
    closeBtn.addEventListener('click', close);
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    // Save Handler
    saveBtn.addEventListener('click', async () => {
        const btnText = saveBtn.innerText;
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                phone_number: formData.get('phone_number'),
                currency_code: formData.get('currency_code'),
                rate_max_hour: parseFloat(formData.get('rate_max_hour')) || 0,
                rate_max_day: parseFloat(formData.get('rate_max_day')) || 0,
            };

            if (host.id) {
                const updated = await API.updateHost(host.id, data);
                // Update local state if hosts list is loaded
                if (state.data.hosts) {
                    const idx = state.data.hosts.findIndex(x => x.id == host.id);
                    if (idx !== -1) state.data.hosts[idx] = updated;
                }
                showToast('Host updated');
            } else {
                const newHost = await API.createHost(data);
                if (state.data.hosts) state.data.hosts.unshift(newHost);
                showToast('Host created');
            }
            close();

            // If on Profile page, buttons should update?
            // Currently profile.js handlers check existence.
            // If we are on profile page, we might want to reload or update UI?
            if (window.location.hash === '#profile') {
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
            showToast(e.message || 'Failed to save', 'error');
            saveBtn.innerText = btnText;
            saveBtn.disabled = false;
        }
    });
}
