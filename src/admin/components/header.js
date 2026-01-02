/**
 * Sticky Header Component
 */

/**
 * Render the sticky header
 * @param {string} title - Page title
 * @param {object} options - Optional settings
 */
export function renderHeader(title, options = {}) {
    const { showBack = false, actionButton = null, showLogout = true } = options;

    return `
        <header class="sticky top-0 z-20 flex flex-col gap-2 bg-background-light/95 backdrop-blur-md p-4 pb-2 border-b border-gray-200">
            <div class="flex items-center justify-between h-12">
                ${showBack ? `
                    <button onclick="history.back()" class="btn-icon">
                        <span class="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                ` : `
                    <div class="w-12"></div>
                `}
                
                <h1 class="text-xl font-bold tracking-tight text-gray-900 flex-1 text-center">
                    ${title}
                </h1>
                
                <div class="flex items-center gap-1 w-12 justify-end">
                    ${actionButton ? actionButton : ''}

                </div>
            </div>
        </header>
    `;
}

/**
 * Render a simple header with back button (for detail views)
 */
export function renderDetailHeader(title, rightAction = '') {
    return `
        <header class="flex items-center bg-white p-4 sticky top-0 z-20 border-b border-gray-100">
            <button onclick="closeModal()" class="btn-icon">
                <span class="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h2 class="text-lg font-bold leading-tight tracking-tight flex-1 text-center">
                ${title}
            </h2>
            <div class="w-12 flex justify-end">
                ${rightAction}
            </div>
        </header>
    `;
}
