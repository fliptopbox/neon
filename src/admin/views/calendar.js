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
    selectedEventId: null,
    hostFilter: null
};
let currentMonth = new Date();

export function renderCalendar() {
    // Check filter from external navigation
    const pendingHostFilter = sessionStorage.getItem('calendar_host_filter');
    if (pendingHostFilter) {
        viewState.hostFilter = parseInt(pendingHostFilter);
        sessionStorage.removeItem('calendar_host_filter'); // Consume it
        viewState.mode = 'dashboard';
    }

    const pendingEventFilter = sessionStorage.getItem('calendar_event_filter');
    if (pendingEventFilter) {
        viewState.selectedEventId = parseInt(pendingEventFilter);
        sessionStorage.removeItem('calendar_event_filter'); // Consume it
        viewState.mode = 'detail'; // Go directly to detailed calendar view
        viewState.detailView = 'calendar';
    }

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

// ... (renderCalendarContent same as before) 

// --- Views ---

function renderDashboard() {
    return `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h2 class="text-2xl font-bold text-gray-900">Calendar</h2>
                     <p class="text-sm text-gray-500">Select an event to view its schedule</p>
                </div>
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
    let filterBanner = '';

    // Filter logic
    let displaySessions = sessionsData;
    if (viewState.hostFilter) {
        displaySessions = sessionsData.filter(s => s.host_user_id === viewState.hostFilter);
        // Find host name for banner
        const hostName = displaySessions[0]?.host_name || 'Host';

        filterBanner = `
            <div class="bg-blue-50 text-blue-700 px-4 py-3 rounded-xl flex items-center justify-between mb-6 border border-blue-100">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined">filter_alt</span>
                    <span class="font-medium">Filtered by Host: ${hostName}</span>
                </div>
                <button id="clear-filter-btn" class="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
                    Clear Filter
                </button>
            </div>
        `;
    }

    // Populate events map
    displaySessions.forEach(session => {
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
            ${filterBanner}
            <div class="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
                <span class="material-symbols-outlined text-4xl mb-2 text-gray-300">event_note</span>
                <p>No events found.</p>
            </div>
        `;
    }

    return `
        ${filterBanner}
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th class="px-6 py-4">Event</th>
                        <th class="px-6 py-4 text-center">Sessions</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    ${Array.from(eventsMap.values()).map(event => `
                        <tr class="hover:bg-gray-50 transition-colors group">
                            <td class="px-6 py-4 cursor-pointer event-row" data-event-id="${event.id}">
                                <div>
                                    <div class="block text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-0.5">${event.name}</div>
                                    <div class="text-sm text-gray-500 flex items-center gap-1.5">
                                        <span class="material-symbols-outlined text-[16px]">person</span>
                                        ${event.host || '—'}
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 cursor-pointer event-row text-center" data-event-id="${event.id}">
                                <div class="inline-flex items-center gap-2">
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

// ...

// In attachSubHandlers (Dashboard Handlers section)
// Warning: This replace block targets renderDashboardList fully, I need to add handler code separately or ensure it's in scope.
// Splitting this into two replacements for safety. This one handles renderDashboardList.

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
            <div class="divide-y divide-gray-100">
                ${grouped.size > 0 ? Array.from(grouped.entries()).map(([date, sessions]) => renderAgendaGroup(date, sessions)).join('') :
            `<div class="p-12 text-center text-gray-500">No sessions found for this event.</div>`}
            </div>
        </div>
    `;
}

function renderAgendaGroup(dateKey, sessions) {
    const dateObj = new Date(dateKey);
    const day = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = dateObj.getDate();
    const month = dateObj.toLocaleDateString(undefined, { month: 'short' });
    const year = dateObj.getFullYear();

    // Sort sessions within the day by time ascending
    sessions.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

    return `
        <div class="group">
            <div class="flex flex-col md:flex-row md:items-start p-4 md:p-6 gap-4 border-b last:border-0 border-gray-50 hover:bg-gray-50/50 transition-colors">
                <!-- Date Column -->
                <div class="flex flex-row md:flex-col items-center md:items-center gap-3 md:gap-0 md:w-24 md:border-r md:border-gray-100 md:pr-6 shrink-0">
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider md:mb-1">${day}</div>
                    <div class="text-2xl font-bold text-gray-900 leading-none">${dayNum}</div>
                    <div class="text-xs font-medium text-gray-500 md:mt-1">${month}</div>
                </div>

                <!-- Sessions List -->
                <div class="flex-1 space-y-3 min-w-0 w-full">
                    ${sessions.map(renderAgendaSessionItem).join('')}
                </div>
            </div>
        </div>
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
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer session-row w-full" data-id="${session.id}">
            
            <!-- Time & Status Mobile Header -->
            <div class="flex items-center justify-between sm:w-auto">
                <div class="font-mono text-sm font-medium text-gray-500">${time}</div>
                <span class="sm:hidden inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${statusClass} border capitalize">
                    ${session.status}
                </span>
            </div>
            
            <!-- Model Info -->
            <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">${session.model_name || session.model_email || 'Unknown Model'}</div>
                <div class="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span>${session.duration}h</span>
                    ${session.pose_format ? `
                        <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span class="truncate max-w-[150px] sm:max-w-[200px]">${session.pose_format}</span>
                    ` : ''}
                </div>
            </div>

            <!-- Desktop Status -->
            <div class="hidden sm:block shrink-0">
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
        const clearBtn = document.getElementById('clear-filter-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                viewState.hostFilter = null;
                refreshView();
            });
        }

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
