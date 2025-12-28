/**
 * Calendar View
 * Session scheduling and management
 */

import { state } from '../app.js';

// Calendar state
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

/**
 * Render the calendar view
 */
export function renderCalendar() {
    const sessions = state.data.calendar || [];

    return `
        <div class="flex flex-col">
            <!-- Calendar Header -->
            <div class="flex items-center justify-between px-4 py-3 sticky top-[72px] z-10 bg-background-light border-b border-gray-200">
                <button onclick="changeCalendarMonth(-1)" class="btn-icon">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <h2 class="text-lg font-bold">${getMonthName(currentMonth)} ${currentYear}</h2>
                <button onclick="changeCalendarMonth(1)" class="btn-icon">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
            
            <!-- Day Headers -->
            <div class="grid grid-cols-7 bg-white border-b border-gray-100">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                    <div class="text-center py-2 text-xs font-medium text-gray-500">${day}</div>
                `).join('')}
            </div>
            
            <!-- Calendar Grid -->
            <div id="calendar-grid" class="grid grid-cols-7 gap-px bg-gray-200">
                ${renderCalendarDays(sessions)}
            </div>
            
            <!-- Upcoming Sessions -->
            <div class="px-4 py-4">
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Upcoming Sessions</h3>
                <div class="space-y-3">
                    ${renderUpcomingSessions(sessions)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render calendar day cells
 */
function renderCalendarDays(sessions) {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

    let html = '';

    // Empty cells for padding
    for (let i = 0; i < startPad; i++) {
        html += '<div class="bg-gray-50 min-h-[80px]"></div>';
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = isCurrentMonth && today.getDate() === day;
        const daySessions = sessions.filter(s => s.date_time?.startsWith(dateStr));

        html += `
            <div class="bg-white min-h-[80px] p-1 ${isToday ? 'ring-2 ring-primary ring-inset' : ''}"
                 onclick="openCalendarDay('${dateStr}')">
                <div class="flex items-center justify-center w-6 h-6 mb-1 
                            ${isToday ? 'bg-primary text-white rounded-full' : 'text-gray-700'}">
                    <span class="text-xs font-medium">${day}</span>
                </div>
                ${daySessions.slice(0, 2).map(s => renderDayEvent(s)).join('')}
                ${daySessions.length > 2 ? `
                    <div class="text-[10px] text-gray-500 text-center">+${daySessions.length - 2} more</div>
                ` : ''}
            </div>
        `;
    }

    return html;
}

/**
 * Render a mini event in the calendar
 */
function renderDayEvent(session) {
    const status = session.status || 'confirmed';
    const statusColors = {
        'confirmed': 'bg-green-100 text-green-700',
        'opencall': 'bg-amber-100 text-amber-700',
        'pending': 'bg-blue-100 text-blue-700',
        'cancelled': 'bg-gray-100 text-gray-500',
        'closed': 'bg-gray-100 text-gray-500',
    };

    return `
        <div class="text-[10px] px-1 py-0.5 rounded mb-0.5 truncate ${statusColors[status] || 'bg-gray-100'}">
            ${session.model_name || session.venue_name || 'Session'}
        </div>
    `;
}

/**
 * Render upcoming sessions list
 */
function renderUpcomingSessions(sessions) {
    const now = new Date();
    const upcoming = sessions
        .filter(s => new Date(s.date_time) >= now)
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
        .slice(0, 5);

    if (upcoming.length === 0) {
        return '<p class="text-sm text-gray-500 text-center py-4">No upcoming sessions</p>';
    }

    return upcoming.map(session => {
        const date = new Date(session.date_time);
        const status = session.status || 'confirmed';
        const statusColors = {
            'confirmed': 'badge-success',
            'opencall': 'badge-warning',
            'pending': 'badge-info',
            'cancelled': 'badge-error',
            'closed': 'badge-error',
        };

        return `
            <div class="card p-4">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900">${session.venue_name || 'Unknown Venue'}</p>
                        <p class="text-sm text-gray-500 mt-0.5">
                            ${formatDate(date)} at ${formatTime(date)}
                        </p>
                        ${session.model_name ? `
                            <p class="text-sm text-primary mt-1">${session.model_name}</p>
                        ` : ''}
                    </div>
                    <span class="badge ${statusColors[status]}">${status}</span>
                </div>
            </div>
        `;
    }).join('');
}

function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
}

function formatDate(date) {
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// Global functions for onclick handlers
window.changeCalendarMonth = function (delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    // Re-render by importing and calling render
    import('../app.js').then(m => m.render());
};

window.openCalendarDay = function (dateStr) {
    console.log('Open day:', dateStr);
    // TODO: Open day detail modal
};
