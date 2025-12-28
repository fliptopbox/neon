/**
 * Bottom Navigation Component
 * Mobile-first tab navigation
 */

const navItems = [
    { id: 'users', icon: 'group', label: 'Users' },
    { id: 'hosts', icon: 'storefront', label: 'Hosts' },
    { id: 'models', icon: 'accessibility_new', label: 'Models' },
    { id: 'calendar', icon: 'calendar_month', label: 'Calendar' },
];

/**
 * Render the bottom navigation
 * @param {string} activeView - Currently active view
 */
export function renderNav(activeView) {
    return `
        <nav class="bottom-nav fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-gray-200/60">
            <div class="max-w-md mx-auto">
                <div class="flex justify-around items-center h-16 pb-safe">
                    ${navItems.map(item => renderNavItem(item, activeView)).join('')}
                </div>
            </div>
        </nav>
    `;
}

function renderNavItem(item, activeView) {
    const isActive = activeView === item.id;

    return `
        <a href="#${item.id}" 
           class="flex flex-col items-center justify-center w-16 h-full gap-1 group transition-all ${isActive ? '' : 'opacity-60'}">
            <div class="px-4 py-1.5 rounded-full transition-colors ${isActive ? 'bg-primary/10' : ''}">
                <span class="material-symbols-outlined text-[24px] ${isActive ? 'text-primary filled' : 'text-gray-700'}"
                      ${isActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>
                    ${item.icon}
                </span>
            </div>
            <span class="text-[10px] font-medium ${isActive ? 'text-primary' : 'text-gray-700'}">
                ${item.label}
            </span>
        </a>
    `;
}
