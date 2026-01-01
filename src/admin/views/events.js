
import * as API from '../client.js';
import { renderEventDetail, attachEventDetailHandlers } from './event-detail.js';
import { showModal } from '../components/modal.js';

let eventsData = [];
let sortOrder = 'asc';

export function renderEvents() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Events</h2>
                    <p class="text-sm text-gray-500">Manage recurring events</p>
                </div>
                <button id="add-event-btn" class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95">
                    <span class="material-symbols-outlined">add</span>
                    <span>Add Event</span>
                </button>
            </div>

            <!-- Filters -->
            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                 <div class="flex-1 relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input type="text" id="search-events" 
                        placeholder="Search events..." 
                        class="w-full pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                </div>

                <select id="filter-weekday" class="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="">All Days</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                </select>
            </div>

            <!-- Grid -->
            <div id="events-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 ${Array(8).fill(0).map(() => `
                    <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
                         <div class="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
                         <div class="h-10 bg-gray-100 rounded mb-4"></div>
                         <div class="h-3 bg-gray-100 rounded w-1/4"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderEventCard(event) {
    const initials = (event.name || 'E').slice(0, 2).toUpperCase();

    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100"
             data-event-id="${event.id}"
             data-event-name="${event.name}"
             data-event-day="${event.week_day}">
            
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-amber-600 font-bold text-lg shadow-inner">
                        ${initials}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">${event.name}</h3>
                        <p class="text-xs text-gray-500 capitalize">${event.week_day} · ${event.frequency}</p>
                    </div>
                </div>
            </div>

            <p class="text-sm text-gray-600 line-clamp-2 h-10 mb-4">${event.description || 'No description'}</p>

            <div class="space-y-2 mb-4 text-xs text-gray-500">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">location_on</span>
                    <span class="truncate">${event.venue ? event.venue.name : 'No Venue'}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">person</span>
                    <span class="truncate">${event.host ? event.host.name : 'No Host'}</span>
                </div>
            </div>

             <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
                 <span class="text-xs text-gray-400">ID: ${event.id}</span>
            </div>
        </div>
    `;
}

// In src/admin/views/events.js

export function attachEventsHandlers() {
    loadEvents();
    // Pre-load data for the modal
    loadOptions();

    const addBtn = document.getElementById('add-event-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showModal(renderEventDetail({}, optionsData), 'event-detail');
            attachEventDetailHandlers({}, optionsData);
        });
    }

    // ... existing search logic ...
    const searchInput = document.getElementById('search-events');
    const dayFilter = document.getElementById('filter-weekday');

    const filter = () => {
        const term = searchInput ? searchInput.value.toLowerCase() : '';
        const day = dayFilter ? dayFilter.value.toLowerCase() : '';

        document.querySelectorAll('[data-event-id]').forEach(card => {
            const name = (card.dataset.eventName || '').toLowerCase();
            const cardDay = (card.dataset.eventDay || '').toLowerCase();

            const matchesName = name.includes(term);
            const matchesDay = !day || cardDay === day;

            card.style.display = matchesName && matchesDay ? 'block' : 'none';
        });
    };

    if (searchInput) searchInput.addEventListener('input', filter);
    if (dayFilter) dayFilter.addEventListener('change', filter);
}

let optionsData = { venues: [], hosts: [] };


async function loadEvents() {
    try {
        eventsData = await API.getEvents();
        updateEventsGrid();
        // Make it available globally for refresh
        window.loadEvents = loadEvents;
    } catch (error) {
        document.getElementById('events-grid').innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                Failed to load events: ${error.message}
            </div>
        `;
    }
}

async function loadOptions() {
    try {
        const [venues, hosts] = await Promise.all([
            API.getVenues(),
            API.getHosts()
        ]);
        optionsData = { venues, hosts };
    } catch (e) {
        console.error("Failed to load dropdown options", e);
    }
}

function updateEventsGrid() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    if (eventsData.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-12">No events found.</div>`;
        return;
    }

    grid.innerHTML = eventsData.map(renderEventCard).join('');

    grid.querySelectorAll('[data-event-id]').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.eventId;
            const event = eventsData.find(e => String(e.id) === id);
            if (event) {
                showModal(renderEventDetail(event, optionsData), 'event-detail');
                attachEventDetailHandlers(event, optionsData);
            }
        });
    });
}
