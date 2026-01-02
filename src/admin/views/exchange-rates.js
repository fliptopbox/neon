
import * as API from '../client.js';
import { renderExchangeRateDetail, attachExchangeRateDetailHandlers } from './exchange-rate-detail.js';
import { showModal } from '../components/modal.js';

let ratesData = [];

export function renderExchangeRates() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button id="add-rate-btn" class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95">
                    <span class="material-symbols-outlined">add</span>
                    <span>Add Currency</span>
                </button>
            </div>

            <!-- Content -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th class="px-6 py-4">Currency</th>
                                <th class="px-6 py-4">Rate to USD</th>
                                <th class="px-6 py-4 text-right">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody id="rates-table-body" class="divide-y divide-gray-50">
                            ${Array(3).fill(0).map(() => `
                                <tr class="animate-pulse">
                                    <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-12"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-20"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-24 ml-auto"></div></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

import { countries } from '../utils/countries.js';

// ...

function renderRateRow(rate) {
    const date = new Date(rate.updated_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    // Find country details for this currency code
    // Priority 1: Match Country Code (first 2 chars of Currency Code) -> e.g. US -> USD, CH -> CHF
    // Priority 2: Match Currency Code -> e.g. EUR (no country code 'EU'), or generic match
    let country = countries.find(c => c.code === rate.currency_code.substring(0, 2));

    if (!country) {
        country = countries.find(c => c.currency_code === rate.currency_code);
    }

    // Default fallback
    const emoji = country ? country.emoji : '💰';
    const name = country ? country.currency : rate.currency_code;

    return `
        <tr class="hover:bg-gray-50 cursor-pointer transition-colors" data-code="${rate.currency_code}">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl shadow-sm border border-gray-100">
                        ${emoji}
                    </div>
                    <div>
                        <div class="font-bold text-gray-900">${rate.currency_code}</div>
                        <div class="text-xs text-gray-500">${name}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="font-mono text-gray-700 font-medium">${parseFloat(rate.rate_to_usd).toFixed(4)}</span>
                <span class="text-xs text-gray-400 ml-1">USD</span>
            </td>
            <td class="px-6 py-4 text-right text-gray-500 text-sm">
                ${date}
            </td>
        </tr>
    `;
}

export function attachExchangeRatesHandlers() {
    loadRates();

    const addBtn = document.getElementById('add-rate-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showModal(renderExchangeRateDetail({}), 'exchange-rate-detail');
            attachExchangeRateDetailHandlers({});
        });
    }
}

async function loadRates() {
    try {
        ratesData = await API.getExchangeRates();
        updateRatesTable();
    } catch (error) {
        document.getElementById('rates-table-body').innerHTML = `
            <tr>
                <td colspan="3" class="px-6 py-8 text-center text-red-500">
                    Failed to load rates: ${error.message}
                </td>
            </tr>
        `;
    }
}

function updateRatesTable() {
    const tbody = document.getElementById('rates-table-body');
    if (!tbody) return;

    if (ratesData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-gray-500">No rates found.</td></tr>`;
        return;
    }

    tbody.innerHTML = ratesData.map(renderRateRow).join('');

    tbody.querySelectorAll('tr[data-code]').forEach(row => {
        row.addEventListener('click', () => {
            const code = row.dataset.code;
            const rate = ratesData.find(r => r.currency_code === code);
            if (rate) {
                showModal(renderExchangeRateDetail(rate), 'exchange-rate-detail');
                attachExchangeRateDetailHandlers(rate);
            }
        });
    });
}

window.loadRates = loadRates;
