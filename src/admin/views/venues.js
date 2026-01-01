
import * as API from '../client.js';
import { renderVenueDetail, attachVenueDetailHandlers } from './venue-detail.js';
import { showModal } from '../components/modal.js';

let venuesData = [];
let sortOrder = 'asc';

export function renderVenues() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Venues</h2>
                    <p class="text-sm text-gray-500">Manage venue locations</p>
                </div>
                <button id="add-venue-btn" class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95">
                    <span class="material-symbols-outlined">add</span>
                    <span>Add Venue</span>
                </button>
            </div>

            <!-- Filters & Search -->
            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div class="flex-1 relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input type="text" id="search-venues" 
                        placeholder="Search venues by name or city..." 
                        class="w-full pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                </div>
                
                <div class="flex items-center gap-2">
                     <button id="sort-venues-btn" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <span class="material-symbols-outlined text-[18px]" id="sort-venues-icon">sort_by_alpha</span>
                        <span id="sort-venues-label">A-Z</span>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div id="venues-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <!-- Loading State -->
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

function renderVenueCard(venue) {
    const initials = (venue.name || 'V').slice(0, 2).toUpperCase();

    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100"
             data-venue-id="${venue.id}"
             data-venue-name="${venue.name}"
             data-venue-city="${venue.address_city}">
            
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg shadow-inner">
                        ${initials}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">${venue.name}</h3>
                        <p class="text-xs text-gray-500">${venue.address_city || 'No City'}</p>
                    </div>
                </div>
                 <div class="flex flex-col items-end">
                    <span class="text-xs font-semibold text-gray-500">${venue.event_count || 0} Events</span>
                </div>
            </div>

            <div class="space-y-2 mb-4">
                 <div class="flex items-start gap-2 text-sm text-gray-600 min-h-[40px]">
                    <span class="material-symbols-outlined text-gray-400 text-lg mt-0.5">location_on</span>
                    <span class="line-clamp-2">${venue.address_line_1}, ${venue.address_postcode}</span>
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${venue.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
                    <span class="w-1.5 h-1.5 rounded-full ${venue.active ? 'bg-green-500' : 'bg-red-500'}"></span>
                    ${venue.active ? 'Active' : 'Inactive'}
                </span>
                 <span class="text-xs text-gray-400">ID: ${venue.id}</span>
            </div>
        </div>
    `;
}

export function attachVenuesHandlers() {
    loadVenues();

    // Add Venue
    const addBtn = document.getElementById('add-venue-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showModal(renderVenueDetail({}), 'venue-detail');
            attachVenueDetailHandlers({});
        });
    }

    // Search
    const searchInput = document.getElementById('search-venues');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('[data-venue-id]');

            cards.forEach(card => {
                const name = (card.dataset.venueName || '').toLowerCase();
                const city = (card.dataset.venueCity || '').toLowerCase();
                if (name.includes(term) || city.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Sort
    const sortBtn = document.getElementById('sort-venues-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            const icon = document.getElementById('sort-venues-icon');
            const label = document.getElementById('sort-venues-label');
            icon.style.transform = sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
            label.textContent = sortOrder === 'asc' ? 'A-Z' : 'Z-A';
            sortVenues();
            updateVenuesGrid();
        });
    }
}

async function loadVenues() {
    try {
        venuesData = await API.getVenues();
        sortVenues();
        updateVenuesGrid();
    } catch (error) {
        document.getElementById('venues-grid').innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                Failed to load venues: ${error.message}
            </div>
        `;
    }
}

function sortVenues() {
    venuesData.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
}

function updateVenuesGrid() {
    const grid = document.getElementById('venues-grid');
    if (!grid) return;

    if (venuesData.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-12">No venues found.</div>`;
        return;
    }

    grid.innerHTML = venuesData.map(renderVenueCard).join('');

    grid.querySelectorAll('[data-venue-id]').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.venueId;
            const venue = venuesData.find(v => String(v.id) === id);
            if (venue) {
                showModal(renderVenueDetail(venue), 'venue-detail');
                attachVenueDetailHandlers(venue);
            }
        });
    });

    const searchInput = document.getElementById('search-venues');
    if (searchInput && searchInput.value) searchInput.dispatchEvent(new Event('input'));
}

window.loadVenues = loadVenues;
