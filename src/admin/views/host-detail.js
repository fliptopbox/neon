
import * as API from '../client.js';
import { closeModal, showModal } from '../components/modal.js';

export function renderHostDetail(host) {
    const isEditing = !!host.id;
    return `
        <div class="p-6">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">${isEditing ? 'Edit Host' : 'New Host'}</h2>
                    <p class="text-sm text-gray-500">${isEditing ? 'Update host profile details' : 'Create a new host profile'}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="host-form" class="space-y-6">
                <!-- Basic Info -->
                <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Host Name</label>
                        <input type="text" name="name" value="${host.name || ''}" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows="4"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">${host.description || ''}</textarea>
                    </div>

                    <div>
                         <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                         <input type="text" name="tz" value="${host.tz || 'Europe/London'}"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>
                </div>

                <!-- Rates -->
                <div class="space-y-4 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Rates</h3>
                     <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Max Hourly Rate</label>
                            <input type="number" name="rate_max_hour" value="${host.rate_max_hour || 25}" step="0.5"
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Max Daily Rate</label>
                            <input type="number" name="rate_max_day" value="${host.rate_max_day || 150}" step="10"
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t border-gray-100">
                    <button type="submit" class="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow">
                        Save Changes
                    </button>
                    ${isEditing ? `
                        <button type="button" id="delete-host-btn" class="px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                            Delete Profile
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;
}

export function attachHostDetailHandlers(host) {
    const form = document.getElementById('host-form');

    // Save
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner w-5 h-5 border-2"></span>';

            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                tz: formData.get('tz'),
                rate_max_hour: parseFloat(formData.get('rate_max_hour')),
                rate_max_day: parseFloat(formData.get('rate_max_day'))
            };

            if (host.id) {
                await API.updateHost(host.id, data);
                showToast('Host updated successfully');
            } else {
                // await API.createHost(data); // Not implemented in UI typically
            }

            closeModal();
            if (window.loadHosts) window.loadHosts(); // Refresh list via global function

        } catch (error) {
            console.error(error);
            alert(error.message);
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    });

    // Delete
    const deleteBtn = document.getElementById('delete-host-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${host.name}? This cannot be undone.`)) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = 'Deleting...';

                    await API.deleteHost(host.id);
                    showToast('Host deleted successfully');
                    closeModal();

                    if (window.loadHosts) window.loadHosts();
                } catch (error) {
                    alert(error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Delete Profile';
                }
            }
        });
    }
}
