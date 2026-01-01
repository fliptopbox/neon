/**
 * User Detail Modal View
 */

import { countries } from '../utils/countries.js';
import * as API from '../client.js';

export function renderUserDetail(user) {
    const profile = user.profile || {};
    const paymentMethods = profile.payment_methods || { monzo: '', revolut: '', paypal: '', bank: { name: '', sort_code: '', account_number: '', iban: '' } };

    // Ensure bank object exists
    if (!paymentMethods.bank) {
        paymentMethods.bank = { name: '', sort_code: '', account_number: '', iban: '' };
    }

    return `
        <div class="p-6 space-y-6">
            <div class="flex items-center justify-between">
                <h3 class="text-2xl font-bold text-gray-900">Edit User</h3>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
                    ${user.is_admin ? 'Admin' : 'User'}
                </span>
            </div>

            <form id="edit-user-form" class="space-y-6">
                <!-- Account Info -->
                <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                    <h4 class="font-medium text-gray-900 border-b border-gray-200 pb-2">Account</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value="${user.email}" disabled
                                class="w-full bg-gray-200 border-gray-300 rounded-lg text-gray-500 cursor-not-allowed">
                        </div>
                        <div class="flex items-center gap-4 pt-6">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="is_admin" ${user.is_admin ? 'checked' : ''} 
                                    class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary">
                                <span class="text-sm font-medium text-gray-700">Administrator</span>
                            </label>
                            
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="is_global_active" ${user.is_global_active ? 'checked' : ''}
                                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600">
                                <span class="text-sm font-medium text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Profile Info -->
                <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                    <h4 class="font-medium text-gray-900 border-b border-gray-200 pb-2">Profile</h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" name="fullname" value="${profile.fullname || ''}" required
                                class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Handle</label>
                            <div class="flex">
                                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">@</span>
                                <input type="text" name="handle" value="${profile.handle || ''}" required
                                    class="w-full border-gray-300 rounded-r-lg focus:ring-primary focus:border-primary">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Country / Currency</label>
                            <select name="currency_code" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                                ${countries.map(c => `
                                    <option value="${c.currency_code}" ${profile.currency_code === c.currency_code ? 'selected' : ''}>
                                        ${c.emoji} ${c.name} (${c.currency_code})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="tel" name="phone_number" value="${profile.phone_number || ''}"
                                class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows="3"
                            class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">${profile.description || ''}</textarea>
                    </div>
                </div>

                <!-- Payment Methods -->
                <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                    <h4 class="font-medium text-gray-900 border-b border-gray-200 pb-2">Payment Methods</h4>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1 uppercase">Monzo</label>
                            <div class="flex">
                                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">monzo.me/</span>
                                <input type="text" name="payment_monzo" value="${paymentMethods.monzo?.replace('https://monzo.me/', '') || ''}"
                                    class="w-full border-gray-300 rounded-r-lg text-sm focus:ring-primary focus:border-primary">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1 uppercase">Revolut</label>
                            <div class="flex">
                                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">revolut.me/</span>
                                <input type="text" name="payment_revolut" value="${paymentMethods.revolut?.replace('https://revolut.me/', '') || ''}"
                                    class="w-full border-gray-300 rounded-r-lg text-sm focus:ring-primary focus:border-primary">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-500 mb-1 uppercase">Paypal</label>
                            <div class="flex">
                                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">paypal.me/</span>
                                <input type="text" name="payment_paypal" value="${paymentMethods.paypal?.replace('https://paypal.me/', '') || ''}"
                                    class="w-full border-gray-300 rounded-r-lg text-sm focus:ring-primary focus:border-primary">
                            </div>
                        </div>
                    </div>
                    
                    <div class="pt-2">
                         <label class="block text-xs font-medium text-gray-500 mb-1 uppercase">Bank Details</label>
                         <div class="grid grid-cols-2 gap-2">
                             <input type="text" name="bank_name" placeholder="Account Name" value="${paymentMethods.bank.name || ''}" class="border-gray-300 rounded-md text-sm">
                             <input type="text" name="bank_sort" placeholder="Sort Code" value="${paymentMethods.bank.sort_code || ''}" class="border-gray-300 rounded-md text-sm">
                             <input type="text" name="bank_account" placeholder="Account Number" value="${paymentMethods.bank.account_number || ''}" class="border-gray-300 rounded-md text-sm">
                             <input type="text" name="bank_iban" placeholder="IBAN" value="${paymentMethods.bank.iban || ''}" class="border-gray-300 rounded-md text-sm">
                         </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-gray-100">
                    <button type="button" id="delete-user-btn"
                        class="px-6 py-2.5 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all md:mr-auto">
                        Delete User
                    </button>
                    
                    <button type="button" onclick="closeModal()"
                        class="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-all">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="flex-1 md:flex-none md:w-48 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
}

export function renderAddUser() {
    return `
        <div class="p-6 space-y-6">
            <h3 class="text-2xl font-bold text-gray-900">Add New User</h3>
            
            <form id="add-user-form" class="space-y-4">
                 <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" required
                        class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="fullname" required
                        class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                    <input type="password" name="password" required minlength="6"
                        class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                </div>
                
                 <div class="pt-4 flex gap-3">
                    <button type="submit" 
                        class="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90">
                        Create User
                    </button>
                    <button type="button" onclick="closeModal()"
                        class="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
}


export function attachUserDetailHandlers(user) {
    const form = document.getElementById('edit-user-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalBtnContent = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner w-5 h-5"></div>';

            const formData = new FormData(form);

            // Build Payment JSON
            const paymentMethods = {
                monzo: formData.get('payment_monzo') ? `https://monzo.me/${formData.get('payment_monzo')}` : null,
                revolut: formData.get('payment_revolut') ? `https://revolut.me/${formData.get('payment_revolut')}` : null,
                paypal: formData.get('payment_paypal') ? `https://paypal.me/${formData.get('payment_paypal')}` : null,
                bank: {
                    name: formData.get('bank_name') || null,
                    sort_code: formData.get('bank_sort') || null,
                    account_number: formData.get('bank_account') || null,
                    iban: formData.get('bank_iban') || null
                }
            };

            // Find Country Emoji
            const currencyCode = formData.get('currency_code');
            const country = countries.find(c => c.currency_code === currencyCode);

            const payload = {
                is_admin: formData.get('is_admin') === 'on',
                is_global_active: formData.get('is_global_active') === 'on',
                profile: {
                    fullname: formData.get('fullname'),
                    handle: formData.get('handle'),
                    phone_number: formData.get('phone_number'),
                    description: formData.get('description'),
                    currency_code: currencyCode,
                    flag_emoji: country ? country.emoji : '🏳️',
                    payment_methods: paymentMethods
                }
            };

            await API.updateUser(user.id, payload);
            showToast('User updated successfully');
            closeModal();

            // Refresh list if available
            if (window.loadUsers) window.loadUsers();

        } catch (error) {
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtnContent;
        }
    });

    const deleteBtn = document.getElementById('delete-user-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = 'Deleting...';

                    await API.deleteUser(user.id);
                    showToast('User deleted successfully');
                    closeModal();

                    if (window.loadUsers) window.loadUsers();
                } catch (error) {
                    alert(error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Delete User';
                }
            }
        });
    }
}

export function attachAddUserHandlers() {
    const form = document.getElementById('add-user-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;

            const formData = new FormData(form);
            await API.register(
                formData.get('email'),
                formData.get('password'),
                formData.get('fullname')
            );

            showToast('User created successfully');
            closeModal();
            if (window.loadUsers) window.loadUsers();

        } catch (error) {
            alert(error.message);
        } finally {
            btn.disabled = false;
        }
    });
}
