
// In src/admin/views/event-detail.js

import * as API from '../client.js';
import { closeModal } from '../components/modal.js';


export function renderEventDetail(event, options = { venues: [], hosts: [] }) {
    const isEditing = !!event.id;
    const { venues = [], hosts = [] } = options;

    const currentVenue = venues.find(v => v.id === event.venue_id) || event.venue;
    const currentHost = hosts.find(h => h.user_id === event.user_id) ||
        hosts.find(h => h.id === event.user_id) ||
        (event.host ? { id: event.user_id, name: event.host.name } : null);

    return `
        <div class="p-6">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">${isEditing ? 'Edit Event' : 'New Event'}</h2>
                    <p class="text-sm text-gray-500">${isEditing ? 'Update event configuration' : 'Create a new recurring event'}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="event-form" class="space-y-6">
                <!-- Basic Info -->
                <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Event Details</h3>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                        <input type="text" name="name" value="${event.name || ''}" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows="3"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">${event.description || ''}</textarea>
                    </div>

                     <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                            <select name="frequency" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="weekly" ${event.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                                <option value="monthly" ${event.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                                <option value="adhoc" ${event.frequency === 'adhoc' ? 'selected' : ''}>Ad-hoc</option>
                            </select>
                        </div>
                        <div>
                             <label class="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                             <select name="week_day" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                <option value="monday" ${event.week_day === 'monday' ? 'selected' : ''}>Monday</option>
                                <option value="tuesday" ${event.week_day === 'tuesday' ? 'selected' : ''}>Tuesday</option>
                                <option value="wednesday" ${event.week_day === 'wednesday' ? 'selected' : ''}>Wednesday</option>
                                <option value="thursday" ${event.week_day === 'thursday' ? 'selected' : ''}>Thursday</option>
                                <option value="friday" ${event.week_day === 'friday' ? 'selected' : ''}>Friday</option>
                                <option value="saturday" ${event.week_day === 'saturday' ? 'selected' : ''}>Saturday</option>
                                <option value="sunday" ${event.week_day === 'sunday' ? 'selected' : ''}>Sunday</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Relationships -->
                <div class="space-y-4 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Venue & Host</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Venue Selector -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                            <input list="venue-list" name="venue_search" 
                                value="${currentVenue ? `${currentVenue.name} (ID: ${currentVenue.id})` : ''}"
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                                placeholder="Search venue...">
                            <datalist id="venue-list">
                                ${venues.map(v => `<option value="${v.name} (ID: ${v.id})"></option>`).join('')}
                            </datalist>
                             <input type="hidden" name="venue_id" value="${event.venue_id || ''}">
                             <p class="text-xs text-gray-500 mt-1">Select from list</p>
                        </div>

                        <!-- Host Selector -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Host (User)</label>
                            <input list="host-list" name="host_search" 
                                value="${currentHost ? `${currentHost.name} (ID: ${currentHost.user_id || currentHost.id})` : ''}"
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                                placeholder="Search host...">
                            <datalist id="host-list">
                                ${hosts.map(h => `<option value="${h.name} (ID: ${h.user_id || h.id})"></option>`).join('')}
                            </datalist>
                            <input type="hidden" name="user_id" value="${event.user_id || ''}">
                            <p class="text-xs text-gray-500 mt-1">Select from list</p>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t border-gray-100">
                    <button type="submit" class="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow">
                        ${isEditing ? 'Save Changes' : 'Create Event'}
                    </button>
                    ${isEditing ? `
                        <button type="button" id="delete-event-btn" class="px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;
}

export function attachEventDetailHandlers(event, options = { venues: [], hosts: [] }) {
    const form = document.getElementById('event-form');

    // Helper to extract ID from "Name (ID: 123)" format
    const extractId = (value) => {
        const match = value.match(/\(ID: (\d+)\)$/);
        return match ? parseInt(match[1]) : null;
    };

    // Save
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner w-5 h-5 border-2"></span>';

            const formData = new FormData(form);

            // Resolve IDs from search inputs if hidden fields are empty or mismatched
            const venueSearch = formData.get('venue_search');
            let venueId = extractId(venueSearch);
            // If user cleared the input, venueId is null
            if (!venueSearch) venueId = null;

            const hostSearch = formData.get('host_search');
            let userId = extractId(hostSearch);
            if (!hostSearch) userId = null;

            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                frequency: formData.get('frequency'),
                week_day: formData.get('week_day'),
                venue_id: venueId,
                user_id: userId,
            };

            if (event.id) {
                await API.updateEvent(event.id, data);
                showToast('Event updated successfully');
            } else {
                await API.createEvent(data);
                showToast('Event created successfully');
            }

            closeModal();
            if (window.loadEvents) window.loadEvents();

        } catch (error) {
            console.error(error);
            alert(error.message);
            btn.disabled = false;
            btn.textContent = event.id ? 'Save Changes' : 'Create Event';
        }
    });

    // ... delete handler remains same ...
    const deleteBtn = document.getElementById('delete-event-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${event.name}?`)) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = 'Deleting...';

                    await API.deleteEvent(event.id);
                    showToast('Event deleted successfully');
                    closeModal();

                    if (window.loadEvents) window.loadEvents();
                } catch (error) {
                    alert(error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Delete';
                }
            }
        });
    }
}
