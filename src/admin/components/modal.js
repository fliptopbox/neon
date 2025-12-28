/**
 * Modal / Bottom Sheet Component
 */

let currentModalId = null;

/**
 * Show a modal (bottom sheet on mobile)
 * @param {string} content - HTML content
 * @param {string} id - Unique modal ID
 */
export function showModal(content, id = 'modal') {
    currentModalId = id;

    // Remove existing modal
    const existing = document.getElementById('modal-container');
    if (existing) {
        existing.remove();
    }

    // Create modal structure
    const container = document.createElement('div');
    container.id = 'modal-container';
    container.innerHTML = `
        <div class="modal-backdrop" onclick="closeModal()"></div>
        <div class="modal-content" id="${id}">
            <div class="modal-handle"></div>
            ${content}
        </div>
    `;

    document.body.appendChild(container);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(() => {
        container.querySelector('.modal-backdrop').classList.add('active');
        container.querySelector('.modal-content').classList.add('active');
    });
}

/**
 * Close the current modal
 */
export function closeModal() {
    const container = document.getElementById('modal-container');
    if (!container) return;

    const backdrop = container.querySelector('.modal-backdrop');
    const content = container.querySelector('.modal-content');

    backdrop.classList.remove('active');
    content.classList.remove('active');

    // Re-enable body scroll
    document.body.style.overflow = '';

    // Remove after animation
    setTimeout(() => {
        container.remove();
        currentModalId = null;
    }, 300);
}

/**
 * Update modal content
 */
export function updateModalContent(html) {
    const content = document.querySelector('.modal-content');
    if (content) {
        content.innerHTML = `<div class="modal-handle"></div>${html}`;
    }
}
