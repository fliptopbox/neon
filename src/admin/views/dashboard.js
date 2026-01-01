/**
 * Dashboard View
 */

export function renderDashboard() {
    return `
        <div class="space-y-6">
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${renderStatCard('Users', 'group', 'Coming Soon', 'text-blue-600', 'bg-blue-50')}
                ${renderStatCard('Hosts', 'storefront', 'Coming Soon', 'text-purple-600', 'bg-purple-50')}
                ${renderStatCard('Events', 'event', 'Coming Soon', 'text-pink-600', 'bg-pink-50')}
                ${renderStatCard('Venues', 'location_on', 'Coming Soon', 'text-yellow-600', 'bg-yellow-50')}
            </div>

            <div class="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div class="max-w-md mx-auto">
                    <span class="material-symbols-outlined text-4xl text-gray-300 mb-4">construction</span>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Under Construction</h3>
                    <p class="text-gray-500">The Admin UI is being rebuilt from the ground up.</p>
                </div>
            </div>
        </div>
    `;
}

function renderStatCard(title, icon, value, colorClass, bgClass) {
    return `
        <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center">
                    <span class="material-symbols-outlined ${colorClass}">${icon}</span>
                </div>
                <div>
                    <h3 class="text-sm font-medium text-gray-500">${title}</h3>
                    <p class="text-2xl font-bold text-gray-900">${value}</p>
                </div>
            </div>
        </div>
    `;
}

export function attachDashboardHandlers() {
    // No handlers yet
}
