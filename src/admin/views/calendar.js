import * as API from '../client.js';
import { renderCalendarDetail, attachCalendarDetailHandlers } from './calendar-detail.js';
import { renderEventDetail, attachEventDetailHandlers } from './event-detail.js';
import { renderHostDetail, attachHostDetailHandlers } from './host-detail.js';
import { showModal } from '../components/modal.js';

// State
let sessionsData = [];
let optionsData = { events: [], models: [] };
let viewState = {
    mode: 'dashboard',   // 'dashboard' | 'detail'
    detailView: 'calendar', // 'calendar' | 'agenda'
    selectedEventId: null
};
let currentMonth = new Date();

export function renderCalendar() {
    return `<div id="calendar-root">${renderCalendarContent()}</div>`;
}

function renderCalendarContent() {
    // If in detail mode, ensure we have the event name
    let eventName = 'Event Calendar';
    if (viewState.mode === 'detail' && viewState.selectedEventId) {
        // Try to find event name from sessions first (if exists) or options
        const session = sessionsData.find(s => s.event_id === viewState.selectedEventId);
        if (session) {
            eventName = session.event_name;
        } else if (optionsData.events.length) {
            const evt = optionsData.events.find(e => e.id === viewState.selectedEventId);
            if (evt) eventName = evt.name;
        }
    }

    if (viewState.mode === 'dashboard') {
        return renderDashboard();
    } else {
        return renderDetailView(eventName);
    }
}

// --- Views ---

function renderDashboard() {
    return `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h2 class="text-2xl font-bold text-gray-900">Calendar</h2>
                     <p class="text-sm text-gray-500">Select an event to view its schedule</p>
                </div>
                <!-- Global add button removed as per list layout request with per-item actions -->
            </div>

            <div id="content-area">
                ${renderDashboardList()}
            </div>
        </div>
    `;
}

function renderDetailView(eventName) {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <button id="back-to-dashboard" class="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title="Back to All Events">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${eventName}</h2>
                        <p class="text-sm text-gray-500">Manage sessions for this event</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <!-- View Toggle -->
                    <div class="bg-gray-100 p-1 rounded-xl flex gap-1">
                        <button class="view-btn px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewState.detailView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="calendar">
                           Calendar
                        </button>
                        <button class="view-btn px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewState.detailView === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}" data-view="agenda">
                           Agenda
                        </button>
                    </div>

                    <button id="context-add-btn" class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95">
                        <span class="material-symbols-outlined text-lg">add</span>
                        <span class="hidden md:inline">Add Booking</span>
                    </button>
                </div>
            </div>

            <!-- Content Area -->
            <div id="detail-content">
                ${viewState.detailView === 'calendar' ? renderEventCalendar() : renderAgenda()}
            </div>
        </div>
    `;
}

// --- Sub-Components ---

function renderDashboardList() {
    const eventsMap = new Map();

    // Populate events map logic same as before but also ensuring all events 
    // from optionsData are present even if they have no sessions (if desired, but user said 'make layout a list')
    // We'll stick to displaying events that have sessions or distinct event_ids in session data for now, 
    // matching previous logic but formatted as list. 
    // Wait, if an event has 0 sessions, it might not be in sessionsData.
    // Ideally we merge with optionsData.events if available.

    // First, map distinct events from sessions
    sessionsData.forEach(session => {
        if (!session.event_id) return;
        if (!eventsMap.has(session.event_id)) {
            eventsMap.set(session.event_id, {
                id: session.event_id,
                name: session.event_name,
                host: session.host_name,
                hostId: session.host_user_id,
                past: 0,
                futureConfirmed: 0,
                futurePending: 0
            });
        }

        const group = eventsMap.get(session.event_id);
        const date = new Date(session.date_time);
        const now = new Date();

        if (date < now) {
            group.past++;
        } else {
            if (session.status === 'confirmed') group.futureConfirmed++;
            else if (session.status === 'pending') group.futurePending++;
        }
    });

    // Also ensure events from optionsData are included if not present (optional enhancement for "Index" view)
    // But let's stick to existing logic for consistency unless empty
    if (eventsMap.size === 0 && optionsData.events.length > 0) {
        optionsData.events.forEach(e => {
            if (!eventsMap.has(e.id)) {
                eventsMap.set(e.id, {
                    id: e.id,
                    name: e.name,
                    host: 'Unknown Host', // We might need to look up host
                    past: 0,
                    futureConfirmed: 0,
                    futurePending: 0
                });
            }
        });
    }

    if (eventsMap.size === 0) {
        return `
            <div class="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
                <span class="material-symbols-outlined text-4xl mb-2 text-gray-300">event_note</span>
                <p>No events found.</p>
            </div>
        `;
    }

    return `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th class="px-6 py-4">Event Name</th>
                        <th class="px-6 py-4">Host</th>
                        <th class="px-6 py-4 text-center">Sessions</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    ${Array.from(eventsMap.values()).map(event => `
                        <tr class="hover:bg-gray-50 transition-colors group">
                            <td class="px-6 py-4 cursor-pointer event-row" data-event-id="${event.id}">
                                <div class="font-bold text-gray-900 group-hover:text-primary transition-colors">${event.name}</div>
                            </td>
                            <td class="px-6 py-4 cursor-pointer event-row" data-event-id="${event.id}">
                                <div class="text-sm text-gray-600">${event.host || '—'}</div>
                            </td>
                            <td class="px-6 py-4 cursor-pointer event-row" data-event-id="${event.id}">
                                <div class="flex items-center justify-center gap-2">
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium" title="Past">
                                        ${event.past}
                                    </span>
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-medium" title="Confirmed">
                                        ${event.futureConfirmed}
                                    </span>
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium" title="Pending">
                                        ${event.futurePending}
                                    </span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button class="quick-add-btn flex items-center gap-1.5 ml-auto bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95" data-event-id="${event.id}">
                                    <span class="material-symbols-outlined text-sm">add</span>
                                    <span>New Session</span>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAgenda() {
    // Filter by selected Event ID and sort by date descending
    const displayData = sessionsData
        .filter(s => s.event_id === viewState.selectedEventId)
        .sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

    // Group by Date (YYYY-MM-DD)
    const grouped = new Map();
    displayData.forEach(s => {
        const dateKey = s.date_time.split('T')[0];
        if (!grouped.has(dateKey)) grouped.set(dateKey, []);
        grouped.get(dateKey).push(s);
    });

    return `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-4 w-48">Date</th>
                            <th class="px-6 py-4">Sessions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        ${grouped.size > 0 ? Array.from(grouped.entries()).map(([date, sessions]) => renderAgendaGroup(date, sessions)).join('') :
            `<tr><td colspan="2" class="px-6 py-12 text-center text-gray-500">No sessions found for this event.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAgendaGroup(dateKey, sessions) {
    const dateObj = new Date(dateKey);
    // Adjust for timezone issues if dateKey is UTC but we want local display? 
    // Actually dateKey from ISO string is usually OK if we just interpret it as YYYY-MM-DD.
    // Let's make it look nice.
    const day = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = dateObj.getDate();
    const month = dateObj.toLocaleDateString(undefined, { month: 'short' });
    const year = dateObj.getFullYear();

    // Sort sessions within the day by time ascending
    sessions.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

    return `
        <tr class="hover:bg-gray-50/50 transition-colors">
            <td class="px-6 py-6 align-top border-r border-gray-50 bg-gray-50/30">
                <div class="flex flex-col items-center text-center">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">${day}</span>
                    <span class="text-2xl font-bold text-gray-900 leading-none mt-1">${dayNum}</span>
                    <span class="text-xs font-medium text-gray-500 mt-1">${month} ${year}</span>
                </div>
            </td>
            <td class="px-6 py-4 align-top">
                <div class="space-y-3">
                    ${sessions.map(renderAgendaSessionItem).join('')}
                </div>
            </td>
        </tr>
    `;
}

function renderAgendaSessionItem(session) {
    const time = new Date(session.date_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    const statusColors = {
        'confirmed': 'bg-green-100 text-green-800 border-green-200',
        'pending': 'bg-amber-100 text-amber-800 border-amber-200',
        'cancelled': 'bg-red-50 text-red-700 border-red-100',
        'closed': 'bg-gray-100 text-gray-600 border-gray-200',
        'noshow': 'bg-purple-50 text-purple-700 border-purple-100',
        'opencall': 'bg-blue-50 text-blue-700 border-blue-100'
    };
    const statusClass = statusColors[session.status] || 'bg-gray-50 text-gray-600 border-gray-200';

    return `
        <div class="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer session-row" data-id="${session.id}">
            <div class="font-mono text-sm font-medium text-gray-500 min-w-[60px]">${time}</div>
            
            <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">${session.model_name || session.model_email || 'Unknown Model'}</div>
                <div class="text-xs text-gray-500 flex items-center gap-2">
                    <span>${session.duration}h</span>
                    ${session.pose_format ? `<span class="w-1 h-1 rounded-full bg-gray-300"></span><span class="truncate max-w-[200px]">${session.pose_format}</span>` : ''}
                </div>
            </div>

            <div>
                <span class="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${statusClass} border capitalize select-none">
                    ${session.status}
                </span>
            </div>
        </div>
    `;
}

function renderEventCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const monthName = firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    // Grid cells
    let cells = [];

    for (let i = 0; i < startDayOfWeek; i++) {
        cells.push(`<div class="h-32 bg-gray-50/50 border-b border-r border-gray-100 p-2"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Filter by selectedEventId
        const daySessions = sessionsData.filter(s => {
            return s.event_id === viewState.selectedEventId && s.date_time.startsWith(dateStr);
        }).sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

        cells.push(`
            <div class="h-32 bg-white border-b border-r border-gray-100 p-2 hover:bg-gray-50 transition-colors relative group calendar-day-cell cursor-pointer" data-date="${dateStr}">
                <span class="text-sm font-medium ${daySessions.length ? 'text-gray-900' : 'text-gray-400'}">${day}</span>
                <div class="mt-2 space-y-1 overflow-y-auto max-h-[90px]">
                    ${daySessions.map(s => {
            const time = new Date(s.date_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            let dotColor = 'bg-gray-400';
            if (s.status === 'confirmed') dotColor = 'bg-green-500';
            if (s.status === 'pending') dotColor = 'bg-amber-500';
            if (s.status === 'cancelled') dotColor = 'bg-red-500';

            return `
                            <div class="flex items-center gap-1.5 text-xs p-1 rounded hover:bg-gray-100 cursor-pointer session-item" data-id="${s.id}" title="${time}">
                                <div class="w-2 h-2 rounded-full ${dotColor}"></div>
                                <span class="truncate font-medium text-gray-700">${time}</span>
                            </div>
                         `;
        }).join('')}
                </div>
            </div>
        `);
    }

    const totalCells = cells.length;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
        for (let i = 0; i < remaining; i++) cells.push(`<div class="h-32 bg-gray-50/50 border-b border-r border-gray-100"></div>`);
    }

    return `
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden select-none">
            <!-- Navigate Month -->
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
                <button id="prev-month" class="p-2 hover:bg-gray-100 rounded-full text-gray-500"><span class="material-symbols-outlined">chevron_left</span></button>
                <div class="flex flex-col items-center">
                    <h3 class="text-lg font-bold text-gray-900">${monthName}</h3>
                </div>
                <button id="next-month" class="p-2 hover:bg-gray-100 rounded-full text-gray-500"><span class="material-symbols-outlined">chevron_right</span></button>
            </div>
            
            <div class="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d =>
        `<div class="py-2 text-xs font-semibold text-gray-500 uppercase">${d}</div>`
    ).join('')}
            </div>

            <div class="grid grid-cols-7">
                ${cells.join('')}
            </div>
        </div>
    `;
}

// --- Logic ---

export function attachCalendarHandlers() {
    // Initial fetch if needed, relying on state
    if (!sessionsData.length) {
        loadSessions();
        loadOptions();
    } else {
        refreshView();
    }
}

function refreshView() {
    const root = document.getElementById('calendar-root');
    if (root) {
        root.innerHTML = renderCalendarContent();
        attachSubHandlers();
    }
}

function attachSubHandlers() {
    // Dashboard Handlers
    if (viewState.mode === 'dashboard') {
        const eventsList = document.querySelector('tbody');
        if (eventsList) {
            eventsList.addEventListener('click', (e) => {
                // Check for quick-add button
                const quickAddBtn = e.target.closest('.quick-add-btn');
                if (quickAddBtn) {
                    e.stopPropagation();
                    const eventId = parseInt(quickAddBtn.dataset.eventId);
                    const prefill = { event_id: eventId };
                    showModal(renderCalendarDetail(prefill, optionsData), 'calendar-detail');
                    attachCalendarDetailHandlers(prefill, optionsData);
                    return;
                }

                // Check for row click
                const row = e.target.closest('.event-row');
                if (row) {
                    const id = parseInt(row.dataset.eventId);
                    const sessionInfo = sessionsData.find(s => s.event_id === id);

                    viewState.selectedEventId = id;
                    viewState.mode = 'detail';
                    viewState.detailView = 'calendar'; // Default to calendar

                    // Reset calendar month to today
                    currentMonth = new Date();

                    refreshView();
                }
            });
        }
    }

    // Detail Handlers
    if (viewState.mode === 'detail') {
        document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
            viewState.mode = 'dashboard';
            viewState.selectedEventId = null;
            refreshView();
        });

        document.getElementById('context-add-btn')?.addEventListener('click', () => {
            const prefill = { event_id: viewState.selectedEventId };
            // Also prefill user_id if event has one? Not typical API but useful logic.
            // But let's check API. Calendar detail pre-fills form.
            showModal(renderCalendarDetail(prefill, optionsData), 'calendar-detail');
            attachCalendarDetailHandlers(prefill, optionsData);
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                viewState.detailView = btn.dataset.view;
                refreshView();
            });
        });

        if (viewState.detailView === 'calendar') {
            document.getElementById('prev-month')?.addEventListener('click', () => {
                currentMonth.setMonth(currentMonth.getMonth() - 1);
                refreshView();
            });
            document.getElementById('next-month')?.addEventListener('click', () => {
                currentMonth.setMonth(currentMonth.getMonth() + 1);
                refreshView();
            });
            document.querySelectorAll('.session-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(item.dataset.id);
                    const session = sessionsData.find(s => s.id === id);
                    if (session) {
                        showModal(renderCalendarDetail(session, optionsData), 'calendar-detail');
                        attachCalendarDetailHandlers(session, optionsData);
                    }
                });
            });

            document.querySelectorAll('.calendar-day-cell').forEach(cell => {
                cell.addEventListener('click', () => {
                    const dateStr = cell.dataset.date;
                    // Pre-fill date with a default time (e.g. 19:00) 
                    const dateTime = `${dateStr} 19:00:00`;
                    const prefill = {
                        event_id: viewState.selectedEventId,
                        date_time: dateTime
                    };
                    showModal(renderCalendarDetail(prefill, optionsData), 'calendar-detail');
                    attachCalendarDetailHandlers(prefill, optionsData);
                });
            });
        }

        if (viewState.detailView === 'agenda') {
            document.querySelectorAll('.session-row').forEach(row => {
                row.addEventListener('click', () => {
                    const id = parseInt(row.dataset.id);
                    const session = sessionsData.find(s => s.id === id);
                    if (session) {
                        showModal(renderCalendarDetail(session, optionsData), 'calendar-detail');
                        attachCalendarDetailHandlers(session, optionsData);
                    }
                });
            });
        }
    }
}

async function loadSessions() {
    try {
        sessionsData = await API.getCalendar();
        refreshView();
        window.loadSessions = loadSessions;
    } catch (error) {
        console.error(error);
        const root = document.getElementById('calendar-root');
        if (root) root.innerHTML = `<div class="p-8 text-center text-red-500">Failed to load sessions: ${error.message}</div>`;
    }
}

async function loadOptions() {
    try {
        const [events, models] = await Promise.all([
            API.getEvents(),
            API.getModels()
        ]);
        optionsData = { events, models };
        // If we are already in detail view, refreshing might update the title
        if (viewState.mode === 'detail') refreshView();
    } catch (e) {
        console.error("Failed to load dropdown options", e);
    }
}
