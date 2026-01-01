
import * as API from '../client.js';
import { closeModal } from '../components/modal.js';

export function renderVenueDetail(venue) {
    const isEditing = !!venue.id;
    return `
        <div class="p-6">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">${isEditing ? 'Edit Venue' : 'New Venue'}</h2>
                    <p class="text-sm text-gray-500">${isEditing ? 'Update venue details' : 'Create a new venue'}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="venue-form" class="space-y-6">
                <!-- Basic Info -->
                <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Venue Details</h3>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                        <input type="text" name="name" value="${venue.name || ''}" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>

                     <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <input type="text" name="tz" value="${venue.tz || 'Europe/London'}" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>
                </div>

                <!-- Address -->
                <div class="space-y-4 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Location</h3>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                        <input type="text" name="address_line_1" value="${venue.address_line_1 || ''}"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input type="text" name="address_city" value="${venue.address_city || 'London'}"
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                            <input type="text" name="address_postcode" value="${venue.address_postcode || ''}"
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        </div>
                    </div>
                    
                    <div>
                         <label class="block text-sm font-medium text-gray-700 mb-1">Area</label>
                         <input type="text" name="address_area" value="${venue.address_area || ''}"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t border-gray-100">
                    <button type="submit" class="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow">
                        ${isEditing ? 'Save Changes' : 'Create Venue'}
                    </button>
                    ${isEditing ? `
                        <button type="button" id="delete-venue-btn" class="px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;
}

export function attachVenueDetailHandlers(venue) {
    const form = document.getElementById('venue-form');

    // Save
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner w-5 h-5 border-2"></span>';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            if (venue.id) {
                await API.updateVenue(venue.id, data);
                showToast('Venue updated successfully');
            } else {
                await API.createVenue(data);
                showToast('Venue created successfully');
            }

            closeModal();
            if (window.loadVenues) window.loadVenues();

        } catch (error) {
            console.error(error);
            alert(error.message);
            btn.disabled = false;
            btn.textContent = venue.id ? 'Save Changes' : 'Create Venue';
        }
    });

    // Delete
    const deleteBtn = document.getElementById('delete-venue-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${venue.name}?`)) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = 'Deleting...';

                    await API.deleteVenue(venue.id);
                    showToast('Venue deleted successfully');
                    closeModal();

                    if (window.loadVenues) window.loadVenues();
                } catch (error) {
                    alert(error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Delete';
                }
            }
        });
    }
}
