
import * as API from '../client.js';
import { closeModal } from '../components/modal.js';

export function renderCalendarDetail(session, options = { events: [], models: [] }) {
    const isEditing = !!session.id;
    const { events = [], models = [] } = options;

    const currentEvent = events.find(e => e.id === session.event_id);
    const currentModel = models.find(m => m.user_id === session.user_id) ||
        models.find(m => m.id === session.user_id); // Fallback

    const statusOptions = ['pending', 'confirmed', 'cancelled', 'closed', 'noshow', 'opencall'];

    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    let dateStr = '';
    let isPast = false;
    if (session.date_time) {
        const date = new Date(session.date_time);
        isPast = date < new Date();
        // Adjust to local ISO string for input
        const offset = date.getTimezoneOffset() * 60000;
        dateStr = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }

    return `
        <div class="p-6">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">${isEditing ? 'Edit Session' : 'New Session'}</h2>
                    <p class="text-sm text-gray-500">${isEditing ? 'Update session details' : 'Schedule a new life drawing session'}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="session-form" class="space-y-6">
                <!-- Links -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div style="display:none;">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Linked Event (Optional)</label>
                        <input list="event-list" name="event_search" 
                            value="${currentEvent ? `${currentEvent.name} (ID: ${currentEvent.id})` : ''}"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                            placeholder="Search event...">
                        <datalist id="event-list">
                            ${events.map(e => `<option value="${e.name} (ID: ${e.id})"></option>`).join('')}
                        </datalist>
                        <input type="hidden" name="event_id" value="${session.event_id || ''}">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Model (User)</label>
                        <input list="model-list" name="model_search" 
                            value="${currentModel ? `${currentModel.name || currentModel.fullname} (ID: ${currentModel.user_id || currentModel.id})` : ''}"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                            placeholder="Search model..." ${isPast ? 'disabled' : ''}>
                        <datalist id="model-list">
                            ${models.map(m => `<option value="${m.name || m.fullname || m.email} (ID: ${m.user_id || m.id})"></option>`).join('')}
                        </datalist>
                        <input type="hidden" name="user_id" value="${session.user_id || ''}">
                    </div>
                </div>

                <!-- Timing & Status -->
                <!-- Timing & Status -->
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input type="datetime-local" name="date_time" value="${dateStr}" required
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" ${isPast ? 'disabled' : ''}>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                            <input type="number" name="duration" step="0.5" value="${session.duration || 2.0}" required
                                class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary" ${isPast ? 'disabled' : ''}>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                             <select name="status" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary capitalize" ${isPast ? 'disabled' : ''}>
                                ${statusOptions.map(s => `
                                    <option value="${s}" ${session.status === s ? 'selected' : ''}>${s}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                 <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">In-Person Attendance</label>
                        <input type="number" name="attendance_inperson" value="${session.attendance_inperson || 0}"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Online Attendance</label>
                        <input type="number" name="attendance_online" value="${session.attendance_online || 0}"
                            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    </div>
                 </div>

                <!-- Details -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pose Format / Notes</label>
                    <textarea name="pose_format" rows="3"
                        class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm">${session.pose_format || ''}</textarea>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t border-gray-100">
                    <button type="submit" class="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow">
                        ${isEditing ? 'Save Changes' : 'Create Session'}
                    </button>
                    ${isEditing ? `
                        <button type="button" id="delete-session-btn" class="px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors ${isPast ? 'opacity-50 cursor-not-allowed' : ''}" ${isPast ? 'disabled' : ''}>
                            Delete
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;
}

export function attachCalendarDetailHandlers(session, options = {}) {
    const form = document.getElementById('session-form');

    const extractId = (value) => {
        const match = value.match(/\(ID: (\d+)\)$/);
        return match ? parseInt(match[1]) : null;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner w-5 h-5 border-2"></span>';

            const formData = new FormData(form);

            const eventSearch = formData.get('event_search');
            const hiddenEventId = formData.get('event_id');
            let eventId = hiddenEventId ? parseInt(hiddenEventId) : extractId(eventSearch);

            // Fallback if still null and search text exists
            if (!eventId && eventSearch) {
                eventId = extractId(eventSearch);
            }

            const modelSearch = formData.get('model_search');
            let modelId = extractId(modelSearch);
            if (!modelSearch) {
                modelId = null;
            } else if (!modelId && options.models) {
                // Try to find by name match if ID extraction failed
                const match = options.models.find(m =>
                    (m.name && m.name.toLowerCase() === modelSearch.toLowerCase()) ||
                    (m.fullname && m.fullname.toLowerCase() === modelSearch.toLowerCase())
                );
                if (match) modelId = match.user_id || match.id;
            }

            // Convert local datetime input back to ISO string
            const dateInput = formData.get('date_time');
            const dateObj = new Date(dateInput);
            const dateIso = dateObj.toISOString();

            const data = {
                event_id: eventId,
                user_id: modelId,
                date_time: dateIso,
                duration: parseFloat(formData.get('duration')),
                status: formData.get('status'),
                attendance_inperson: parseInt(formData.get('attendance_inperson') || 0),
                attendance_online: parseInt(formData.get('attendance_online') || 0),
                pose_format: formData.get('pose_format'),
            };

            if (session.id) {
                await API.updateSession(session.id, data);
            } else {
                await API.createSession(data);
            }

            closeModal();
            if (window.loadSessions) window.loadSessions();

        } catch (error) {
            console.error(error);
            alert(error.message);
            btn.disabled = false;
            btn.textContent = session.id ? 'Save Changes' : 'Create Session';
        }
    });

    const deleteBtn = document.getElementById('delete-session-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this session?')) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = 'Deleting...';
                    await API.deleteSession(session.id);
                    closeModal();
                    if (window.loadSessions) window.loadSessions();
                } catch (error) {
                    alert(error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = 'Delete';
                }
            }
        });
    }
}
