
import * as API from '../client.js';
import { renderModelDetail, attachModelDetailHandlers } from './model-detail.js';

let modelsData = [];
let sortOrder = 'asc'; // 'asc' or 'desc'

export function renderModels() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Models</h2>
                    <p class="text-sm text-gray-500">Manage model profiles</p>
                </div>
                <!-- Action Buttons could go here -->
            </div>

            <!-- Filters & Search -->
            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div class="flex-1 relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input type="text" id="search-models" 
                        placeholder="Search models by name or handle..." 
                        class="w-full pl-10 pr-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                </div>
                
                <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button class="filter-chip active px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-all bg-primary/10 border-primary/20 text-primary" data-status="all">
                        All Models
                    </button>
                    <!-- Add more filters if needed -->
                    <div class="w-px h-6 bg-gray-200 mx-2"></div>
                    <button id="sort-models-btn" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <span class="material-symbols-outlined text-[18px] transition-transform duration-300" id="sort-models-icon">sort_by_alpha</span>
                        <span id="sort-models-label">A-Z</span>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div id="models-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <!-- Loading State -->
                ${Array(8).fill(0).map(() => `
                    <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 rounded-full bg-gray-100"></div>
                            <div class="flex-1">
                                <div class="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                                <div class="h-3 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div class="h-20 bg-gray-100 rounded-xl mb-4"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderModelCard(model) {
    const displayName = model.display_name || model.fullname || 'Unknown Model';
    const initials = displayName.slice(0, 2).toUpperCase();
    const handle = model.handle ? `@${model.handle}` : '';

    // Determine status (active/inactive logic might need adjustment based on specific requirements)
    // Assuming implicit active if present based on API logic
    const isActive = true;

    return `
        <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100"
             data-model-id="${model.id}"
             data-model-name="${displayName}"
             data-model-handle="${model.handle || ''}">
            
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg shadow-inner">
                        ${initials}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">${displayName}</h3>
                         <div class="flex items-center gap-1.5 text-xs text-gray-500">
                             <span>${model.flag_emoji || '🏳️'}</span>
                             <span>${handle}</span>
                         </div>
                    </div>
                </div>
                ${model.sex ? `<span class="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600 capitalize">${model.sex}</span>` : ''}
            </div>

            <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">Hourly Rate</span>
                    <span class="font-medium text-gray-900">${model.currency_code} ${model.rate_min_hour}</span>
                </div>
                 <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">Day Rate</span>
                    <span class="font-medium text-gray-900">${model.currency_code} ${model.rate_min_day}</span>
                </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}">
                    <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}"></span>
                    ${isActive ? 'Active' : 'Inactive'}
                </span>
                
                <span class="text-xs text-gray-400">ID: ${model.id}</span>
            </div>
        </div>
    `;
}

export function attachModelsHandlers() {
    loadModels();

    const searchInput = document.getElementById('search-models');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('[data-model-id]');

            cards.forEach(card => {
                const name = (card.dataset.modelName || '').toLowerCase();
                const handle = (card.dataset.modelHandle || '').toLowerCase();

                if (name.includes(term) || handle.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Sort Handler
    const sortBtn = document.getElementById('sort-models-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';

            // Update UI
            const icon = document.getElementById('sort-models-icon');
            const label = document.getElementById('sort-models-label');

            icon.style.transform = sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
            label.textContent = sortOrder === 'asc' ? 'A-Z' : 'Z-A';

            sortModels();
            updateModelsGrid();
        });
    }
}

async function loadModels() {
    try {
        const models = await API.getModels();
        modelsData = models; // Store for sorting
        sortModels(); // Initial sort
        updateModelsGrid();
    } catch (error) {
        document.getElementById('models-grid').innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-red-500 mb-2">Failed to load models</p>
                <button onclick="loadModels()" class="text-primary hover:underline">Try Again</button>
            </div>
        `;
    }
}

function sortModels() {
    modelsData.sort((a, b) => {
        const nameA = (a.display_name || a.fullname || '').toLowerCase();
        const nameB = (b.display_name || b.fullname || '').toLowerCase();

        if (sortOrder === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });
}

function updateModelsGrid() {
    const grid = document.getElementById('models-grid');
    if (!grid) return;

    if (modelsData.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-gray-400 text-3xl">person_off</span>
                </div>
                <h3 class="text-lg font-medium text-gray-900">No models found</h3>
                <p class="text-gray-500 max-w-sm mt-2">There are no model profiles created yet.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = modelsData.map(renderModelCard).join('');

    // Attach click handlers
    grid.querySelectorAll('[data-model-id]').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.modelId;
            const model = modelsData.find(m => String(m.id) === id);
            if (model) {
                showModal(renderModelDetail(model), 'model-detail');
                attachModelDetailHandlers(model);
            }
        });
    });

    // Re-apply search filter if any
    const searchInput = document.getElementById('search-models');
    if (searchInput && searchInput.value) {
        searchInput.dispatchEvent(new Event('input'));
    }
}

// Make global for refresh
window.loadModels = loadModels;
