
import * as API from '../client.js';
import { renderHostDetail, attachHostDetailHandlers } from './host-detail.js';
import { showModal } from '../components/modal.js';

let hostsData = [];
let sortOrder = 'asc';

export function renderHosts() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Hosts</h2>
                    <p class="text-sm text-gray-500">Manage host profiles</p>
                </div>
                <button id="add-host-btn" class="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow">
                    <span class="material-symbols-outlined">add</span>
                    Add Host
                </button>
            </div>

            <!-- Filters -->
            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div class="flex-1 relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input type="text" id="search-hosts" 
                        placeholder="Search hosts..." 
                        class="w-full pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                </div>
                
                <div class="flex items-center gap-2">
                    <button id="sort-hosts-btn" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <span class="material-symbols-outlined text-[18px]" id="sort-hosts-icon">sort_by_alpha</span>
                        <span id="sort-hosts-label">A-Z</span>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div id="hosts-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <!-- Loading State -->
                ${Array(8).fill(0).map(() => `
                    <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
                        <div class="h-4 bg-gray-100 rounded w-3/4 mb-4"></div>
                        <div class="h-20 bg-gray-100 rounded mb-4"></div>
                        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderHostCard(host) {
    const initials = (host.name || 'U').slice(0, 2).toUpperCase();

    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100"
             data-host-id="${host.id}"
             data-host-name="${host.name}">
            
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-inner">
                        ${initials}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">${host.name}</h3>
                        <p class="text-xs text-gray-500 line-clamp-1">${host.organizer_name || 'Organizer'}</p>
                    </div>
                </div>
            </div>

            <p class="text-sm text-gray-600 line-clamp-2 mb-4 h-10">${host.description || 'No description provided.'}</p>

            <div class="space-y-2 text-sm text-gray-600">
                <div class="flex justify-between">
                    <span>Max Hourly:</span>
                    <span class="font-medium">${host.currency_code || 'GBP'} ${host.rate_max_hour}</span>
                </div>
                <div class="flex justify-between">
                    <span>Max Daily:</span>
                    <span class="font-medium">${host.currency_code || 'GBP'} ${host.rate_max_day}</span>
                </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span class="text-xs text-gray-400">ID: ${host.id}</span>
            </div>
        </div>
    `;
}

export function attachHostsHandlers() {
    loadHosts();

    const addBtn = document.getElementById('add-host-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showModal(renderHostDetail({}), 'host-detail');
            attachHostDetailHandlers({});
        });
    }

    const searchInput = document.getElementById('search-hosts');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('[data-host-id]');

            cards.forEach(card => {
                const name = (card.dataset.hostName || '').toLowerCase();
                if (name.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    const sortBtn = document.getElementById('sort-hosts-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            const icon = document.getElementById('sort-hosts-icon');
            const label = document.getElementById('sort-hosts-label');
            icon.style.transform = sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
            label.textContent = sortOrder === 'asc' ? 'A-Z' : 'Z-A';
            sortHosts();
            updateHostsGrid();
        });
    }
}

async function loadHosts() {
    try {
        hostsData = await API.getHosts();
        sortHosts();
        updateHostsGrid();
    } catch (error) {
        document.getElementById('hosts-grid').innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                Failed to load hosts: ${error.message}
            </div>
        `;
    }
}

function sortHosts() {
    hostsData.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
}

function updateHostsGrid() {
    const grid = document.getElementById('hosts-grid');
    if (!grid) return;

    if (hostsData.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-12">No hosts found.</div>`;
        return;
    }

    grid.innerHTML = hostsData.map(renderHostCard).join('');

    grid.querySelectorAll('[data-host-id]').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.hostId;
            const host = hostsData.find(h => String(h.id) === id);
            if (host) {
                showModal(renderHostDetail(host), 'host-detail');
                attachHostDetailHandlers(host);
            }
        });
    });

    // Re-apply search
    const searchInput = document.getElementById('search-hosts');
    if (searchInput && searchInput.value) searchInput.dispatchEvent(new Event('input'));
}

window.loadHosts = loadHosts;
