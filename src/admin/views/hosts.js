/**
 * Hosts View
 * Host management with venue/event associations
 */

import { state } from '../app.js';

/**
 * Render the hosts list view
 */
export function renderHosts() {
    const hosts = state.data.hosts || [];

    return `
        <div class="flex flex-col">
            <!-- Search Bar -->
            <div class="px-4 py-3 sticky top-[72px] z-10 bg-background-light">
                <div class="search-container">
                    <span class="icon material-symbols-outlined">search</span>
                    <input 
                        type="text" 
                        id="search-hosts"
                        class="input-field"
                        placeholder="Search hosts..."
                    />
                </div>
            </div>
            
            <!-- Hosts List -->
            <div id="hosts-list" class="flex flex-col mt-2 px-4 gap-3 pb-4">
                ${hosts.length === 0
            ? '<div class="flex justify-center py-8"><div class="spinner"></div></div>'
            : hosts.map(host => renderHostItem(host)).join('')
        }
            </div>
        </div>
    `;
}

/**
 * Render a single host list item
 */
function renderHostItem(host) {
    const name = host.name || 'Unknown Host';
    const summary = host.summary || host.description || 'No description';
    const initials = getInitials(name);
    const avatarColor = getAvatarColor(host.id);

    // Get social link for display
    const socialUrl = host.social_urls?.[0] || '';
    const socialHandle = socialUrl ? extractHandle(socialUrl) : '';

    return `
        <div class="card p-4 cursor-pointer"
             data-host-id="${host.id}"
             data-host-name="${name}">
            
            <div class="flex items-start gap-4">
                <!-- Avatar -->
                <div class="avatar flex items-center justify-center text-white font-semibold text-sm shrink-0"
                     style="background-color: ${avatarColor};">
                    ${initials}
                </div>
                
                <!-- Host Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <h3 class="font-semibold text-gray-900 truncate">${name}</h3>
                        <button class="btn-icon shrink-0 -mr-2 -mt-1" onclick="event.stopPropagation()">
                            <span class="material-symbols-outlined text-gray-400">more_vert</span>
                        </button>
                    </div>
                    
                    <p class="text-sm text-gray-500 line-clamp-2 mt-1">${summary}</p>
                    
                    ${socialHandle ? `
                        <div class="flex items-center gap-1.5 mt-2 text-primary text-sm">
                            <span class="material-symbols-outlined text-[16px]">photo_camera</span>
                            <span>${socialHandle}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Tags -->
            ${host.host_tags?.length > 0 ? `
                <div class="flex gap-2 mt-3 flex-wrap">
                    ${host.host_tags.slice(0, 3).map(tag => `
                        <span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">${tag}</span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Extract social handle from URL
 */
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
    const colors = ['#0ea5e9', '#14b8a6', '#22c55e', '#84cc16', '#eab308',
        '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1'];
    return colors[(id || 0) % colors.length];
}
