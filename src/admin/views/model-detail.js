
import { countries } from '../utils/countries.js';
import * as API from '../client.js';

export function renderModelDetail(model) {
    const pronouns = ['he/him', 'she/her', 'they/them'];
    const workSeeks = model.work_seeks || [];

    // Helper to check if a seek is selected
    const isSeeking = (val) => workSeeks.includes(val);

    return `
        <div class="p-6 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                   <h3 class="text-2xl font-bold text-gray-900">Edit Model</h3>
                   <p class="text-sm text-gray-500">ID: ${model.id} • User: ${model.fullname}</p>
                </div>
            </div>

            <form id="edit-model-form" class="space-y-6">
                <!-- Basic Info -->
                <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                    <h4 class="font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Info</h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                            <input type="text" name="display_name" value="${model.display_name || ''}" required
                                class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pronouns</label>
                            <select name="pronouns" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                                <option value="">Unspecified</option>
                                ${pronouns.map(p => `
                                    <option value="${p}" ${model.pronouns === p ? 'selected' : ''}>${p}</option>
                                `).join('')}
                                <option value="other" ${!pronouns.includes(model.pronouns) && model.pronouns ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                            <select name="sex" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                                <option value="unspecified" ${model.sex === 'unspecified' ? 'selected' : ''}>Unspecified</option>
                                <option value="female" ${model.sex === 'female' ? 'selected' : ''}>Female</option>
                                <option value="male" ${model.sex === 'male' ? 'selected' : ''}>Male</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                            <input type="text" name="tz" value="${model.tz || 'Europe/London'}"
                                class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                        </div>
                    </div>
                     
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows="3"
                            class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">${model.description || ''}</textarea>
                    </div>
                </div>

                <!-- Rates -->
                <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                    <h4 class="font-medium text-gray-900 border-b border-gray-200 pb-2">Rates & Currency</h4>
                    
                     <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <select name="currency_code" class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                                ${countries.map(c => `
                                    <option value="${c.currency_code}" ${model.currency_code === c.currency_code ? 'selected' : ''}>
                                        ${c.emoji} ${c.currency_code}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Min Hourly Rate</label>
                            <input type="number" name="rate_min_hour" value="${model.rate_min_hour || 0}" step="0.01"
                                class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Min Day Rate</label>
                            <input type="number" name="rate_min_day" value="${model.rate_min_day || 0}" step="0.01"
                                class="w-full border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                        </div>
                    </div>
                </div>

                 <!-- Work Preferences -->
                <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                    <h4 class="font-medium text-gray-900 border-b border-gray-200 pb-2">Work Preferences</h4>
                    
                    <div class="flex gap-6">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="work_inperson" ${model.work_inperson ? 'checked' : ''}
                                class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary">
                            <span class="text-sm font-medium text-gray-700">In-Person</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="work_online" ${model.work_online ? 'checked' : ''}
                                class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary">
                            <span class="text-sm font-medium text-gray-700">Online</span>
                        </label>
                         <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="work_photography" ${model.work_photography ? 'checked' : ''}
                                class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary">
                            <span class="text-sm font-medium text-gray-700">Photography</span>
                        </label>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Willing to model for:</label>
                        <div class="grid grid-cols-2 gap-2">
                            ${['nude', 'portrait', 'clothed', 'underwear', 'costume', 'bodypaint'].map(opt => `
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="work_seeks" value="${opt}" ${isSeeking(opt) ? 'checked' : ''}
                                        class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary">
                                    <span class="text-sm text-gray-600 capitalize">${opt}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-gray-100">
                    <button type="button" id="delete-model-btn"
                        class="px-6 py-2.5 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all md:mr-auto">
                        Delete Profile
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

export function attachModelDetailHandlers(model) {
    const form = document.getElementById('edit-model-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalBtnContent = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner w-5 h-5"></div>';

            const formData = new FormData(form);

            // Collect Multi-Checkboxes
            const workSeeks = Array.from(form.querySelectorAll('input[name="work_seeks"]:checked')).map(cb => cb.value);

            const payload = {
                display_name: formData.get('display_name'),
                description: formData.get('description'),
                pronouns: formData.get('pronouns'),
                sex: formData.get('sex'),
                tz: formData.get('tz'),
                currency_code: formData.get('currency_code'),
                rate_min_hour: parseFloat(formData.get('rate_min_hour')),
                rate_min_day: parseFloat(formData.get('rate_min_day')),
                work_inperson: formData.get('work_inperson') === 'on',
                work_online: formData.get('work_online') === 'on',
                work_photography: formData.get('work_photography') === 'on',
                work_seeks: workSeeks
            };

            await API.updateModel(model.id, payload);
            showToast('Model updated successfully');
            closeModal();

            // Refresh list if available
            if (window.loadModels) window.loadModels();

        } catch (error) {
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtnContent;
        }
    });

    const deleteBtn = document.getElementById('delete-model-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete this model profile? This action cannot be undone.`)) {
                try {
                    deleteBtn.disabled = true;
                    deleteBtn.innerHTML = 'Deleting...';

                    await API.deleteModel(model.id);
                    showToast('Model profile deleted');
                    closeModal();

                    if (window.loadModels) window.loadModels();
                } catch (error) {
                    alert(error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Delete Profile';
                }
            }
        });
    }
}
