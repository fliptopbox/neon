
// Model List Component
let listState = {
    sort: 'az', // 'az', 'za', 'date'
    search: '', // The active filter term
    inputValue: '', // The content of the input box
    topModelId: null // The ID of the first matching model
};

// Make handlers available globally
window.modelListHandlers = {
    setSort: (sort) => {
        listState.sort = sort;
        if (window.render) window.render();
    },
    setSearch: (e) => {
        const input = e.target;
        const val = input.value;
        listState.inputValue = val;

        const term = val.trim().toLowerCase();

        // Only apply filter if 2 or more chars, or if it was cleared (is empty)
        // If we go from "abc" -> "ab", it matches.
        // If we go from "ab" -> "a", term is "a", which is < 2. So search becomes "".
        const newSearch = term.length >= 2 ? term : '';

        // Only re-render if the effective search term has changed
        if (newSearch !== listState.search) {
            listState.search = newSearch;

            // Capture cursor position
            const cursorPos = input.selectionStart;

            if (window.render) window.render();

            // Restore focus and cursor
            const newInput = document.getElementById('model-search-input');
            if (newInput) {
                newInput.focus();
                newInput.setSelectionRange(cursorPos, cursorPos);
            }
        }
    },
    handleKey: (e) => {
        if (e.key === 'Escape') {
            listState.inputValue = '';
            listState.search = '';
            if (window.render) window.render();
            const newInput = document.getElementById('model-search-input');
            if (newInput) newInput.focus();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // If we have a top match and there is text in search
            if (listState.topModelId && listState.search.length >= 2) {
                if (window.viewModel) window.viewModel(listState.topModelId);
            } else {
                // No match or short text, behave like Escape to clear
                listState.inputValue = '';
                listState.search = '';
                if (window.render) window.render();
                const newInput = document.getElementById('model-search-input');
                if (newInput) newInput.focus();
            }
        }
    },
    toggleGallery: (modelId) => {
        const gallery = document.getElementById(`gallery-${modelId}`);
        if (gallery) {
            gallery.style.display = gallery.style.display === 'none' ? 'block' : 'none';
        }
    }
};

export function renderModelList(models, calendarEvents = []) {
    // 1. Calculate stats (booking counts)
    const bookingCounts = {};
    calendarEvents.forEach(booking => {
        bookingCounts[booking.user_id] = (bookingCounts[booking.user_id] || 0) + 1;
    });

    // 2. Filter
    let filteredModels = models.filter(model => {
        const search = listState.search;
        if (!search) return true;
        const name = (model.fullname || '').toLowerCase();
        const desc = (model.description || '').toLowerCase();
        return name.includes(search) || desc.includes(search);
    });

    // 3. Sort
    filteredModels.sort((a, b) => {
        const nameA = (a.fullname || '').toLowerCase();
        const nameB = (b.fullname || '').toLowerCase();

        switch (listState.sort) {
            case 'za': return nameB.localeCompare(nameA);
            case 'date':
                return new Date(b.created_on || 0) - new Date(a.created_on || 0);
            case 'az':
            default:
                return nameA.localeCompare(nameB);
        }
    });

    // Update top model ID for Enter key navigation
    listState.topModelId = filteredModels.length > 0 ? filteredModels[0].id : null;

    // 4. Render
    return `
        <div class="model-list-container">
            <!-- Toolbar -->
            <div class="list-toolbar">
                <div class="search-box">
                    <span class="material-symbols-outlined">search</span>
                    <input type="text" 
                           id="model-search-input"
                           placeholder="Search models..." 
                           value="${listState.inputValue}"
                           oninput="window.modelListHandlers.setSearch(event)"
                           onkeydown="window.modelListHandlers.handleKey(event)"
                           autofocus>
                </div>
                <div class="sort-controls">
                    <button class="btn-icon ${listState.sort === 'az' ? 'active' : ''}" 
                            onclick="window.modelListHandlers.setSort('az')" 
                            title="Sort A-Z">
                        <span class="material-symbols-outlined">sort_by_alpha</span>
                    </button>
                    <button class="btn-icon ${listState.sort === 'za' ? 'active' : ''}" 
                            onclick="window.modelListHandlers.setSort('za')" 
                            title="Sort Z-A">
                        <span class="material-symbols-outlined">south</span>
                    </button>
                    <button class="btn-icon ${listState.sort === 'date' ? 'active' : ''}" 
                            onclick="window.modelListHandlers.setSort('date')" 
                            title="Newest First">
                        <span class="material-symbols-outlined">calendar_today</span>
                    </button>
                </div>
            </div>

            <!-- Grid -->
            <div class="model-grid">
                ${filteredModels.map(model => renderModelCard(model, bookingCounts[model.user_id] || 0)).join('')}
            </div>
            
            ${filteredModels.length === 0 ? `
                <div class="empty-state">
                    <span class="material-symbols-outlined">person_off</span>
                    <p>No models found matching "${listState.search}"</p>
                </div>
            ` : ''}
        </div>
    `;
}

function renderModelCard(model, bookingCount) {
    const portraitUrl = model.portrait
        ? `https://ik.imagekit.io/fliptopbox/lifedrawing/model/${model.portrait}?tr=w-500,h-500,fo-face`
        : 'https://via.placeholder.com/500x500?text=No+Photo';

    // Parse websites if stringified
    let websites = [];
    try {
        if (Array.isArray(model.websites)) websites = model.websites;
        else if (model.websites) websites = JSON.parse(model.websites);
    } catch (e) { websites = []; }

    // Sells Online Badge Logic
    const sellsOnlineBadge = model.sells_online
        ? `<span class="badge badge-success" title="Sells content online"><span class="material-symbols-outlined" style="font-size: 14px; margin-right: 2px;">shopping_cart</span>Sells Online</span>`
        : '';

    const cardClass = `model-card ${!model.active ? 'inactive-card' : ''}`;

    return `
        <div class="${cardClass}" onclick="viewModel(${model.id})">
            <div class="model-header-image">
                <img src="${portraitUrl}" alt="${model.fullname}" loading="lazy">
                <div class="model-badges">
                    ${bookingCount > 0 ? `<span class="badge badge-info">${bookingCount} Booking${bookingCount !== 1 ? 's' : ''}</span>` : ''}
                    ${sellsOnlineBadge}
                </div>
            </div>
            
            <div class="model-content">
                <div class="model-main-info">
                    <h3>${model.fullname || 'Unknown'}</h3>
                    <p class="model-location">
                        <span class="material-symbols-outlined">location_on</span>
                        ${model.location || 'London, UK'} <!-- Placeholder as data missing -->
                    </p>
                </div>

                ${model.description ? `
                    <div class="model-bio">
                        <p>${model.description}</p>
                    </div>
                ` : ''}

                <div class="model-contact-grid">
                    ${model.email ? `
                        <a href="mailto:${model.email}" class="contact-item" title="Email" onclick="event.stopPropagation()">
                            <span class="material-symbols-outlined">mail</span>
                        </a>
                    ` : ''}
                    ${model.phone ? `
                        <a href="tel:${model.phone}" class="contact-item" title="Call" onclick="event.stopPropagation()">
                            <span class="material-symbols-outlined">call</span>
                        </a>
                    ` : ''}
                    ${model.instagram ? `
                        <a href="https://instagram.com/${model.instagram}" target="_blank" class="contact-item" title="Instagram" onclick="event.stopPropagation()">
                            <span class="material-symbols-outlined">photo_camera</span>
                        </a>
                    ` : ''}
                    ${websites.length > 0 ? `
                        <a href="${websites[0]}" target="_blank" class="contact-item" title="Website" onclick="event.stopPropagation()">
                            <span class="material-symbols-outlined">language</span>
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}
