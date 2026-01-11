(async function () {
    const form = document.querySelector('form');
    const requiredInputs = form.querySelectorAll('[required]');
    const workPreferencesGroup = form.querySelector('#work-preferences').parentElement;
    const workSeeksGroup = form.querySelector('#work-seeks').parentElement;

    // --- Timezone Logic ---
    try {
        const tzInput = document.getElementById('timezone');
        if (tzInput) {
            tzInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
    } catch (e) {
        console.warn('Could not determine timezone', e);
    }
    // --- End Timezone Logic ---

    // --- Portrait Upload Logic ---
    const portraitsInput = document.getElementById('portraits');
    const imagePlaceholders = form.querySelectorAll('.image-placeholder');
    const portraitFormGroup = form.querySelector('.portrait-upload-container-new').parentElement;
    const portraitFiles = new Array(4).fill(null);
    const portraitDataUrls = new Array(4).fill(null);
    let currentPlaceholderIndex = -1;

    imagePlaceholders.forEach(placeholder => {
        placeholder.addEventListener('click', (event) => {
            if (event.target.classList.contains('discard-btn')) {
                // Handle discard
                const index = parseInt(placeholder.dataset.index, 10);
                event.stopPropagation();
                portraitFiles[index] = null;
                portraitDataUrls[index] = null;
                placeholder.innerHTML = '<div class="plus-icon">+</div>';
                placeholder.classList.remove('has-image');
            } else {
                // Handle image selection
                currentPlaceholderIndex = parseInt(placeholder.dataset.index, 10);
                portraitsInput.value = null;
                portraitsInput.click();
            }
        });
    });

    portraitsInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file || currentPlaceholderIndex === -1) return;

        const CONSTRAINTS_MSG = `
Please ensure your image meets the following requirements:
• Format: JPG only
• Max File Size: 10MB
• Orientation: Portrait (Vertical)
• Minimum Resolution: 1080x1440 pixels
• Aspect Ratio: 3:4 (Traditional) or 9:16 (Story)`;

        // Check for file size limit (10MB)
        const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > FILE_SIZE_LIMIT) {
            alert(`IMAGE REJECTED: File size exceeds 10MB limit.\n${CONSTRAINTS_MSG}`);
            return;
        }

        if (file.type !== 'image/jpeg') {
            alert(`IMAGE REJECTED: Only JPG images are allowed.\n${CONSTRAINTS_MSG}`);
            return;
        }

        if (file.type !== 'image/jpeg') {
            alert(`IMAGE REJECTED: Only JPG images are allowed.\n${CONSTRAINTS_MSG}`);
            return;
        }

        const processImageWithCanvas = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                const TARGET_WIDTH = 1080;
                const TARGET_HEIGHT = 1440;
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const width = img.width;
                        const height = img.height;

                        // 1. Orientation Check
                        if (width > height) {
                            alert(`IMAGE REJECTED: Image must be in portrait orientation (taller than it is wide).`);
                            reject(new Error("Landscape check failed"));
                            return;
                        }

                        // 2. Minimum Height Check
                        if (height < TARGET_HEIGHT) {
                            alert(`IMAGE REJECTED: Image resolution is too low. Minimum height is ${TARGET_HEIGHT}.`);
                            reject(new Error("Min height check failed"));
                            return;
                        }

                        // 3. Process to 3:4 Aspect Ratio (Canvas)
                        const targetRatio = 3 / 4;

                        // Calculate crop dimensions (Top-Center Gravity)
                        // If current ratio is wider than target, crop width
                        // If current ratio is taller than target, crop height (though unlikely given portrait requirement usually implies taller)

                        const currentRatio = width / height;

                        let cropWidth, cropHeight, offsetX, offsetY;

                        if (currentRatio > targetRatio) {
                            // Image is too wide, crop sides
                            cropHeight = height;
                            cropWidth = height * targetRatio;
                            offsetX = (width - cropWidth) / 2; // Center horizontally
                            offsetY = 0; // Top gravity
                        } else {
                            // Image is too tall, crop bottom
                            cropWidth = width;
                            cropHeight = width / targetRatio;
                            offsetX = 0;
                            offsetY = 0; // Top gravity
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = TARGET_WIDTH;
                        canvas.height = TARGET_HEIGHT;
                        const ctx = canvas.getContext('2d');

                        // Draw image: Source Crop (cropWidth/Height) -> Dest Canvas (1080x1440)
                        ctx.drawImage(img, offsetX, offsetY, cropWidth, cropHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

                        // Convert to Base64
                        const processedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                        resolve({ dataUrl: processedDataUrl, blob: null }); // returning blob null for now as we use dataUrl
                    };
                    img.onerror = (err) => reject(err);
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        };

        processImageWithCanvas(file).then(({ dataUrl }) => {
            if (portraitDataUrls.includes(dataUrl)) {
                alert('This image has already been uploaded.');
                return;
            }

            portraitFiles[currentPlaceholderIndex] = file; // Keep original file object for reference if needed
            portraitDataUrls[currentPlaceholderIndex] = dataUrl;
            const placeholder = imagePlaceholders[currentPlaceholderIndex];

            placeholder.innerHTML = '';
            const img = document.createElement('img');
            img.src = dataUrl;
            const discardBtn = document.createElement('div');
            discardBtn.className = 'discard-btn';
            discardBtn.innerHTML = 'x';

            placeholder.appendChild(img);
            placeholder.appendChild(discardBtn);
            placeholder.classList.add('has-image');
            portraitFormGroup.classList.remove('invalid');
        }).catch(err => {
            console.warn("Image processing skipped or failed:", err);
            // Alert already handled in function
        });
    });

    // --- End Portrait Upload Logic ---

    // --- Year of birth and Experience Logic ---
    const yearOfBirthInput = document.getElementById('year_of_birth');
    const dateBirthdayHiddenInput = document.getElementById('date_birthday');
    const dateExperienceSelect = document.getElementById('date_experience');
    const yearOfBirthFormGroup = yearOfBirthInput.parentElement;
    const dateExperienceFormGroup = dateExperienceSelect.parentElement;

    yearOfBirthInput.addEventListener('input', () => {
        const year = yearOfBirthInput.value;
        if (year.length === 4 && parseInt(year) >= 1900 && parseInt(year) <= new Date().getFullYear()) {
            dateBirthdayHiddenInput.value = `${year}-01-01T00:00:00.000Z`;
            yearOfBirthFormGroup.classList.remove('invalid');
        } else {
            dateBirthdayHiddenInput.value = '';
        }
    });

    dateExperienceSelect.addEventListener('change', () => {
        if (dateExperienceSelect.value !== '') {
            dateExperienceFormGroup.classList.remove('invalid');
        }
    });
    // --- End Year of birth and Experience Logic ---

    // --- Social Handles Logic ---
    // Instagram and X (Twitter) have preset inputs in the HTML
    // Users can add other platforms using "platform:handle" format
    const socialHandlesContainer = document.getElementById('social-handles-container');
    const addSocialBtn = document.getElementById('add-social-btn');
    const socialHandlesData = {}; // Will store { platform: "handle", ... }
    let socialHandleCounter = 0;


    const MAX_SOCIALS = 4;

    function updateSocialBtnState() {
        const count = socialHandlesContainer.querySelectorAll('.input-row').length;
        // Total rows (including presets). The requirement is "inputs on the page".
        // But since we have presets (2), we might want to check dynamics.
        // Assuming "inputs on the page" means total.
        addSocialBtn.style.display = count >= MAX_SOCIALS ? 'none' : 'inline-block';
    }

    function addSocialHandleRow() {
        const rowId = `social-row-${socialHandleCounter++}`;
        const row = document.createElement('div');
        row.id = rowId;
        row.className = 'input-row';

        // Platform input
        const platformInput = document.createElement('input');
        platformInput.type = 'text';
        platformInput.placeholder = 'platform';
        platformInput.className = 'input-aux';

        // Handle input
        const handleInput = document.createElement('input');
        handleInput.type = 'text';
        handleInput.placeholder = 'yourhandle';
        handleInput.className = 'input-aux';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'cta-icon-button';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            const platform = platformInput.value.trim().toLowerCase();
            if (platform) {
                delete socialHandlesData[platform];
            }
            row.remove();
            updateSocialBtnState();
        };

        // Update data when either input changes
        const updateData = () => {
            const platform = platformInput.value.trim().toLowerCase();
            const handle = handleInput.value.trim();

            if (platform && handle) {
                socialHandlesData[platform] = handle;
            } else if (platform) {
                // Platform exists but no handle, remove it
                delete socialHandlesData[platform];
            }
        };

        platformInput.addEventListener('input', updateData);
        handleInput.addEventListener('input', updateData);

        row.appendChild(platformInput);
        row.appendChild(handleInput);
        row.appendChild(removeBtn);
        socialHandlesContainer.appendChild(row);
    }

    addSocialBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addSocialHandleRow();
        updateSocialBtnState();
    });
    // Initialize
    updateSocialBtnState();
    // --- End Social Handles Logic ---

    // --- Website URLs Logic ---
    const websitesContainer = document.getElementById('websites-container');
    const addWebsiteBtn = document.getElementById('add-website-btn');
    const websiteUrlsData = []; // Will store array of URLs
    let websiteCounter = 0;

    function addWebsiteRow() {
        // Limit check
        if (websitesContainer.querySelectorAll('input').length >= 4) return;

        const rowId = `website-row-${websiteCounter++}`;
        const row = document.createElement('div');
        row.id = rowId;
        row.className = 'input-row';

        const input = document.createElement('input');
        input.type = 'url';
        input.placeholder = 'https://example.com';
        input.className = 'input-aux';
        input.required = false;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'cta-icon-button';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => {
            const index = websiteUrlsData.indexOf(input.value);
            if (index > -1) {
                websiteUrlsData.splice(index, 1);
            }
            row.remove();
            updateWebsiteBtnState();
        };

        input.addEventListener('input', (e) => {
            const oldValue = row.dataset.currentValue || '';
            const newValue = e.target.value;

            const oldIndex = websiteUrlsData.indexOf(oldValue);
            if (oldIndex > -1) {
                websiteUrlsData[oldIndex] = newValue;
            } else {
                websiteUrlsData.push(newValue);
            }

            row.dataset.currentValue = newValue;
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        websitesContainer.appendChild(row);
    }


    const MAX_WEBSITES = 4;
    function updateWebsiteBtnState() {
        const count = websitesContainer.querySelectorAll('input').length;
        addWebsiteBtn.style.display = count >= MAX_WEBSITES ? 'none' : 'inline-block';
    }

    addWebsiteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addWebsiteRow();
        updateWebsiteBtnState();
    });
    // Initialize
    updateWebsiteBtnState();
    // --- End Website URLs Logic ---


    // Unique validation
    const users = await fetch('/v_users.json').then(res => res.json());
    form.querySelectorAll('[unique]').forEach(el => {
        el.onblur = (e) => {
            const value = e.target.value;
            const exists = users.some(user => user[el.id] === value);
            el.classList.remove('invalid');
            if (exists) el.classList.add('invalid');
        };
    });

    // Chip selection
    form.querySelectorAll('.chip-group').forEach(chipGroup => {
        chipGroup.addEventListener('click', (event) => {
            if (event.target.classList.contains('chip')) {
                event.target.classList.toggle('selected');
                chipGroup.parentElement.classList.remove('invalid');
            }
        });
    });

    // Remove invalid class on input
    requiredInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                input.classList.remove('invalid');
            }
        });
    });

    // Form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        let allValid = true;

        // Validation checks...
        requiredInputs.forEach(input => {
            // Use browser native validation API (respects required, minlength, pattern, type)
            if (!input.checkValidity()) {
                input.classList.add('invalid');
                allValid = false;
            } else {
                input.classList.remove('invalid');
            }
        });

        // Optional: Work preferences defaults
        if (workPreferencesGroup.querySelectorAll('.chip.selected').length === 0) {
            // It's optional now, backend has defaults (In-Person)
        }

        // Optional: Work Seeks
        if (workSeeksGroup.querySelectorAll('.chip.selected').length === 0) {
            // Optional
        }

        if (portraitFiles.every(file => file === null)) {
            portraitFormGroup.classList.add('invalid');
            allValid = false;
        } else {
            portraitFormGroup.classList.remove('invalid');
        }

        // Validate Year of birth
        // Validate Year of birth ONLY if entered
        const year = yearOfBirthInput.value;
        if (year) {
            if (year.length !== 4 || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear()) {
                yearOfBirthFormGroup.classList.add('invalid');
                allValid = false;
            } else {
                yearOfBirthFormGroup.classList.remove('invalid');
            }
        }

        // Validate Experience
        // Validate Experience ONLY if entered (it is not required now)
        // No custom validation needed as it is a dropdown, just don't flag if empty.


        // Validate Website URLs (ensure valid absolute URLs)
        const websiteInputs = websitesContainer.querySelectorAll('input');
        websiteInputs.forEach(input => {
            const val = input.value.trim();
            if (val) {
                // Use URL.canParse
                if (URL.canParse(val)) {
                    input.classList.remove('invalid');
                } else {
                    input.classList.add('invalid');
                    allValid = false;
                }
            } else {
                input.classList.remove('invalid');
            }
        });

        if (!allValid) {
            console.log('Validation failed');
            // Visual feedback on save button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalColor = submitBtn.style.backgroundColor;
            submitBtn.style.backgroundColor = 'var(--error-color, #ff4444)';
            submitBtn.textContent = 'Fix Errors';

            setTimeout(() => {
                submitBtn.style.backgroundColor = originalColor;
                submitBtn.textContent = 'Save';
            }, 2000);

            // Scroll to first error
            const firstInvalid = form.querySelector('.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // If it's an input, focus it
                if (firstInvalid.tagName === 'INPUT' || firstInvalid.tagName === 'TEXTAREA' || firstInvalid.tagName === 'SELECT') {
                    firstInvalid.focus();
                }
            }
            return;
        }

        const formData = new FormData(form);
        const modelData = Object.fromEntries(formData.entries());

        // Transform Experience to Date
        const experienceValue = modelData.date_experience;
        const now = new Date();
        let experienceDate = null;

        if (experienceValue === 'less_than_12_months') {
            experienceDate = new Date();
            experienceDate.setMonth(now.getMonth() - 6);
        } else if (experienceValue === 'between_1_and_5_years') {
            experienceDate = new Date();
            experienceDate.setFullYear(now.getFullYear() - 3);
        } else if (experienceValue === 'more_than_5_years') {
            experienceDate = new Date();
            experienceDate.setFullYear(now.getFullYear() - 6);
        }

        modelData.date_experience = experienceDate ? experienceDate.toISOString() : null;

        modelData.portrait_urls = portraitDataUrls.filter(url => url !== null);

        // Get work preferences from chips
        const workPreferences = {};
        document.querySelectorAll('#work-preferences .chip').forEach(chip => {
            workPreferences[chip.dataset.value] = chip.classList.contains('selected');
        });
        modelData.work_preferences = workPreferences;

        // Get work seeks from chips
        const workSeeks = [];
        document.querySelectorAll('#work-seeks .chip.selected').forEach(chip => {
            workSeeks.push(chip.dataset.value);
        });
        modelData.work_seeks = workSeeks;

        // Get social handles from preset inputs (all optional now)
        modelData.social_handles = {};

        const instagram = document.getElementById('instagram').value.trim();
        const twitter = document.getElementById('twitter').value.trim();

        if (instagram) modelData.social_handles.instagram = instagram;
        if (twitter) modelData.social_handles.twitter = twitter;

        // Merge additional social handles from dynamic inputs
        Object.keys(socialHandlesData).forEach(platform => {
            if (socialHandlesData[platform] && socialHandlesData[platform].trim()) {
                modelData.social_handles[platform] = socialHandlesData[platform].trim();
            }
        });

        // Get website URLs from preset input and dynamic inputs
        const website1 = document.getElementById('website1').value.trim();

        const presetWebsites = website1 ? [website1] : [];
        const dynamicWebsites = websiteUrlsData.filter(url => url && url.trim()).map(url => url.trim());

        modelData.website_urls = [...presetWebsites, ...dynamicWebsites];

        console.log('Submitting model data:', modelData);

        // Auto-generate handle if missing (since it is now optional/hidden)
        if (!modelData.handle) {
            // Prefer Instagram handle (it is required), fallback to name
            let source = modelData.instagram || modelData.display_name || modelData.fullname || 'user';

            let base = source.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/[^a-z0-9]/g, '-') // replace non-alphanumeric (like . or _) with -
                .replace(/-+/g, '-') // collapse multiple hyphens
                .replace(/^-|-$/g, ''); // trim hyphens

            if (!base) base = 'user';
            modelData.handle = base;
        }

        // Send data to the new registration endpoint
        try {
            const response = await fetch('http://localhost:8787/api/register/model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modelData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Model registered successfully! User ID:', result.userId, result);
                form.reset();
                // Clear UI
                document.querySelectorAll('.chip.selected').forEach(chip => chip.classList.remove('selected'));
                requiredInputs.forEach(input => input.classList.remove('invalid'));
                workPreferencesGroup.classList.remove('invalid');
                workSeeksGroup.classList.remove('invalid');
                portraitFormGroup.classList.remove('invalid');
                portraitFiles.fill(null);
                portraitDataUrls.fill(null);
                imagePlaceholders.forEach(p => {
                    p.innerHTML = '<div class="plus-icon">+</div>';
                    p.classList.remove('has-image');
                });
                yearOfBirthFormGroup.classList.remove('invalid');
                dateExperienceFormGroup.classList.remove('invalid');
                dateBirthdayHiddenInput.value = '';
            } else {
                console.error('Error: ' + (result.details || 'An unknown error occurred.'), result);
            }
        } catch (error) {
            console.error('Network error: ' + error.message, error);
        }
    });

    // --- Character Count Logic ---
    const descriptionInput = document.getElementById('description');
    const descriptionCount = document.getElementById('description-count');

    if (descriptionInput && descriptionCount) {
        // Read max length from the HTML attribute
        const maxLen = parseInt(descriptionInput.getAttribute('maxlength'), 10) || 512;

        const updateCount = (e) => {
            const val = descriptionInput.value;

            // Security: Check for HTML markup
            // Matches <tag> or </tag> pattern
            if (/<[a-z][\s\S]*>/i.test(val)) {
                alert('Security Warning: HTML markup is not allowed. The input has been cleared.');
                descriptionInput.value = '';
                descriptionCount.textContent = `${maxLen} remaining`;
                return;
            }

            const remaining = maxLen - descriptionInput.value.length;
            descriptionCount.textContent = `${remaining} remaining`;
        };
        descriptionInput.addEventListener('input', updateCount);
        // Initialize
        updateCount();
    }
    // --- End Character Count Logic ---

    // --- Populate Nationality Select ---
    const flagSelect = document.getElementById('flag_emoji');
    if (flagSelect) {
        try {
            const response = await fetch('/js/countries.json');
            if (response.ok) {
                let countries = await response.json();

                // Sort: Primary by priority (descending), Secondary by name (ascending)
                countries.sort((a, b) => {
                    const priorityA = a.priority || 0;
                    const priorityB = b.priority || 0;
                    if (priorityA !== priorityB) {
                        return priorityB - priorityA; // Descending priority
                    }
                    return a.name.localeCompare(b.name); // Ascending name
                });

                // Clear existing options (if any)
                flagSelect.innerHTML = '<option value="">-- Select --</option>';

                // Create document fragment for better performance
                const fragment = document.createDocumentFragment();

                let lastPriority = -1;

                countries.forEach((country, index) => {
                    // check for priority change to add a separator line
                    const currentPriority = country.priority || 0;
                    if (index > 0 && currentPriority !== lastPriority && lastPriority === 1) {
                        const separator = document.createElement('option');
                        separator.disabled = true;
                        separator.textContent = '──────────';
                        fragment.appendChild(separator);
                    }
                    lastPriority = currentPriority;

                    const option = document.createElement('option');
                    option.value = country.code.toLowerCase();
                    option.textContent = `${country.emoji} - ${country.name}`;
                    fragment.appendChild(option);
                });

                flagSelect.appendChild(fragment);
            } else {
                console.warn('Could not load countries.json');
            }
        } catch (err) {
            console.error('Failed to populate nationality select:', err);
        }
    }
    // --- End Populate Nationality Select ---

})();