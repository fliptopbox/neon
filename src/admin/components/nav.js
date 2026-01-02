/**
 * Bottom Navigation Component
 * Mobile-first tab navigation with "More" drawer
 */

const mainNavItems = [
    { id: 'events', icon: 'event', label: 'Events' },
    { id: 'calendar', icon: 'calendar_month', label: 'Calendar' },
    { id: 'venues', icon: 'location_on', label: 'Venues' },
    { id: 'more', icon: 'menu', label: 'More', action: 'toggleMobileMenu()' },
];

const moreMenuItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'users', icon: 'group', label: 'Users' },
    { id: 'hosts', icon: 'storefront', label: 'Hosts' },
    { id: 'models', icon: 'person_search', label: 'Models' },
    { id: 'exchange-rates', icon: 'currency_exchange', label: 'Rates' },
];

/**
 * Render the bottom navigation and the more menu drawer
 * @param {string} activeView - Currently active view
 */
export function renderNav(activeView) {
    return `
        <!-- Mobile Menu Drawer (initially hidden) -->
        <div id="mobile-menu-overlay" 
             class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 opacity-0 pointer-events-none"
             onclick="toggleMobileMenu()">
        </div>
        
        <div id="mobile-menu-drawer" 
             class="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transform transition-transform duration-300 translate-y-full pb-20">
            
            <div class="p-4">
                <div class="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
                
                <div class="grid grid-cols-4 gap-y-6">
                    ${moreMenuItems.map(item => `
                        <a href="#${item.id}" onclick="toggleMobileMenu()" class="flex flex-col items-center gap-2 group">
                            <div class="w-12 h-12 rounded-2xl ${activeView === item.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'} flex items-center justify-center transition-colors group-active:scale-95">
                                <span class="material-symbols-outlined">${item.icon}</span>
                            </div>
                            <span class="text-xs font-medium text-gray-600">${item.label}</span>
                        </a>
                    `).join('')}
                    
                    <button onclick="handleLogout()" class="flex flex-col items-center gap-2 group">
                        <div class="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center transition-colors group-active:scale-95">
                            <span class="material-symbols-outlined">logout</span>
                        </div>
                        <span class="text-xs font-medium text-gray-600">Sign Out</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Bottom Navigation Bar -->
        <nav class="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 safe-area-bottom">
            <div class="max-w-md mx-auto">
                <div class="flex justify-around items-center h-16 pb-safe">
                    ${mainNavItems.map(item => renderNavItem(item, activeView)).join('')}
                </div>
            </div>
        </nav>
    `;
}

function renderNavItem(item, activeView) {
    const isActive = activeView === item.id;
    const isMore = item.id === 'more';

    // For 'more', we look if the active view is NOT in the main items (meaning it's in the menu)
    const isMoreActive = isMore && !mainNavItems.some(i => i.id === activeView);

    const effectiveActive = isActive || isMoreActive;

    const href = item.action ? 'javascript:void(0)' : `#${item.id}`;
    const onclick = item.action ? `onclick="${item.action}"` : '';

    return `
        <a href="${href}" ${onclick}
           class="flex flex-col items-center justify-center w-16 h-full gap-1 group transition-all ${effectiveActive ? '' : 'opacity-60'}">
            <div class="px-4 py-1.5 rounded-full transition-colors ${effectiveActive ? 'bg-primary/10' : ''}">
                <span class="material-symbols-outlined text-[24px] ${effectiveActive ? 'text-primary filled' : 'text-gray-700'}"
                      ${effectiveActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>
                    ${item.icon}
                </span>
            </div>
            <span class="text-[10px] font-medium ${effectiveActive ? 'text-primary' : 'text-gray-700'}">
                ${item.label}
            </span>
        </a>
    `;
}

// Global Toggle Function
window.toggleMobileMenu = function () {
    const overlay = document.getElementById('mobile-menu-overlay');
    const drawer = document.getElementById('mobile-menu-drawer');

    if (!overlay || !drawer) return;

    const isHidden = drawer.classList.contains('translate-y-full');

    if (isHidden) {
        // Open
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        drawer.classList.remove('translate-y-full');
    } else {
        // Close
        overlay.classList.add('opacity-0', 'pointer-events-none');
        drawer.classList.add('translate-y-full');
    }
};
