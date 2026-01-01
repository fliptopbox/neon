
import * as API from '../client.js';
import { closeModal } from '../components/modal.js';

export function renderExchangeRateDetail(rate) {
    const isEditing = !!rate.currency_code;
    return `
        <div class="p-6">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">${isEditing ? 'Edit Rate' : 'Add Currency'}</h2>
                    <p class="text-sm text-gray-500">${isEditing ? `Update ${rate.currency_code} rate` : 'Add a new currency rate'}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="rate-form" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                    <input type="text" name="currency_code" value="${rate.currency_code || ''}" 
                        ${isEditing ? 'readonly' : 'required'}
                        maxlength="3"
                        placeholder="e.g. EUR"
                        class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase ${isEditing ? 'bg-gray-50 text-gray-500' : ''}">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rate to USD</label>
                    <input type="number" name="rate_to_usd" value="${rate.rate_to_usd || ''}" required step="0.000001"
                        placeholder="e.g. 1.1000"
                        class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <p class="text-xs text-gray-500 mt-1">1 UNIT = X USD</p>
                </div>

                <!-- Actions -->
                <div class="flex gap-3 pt-6 border-t border-gray-100">
                    <button type="submit" class="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow">
                        ${isEditing ? 'Save Changes' : 'Add Currency'}
                    </button>
                    ${isEditing ? `
                        <button type="button" id="delete-rate-btn" class="px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                            Delete
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;
}

export function attachExchangeRateDetailHandlers(rate) {
    const form = document.getElementById('rate-form');

    // Save
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner w-5 h-5 border-2"></span>';

            const formData = new FormData(form);
            const data = {
                currency_code: formData.get('currency_code').toUpperCase(),
                rate_to_usd: parseFloat(formData.get('rate_to_usd')),
            };

            if (rate.currency_code) {
                await API.updateExchangeRate(rate.currency_code, data);
                showToast('Rate updated successfully');
            } else {
                await API.createExchangeRate(data);
                showToast('Currency added successfully');
            }

            closeModal();
            if (window.loadRates) window.loadRates();

        } catch (error) {
            console.error(error);
            alert(error.message);
            btn.disabled = false;
            btn.textContent = rate.currency_code ? 'Save Changes' : 'Add Currency';
        }
    });

    // Delete
    const deleteBtn = document.getElementById('delete-rate-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${rate.currency_code}?`)) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = 'Deleting...';

                    await API.deleteExchangeRate(rate.currency_code);
                    showToast('Currency deleted successfully');
                    closeModal();

                    if (window.loadRates) window.loadRates();
                } catch (error) {
                    alert(error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Delete';
                }
            }
        });
    }
}
