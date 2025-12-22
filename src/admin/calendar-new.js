// Calendar functions - add these to main.js after renderModels()

function renderCalendar() {
    const { currentMonth, currentYear } = state.calendar;

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const today = new Date();
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

    // Group events by date
    const eventsByDate = {};
    state.data.calendar.forEach(event => {
        const date = new Date(event.date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const dateKey = date.getDate();
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        }
    });

    // Build calendar grid
    let calendarHTML = '<div class="calendar-grid">';

    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const events = eventsByDate[day] || [];
        const isToday = isCurrentMonth && day === today.getDate();

        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${events.length > 0 ? 'has-events' : ''}" 
                 onclick="handleDateClick(${day}, ${events.length > 0})">
                <div class="day-number">${day}</div>
                <div class="day-events">
                    ${events.map(event => `
                        <div class="calendar-event ${event.tbc ? 'tbc' : ''}" 
                             onclick="event.stopPropagation(); handleEventClick(${event.id})">
                            <div class="event-model">${event.fullname || 'Unknown'}</div>
                            <div class="event-venue">${event.venue_name || 'Unknown'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calendarHTML += '</div>';

    return `
        <div class="content">
            <div class="content-header">
                <div class="calendar-nav">
                    <button class="btn-sm" onclick="changeMonth(-1)">← Prev</button>
                    <h1>Calendar - ${firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h1>
                    <button class="btn-sm" onclick="changeMonth(1)">Next →</button>
                </div>
            </div>
            ${calendarHTML}
            ${renderBookingModal()}
        </div>
    `;
}

// Calendar navigation
window.changeMonth = function (delta) {
    state.calendar.currentMonth += delta;
    if (state.calendar.currentMonth > 11) {
        state.calendar.currentMonth = 0;
        state.calendar.currentYear++;
    } else if (state.calendar.currentMonth < 0) {
        state.calendar.currentMonth = 11;
        state.calendar.currentYear--;
    }
    render();
};

// Handle date click (empty date)
window.handleDateClick = function (day, hasEvents) {
    if (!hasEvents) {
        state.calendar.selectedDate = new Date(state.calendar.currentYear, state.calendar.currentMonth, day);
        state.calendar.selectedEvent = null;
        showModal('booking-modal');
    }
};

// Handle event click (existing booking)
window.handleEventClick = async function (eventId) {
    const event = state.data.calendar.find(e => e.id === eventId);
    if (event) {
        state.calendar.selectedEvent = event;
        state.calendar.selectedDate = new Date(event.date);
        showModal('booking-modal');
    }
};

// Modal functions
function showModal(modalId) {
    render();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    state.calendar.selectedDate = null;
    state.calendar.selectedEvent = null;
};

// Render booking modal
function renderBookingModal() {
    const { selectedDate, selectedEvent } = state.calendar;
    if (!selectedDate && !selectedEvent) return '';

    const isEdit = !!selectedEvent;
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';

    return `
        <div id="booking-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${isEdit ? 'Edit Booking' : 'New Booking'}</h2>
                    <button class="modal-close" onclick="closeModal('booking-modal')">×</button>
                </div>
                <form id="booking-form" onsubmit="saveBooking(event)">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" name="date" value="${dateStr}" required>
                    </div>
                    <div class="form-group">
                        <label>Model</label>
                        <select name="user_id" required>
                            <option value="">Select a model...</option>
                            ${state.data.models.map(model => `
                                <option value="${model.user_id}" ${selectedEvent?.user_id === model.user_id ? 'selected' : ''}>
                                    ${model.fullname}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Venue</label>
                        <select name="venue_id" required>
                            <option value="">Select a venue...</option>
                            ${state.data.venues.map(venue => `
                                <option value="${venue.id}" ${selectedEvent?.venue_id === venue.id ? 'selected' : ''}>
                                    ${venue.host?.name} - ${venue.area}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Start Time</label>
                            <input type="time" name="start" value="${selectedEvent?.start || '19:00'}" required>
                        </div>
                        <div class="form-group">
                            <label>Duration (hours)</label>
                            <input type="number" name="duration" step="0.5" value="${selectedEvent?.duration || 2}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>In-Person Attendance</label>
                            <input type="number" name="attendance_inperson" value="${selectedEvent?.attendance_inperson || 0}" required>
                        </div>
                        <div class="form-group">
                            <label>Online Attendance</label>
                            <input type="number" name="attendance_online" value="${selectedEvent?.attendance_online || 0}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="3">${selectedEvent?.notes || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="tbc" ${selectedEvent?.tbc ? 'checked' : ''}>
                            To Be Confirmed (TBC)
                        </label>
                    </div>
                    <div class="modal-footer">
                        ${isEdit ? `<button type="button" class="btn-danger" onclick="deleteBooking(${selectedEvent.id})">Delete</button>` : ''}
                        <button type="button" class="btn-secondary" onclick="closeModal('booking-modal')">Cancel</button>
                        <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'} Booking</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// Save booking
window.saveBooking = async function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const data = {
        date: formData.get('date'),
        user_id: parseInt(formData.get('user_id')),
        venue_id: parseInt(formData.get('venue_id')),
        start: formData.get('start'),
        duration: parseFloat(formData.get('duration')),
        attendance_inperson: parseInt(formData.get('attendance_inperson')),
        attendance_online: parseInt(formData.get('attendance_online')),
        notes: formData.get('notes'),
        tbc: formData.get('tbc') ? 1 : 0
    };

    try {
        const isEdit = !!state.calendar.selectedEvent;
        const endpoint = isEdit ? `/api/calendar/${state.calendar.selectedEvent.id}` : '/api/calendar';
        const method = isEdit ? 'PUT' : 'POST';

        await apiCall(endpoint, {
            method,
            body: JSON.stringify(data)
        });

        // Reload calendar data
        await loadData('calendar');
        closeModal('booking-modal');
    } catch (error) {
        alert('Failed to save booking: ' + error.message);
    }
};

// Delete booking
window.deleteBooking = async function (id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
        await apiCall(`/api/calendar/${id}`, { method: 'DELETE' });
        await loadData('calendar');
        closeModal('booking-modal');
    } catch (error) {
        alert('Failed to delete booking: ' + error.message);
    }
};
