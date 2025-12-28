/**
 * Models View
 * Model management matching model_profile_management mockups
 */

import { state } from '../app.js';

/**
 * Render the models list view
 */
export function renderModels() {
    const models = state.data.models || [];

    return `
        <div class="flex flex-col">
            <!-- Search Bar -->
            <div class="px-4 py-3 sticky top-[72px] z-10 bg-background-light">
                <div class="search-container">
                    <span class="icon material-symbols-outlined">search</span>
                    <input 
                        type="text" 
                        id="search-models"
                        class="input-field"
                        placeholder="Search models..."
                    />
                </div>
            </div>
            
            <!-- Filter Chips -->
            <div class="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar">
                <button class="chip chip-active" data-filter="all">All</button>
                <button class="chip chip-default" data-filter="inperson">In-Person</button>
                <button class="chip chip-default" data-filter="online">Online</button>
                <button class="chip chip-default" data-filter="photo">Photography</button>
            </div>
            
            <!-- Models List -->
            <div id="models-list" class="flex flex-col mt-2 px-4 gap-3 pb-4">
                ${models.length === 0
            ? '<div class="flex justify-center py-8"><div class="spinner"></div></div>'
            : models.map(model => renderModelItem(model)).join('')
        }
            </div>
        </div>
    `;
}

/**
 * Render a single model list item
 */
function renderModelItem(model) {
    const name = model.display_name || 'Unknown Model';
    const initials = getInitials(name);
    const avatarColor = getAvatarColor(model.id);

    // Work preferences
    const workTypes = [];
    if (model.work_inperson) workTypes.push('In-Person');
    if (model.work_online) workTypes.push('Online');
    if (model.work_photography) workTypes.push('Photography');

    // Rate display
    const rate = model.rate_min_hour
        ? `${model.currency_code || 'GBP'} ${parseFloat(model.rate_min_hour).toFixed(0)}/hr`
        : '';

    // Gender icon/indicator
    const genderIcon = model.sex === 1 ? 'male' : model.sex === 2 ? 'female' : 'person';

    // Social link
    const socialUrl = model.social_urls?.[0] || '';
    const socialHandle = socialUrl ? extractHandle(socialUrl) : '';

    return `
        <div class="card p-4 cursor-pointer"
             data-model-id="${model.id}"
             data-model-name="${name}">
            
            <div class="flex items-start gap-4">
                <!-- Avatar -->
                <div class="relative shrink-0">
                    <div class="avatar flex items-center justify-center text-white font-semibold text-sm"
                         style="background-color: ${avatarColor};">
                        ${initials}
                    </div>
                    <span class="status-dot active"></span>
                </div>
                
                <!-- Model Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold text-gray-900">${name}</h3>
                            <span class="material-symbols-outlined text-gray-400 text-[18px]">${genderIcon}</span>
                        </div>
                        <button class="btn-icon shrink-0 -mr-2 -mt-1" onclick="event.stopPropagation()">
                            <span class="material-symbols-outlined text-gray-400">more_vert</span>
                        </button>
                    </div>
                    
                    <!-- Rate -->
                    ${rate ? `
                        <p class="text-sm text-gray-600 font-medium mt-1">${rate}</p>
                    ` : ''}
                    
                    <!-- Work Types -->
                    <div class="flex gap-2 mt-2 flex-wrap">
                        ${workTypes.map(type => `
                            <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md font-medium">${type}</span>
                        `).join('')}
                    </div>
                    
                    <!-- Work Seeks -->
                    ${model.work_seeks?.length > 0 ? `
                        <div class="flex gap-2 mt-2 flex-wrap">
                            ${model.work_seeks.slice(0, 4).map(seek => `
                                <span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">${seek}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Social -->
                    ${socialHandle ? `
                        <div class="flex items-center gap-1.5 mt-2 text-primary text-sm">
                            <span class="material-symbols-outlined text-[16px]">photo_camera</span>
                            <span>${socialHandle}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function extractHandle(url) {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.replace(/\/$/, '');
        const handle = path.split('/').pop();
        return handle ? `@${handle}` : '';
    } catch {
        return '';
    }
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(id) {
    const colors = ['#ec4899', '#a855f7', '#6366f1', '#0ea5e9', '#14b8a6',
        '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];
    return colors[(id || 0) % colors.length];
}
