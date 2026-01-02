
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
                        All
                    </button>
                    <button class="filter-chip px-3 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-all bg-white border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" data-status="new" title="Unbooked Models">
                        <span class="material-symbols-outlined text-[20px]">event_busy</span>
                        <span id="unbooked-count" class="font-medium"></span>
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
    const handle = model.handle ? `@${model.handle}` : '';
    const bookingCount = parseInt(model.calendar_count || 0);

    // Image Logic
    let imageUrl = '';
    let portraits = [];
    try {
        portraits = typeof model.portrait_urls === 'string' ? JSON.parse(model.portrait_urls) : model.portrait_urls;
    } catch (e) { portraits = []; }

    if (Array.isArray(portraits) && portraits.length > 0) {
        let portraitPath = portraits[0];
        // Legacy images with no folders need 1024/ prefix
        if (!portraitPath.includes('/')) {
            portraitPath = `1024/${portraitPath}`;
        }
        imageUrl = `https://ik.imagekit.io/fliptopbox/lifedrawing/model/${portraitPath}?tr=w-250,h-250,fo-face`;
    }

    const hasImage = !!imageUrl;

    // Social Handles & Contact
    let socials = {};
    try {
        socials = typeof model.social_handles === 'string' ? JSON.parse(model.social_handles) : (model.social_handles || {});
    } catch (e) { }

    const instagram = socials.instagram || '';
    const email = model.email || '';
    const phone = model.phone_number || '';

    return `
        <div class="bg-white p-3 pb-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 transform border border-gray-100"
             style="max-width: 280px; margin: 0 auto;"
             data-model-id="${model.id}"
             data-model-name="${displayName}"
             data-model-booking-count="${bookingCount}"
             data-model-handle="${model.handle || ''}">
            
            <!-- Image Area (Polaroid Window) -->
            <div class="aspect-square w-full bg-gray-50 mb-4 overflow-hidden relative border border-gray-100">
                ${hasImage
            ? `<img src="${imageUrl}" alt="${displayName}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                         <span class="material-symbols-outlined text-5xl">person</span>
                       </div>`
        }
                
                ${model.flag_emoji ? `
                    <div class="absolute top-2 right-2 text-xl drop-shadow-md filter hover:scale-110 transition-transform cursor-help" title="Location/Origin">
                        ${model.flag_emoji}
                    </div>
                ` : ''}

                <div class="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-100 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px] text-gray-500">calendar_month</span>
                    <span class="text-xs font-bold text-gray-700">${model.calendar_count || 0}</span>
                </div>
            </div>

            <!-- Content -->
            <div class="px-1 text-center">
                <h3 class="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary transition-colors">${displayName}</h3>
                ${handle ? `<p class="text-xs text-gray-400 mb-4 font-medium">${handle}</p>` : ''}

                <!-- Icons Row -->
                <!-- Icons Row -->
                <div class="flex items-center justify-center gap-5 pt-2 border-t border-gray-50 mt-auto">
                    ${email ? `
                        <a href="mailto:${email}" onclick="event.stopPropagation()" class="text-gray-400 hover:text-gray-900 transition-colors bg-white p-1 rounded-full hover:bg-gray-50" title="${email}">
                            <span class="material-symbols-outlined text-[20px]">mail</span>
                        </a>
                    ` : '<span class="text-gray-200 cursor-not-allowed"><span class="material-symbols-outlined text-[20px]">mail</span></span>'}
                    
                    ${phone ? `
                        <a href="tel:${phone}" onclick="event.stopPropagation()" class="text-gray-400 hover:text-gray-900 transition-colors bg-white p-1 rounded-full hover:bg-gray-50" title="${phone}">
                            <span class="material-symbols-outlined text-[20px]">call</span>
                        </a>
                    ` : '<span class="text-gray-200 cursor-not-allowed"><span class="material-symbols-outlined text-[20px]">call</span></span>'}

                    ${instagram ? `
                        <a href="https://instagram.com/${instagram.replace('@', '')}" target="_blank" onclick="event.stopPropagation()" class="text-gray-400 hover:text-pink-600 transition-colors bg-white p-1 rounded-full hover:bg-gray-50" title="@${instagram}">
                             <span class="material-symbols-outlined text-[20px]">photo_camera</span>
                        </a>
                    ` : '<span class="text-gray-200 cursor-not-allowed"><span class="material-symbols-outlined text-[20px]">photo_camera</span></span>'}
                </div>
            </div>
        </div>
    `;
}

// Global state update
let currentFilter = 'all';

export function attachModelsHandlers() {
    loadModels();

    // Filter Handlers
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            filterChips.forEach(c => {
                c.classList.remove('active', 'bg-primary/10', 'border-primary/20', 'text-primary');
                c.classList.add('bg-white', 'border-gray-200', 'text-gray-600');
            });
            chip.classList.add('active', 'bg-primary/10', 'border-primary/20', 'text-primary');
            chip.classList.remove('bg-white', 'border-gray-200', 'text-gray-600');

            currentFilter = chip.dataset.status;
            updateModelsGrid();
        });
    });

    const searchInput = document.getElementById('search-models');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateModelsGrid();
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

        // Calculate Unbooked Count
        const unbookedCount = models.filter(m => parseInt(m.calendar_count || 0) === 0).length;
        const countSpan = document.getElementById('unbooked-count');
        if (countSpan) {
            countSpan.textContent = unbookedCount;
        }

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

    // Apply Filter & Search
    const searchInput = document.getElementById('search-models');
    const term = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredModels = modelsData.filter(model => {
        // 1. Text Search
        const name = (model.display_name || model.fullname || '').toLowerCase();
        const handle = (model.handle || '').toLowerCase();
        const matchesSearch = name.includes(term) || handle.includes(term);

        // 2. Status Filter
        let matchesFilter = true;
        if (currentFilter === 'new') {
            // Check if booking count is 0
            const count = parseInt(model.calendar_count || 0);
            matchesFilter = count === 0;
        }

        return matchesSearch && matchesFilter;
    });

    if (filteredModels.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-gray-400 text-3xl">person_off</span>
                </div>
                <h3 class="text-lg font-medium text-gray-900">No models found</h3>
                <p class="text-gray-500 max-w-sm mt-2">Try adjusting your search or filters.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredModels.map(renderModelCard).join('');

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
}

// Make global for refresh
window.loadModels = loadModels;
