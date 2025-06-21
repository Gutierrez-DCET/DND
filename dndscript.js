// =================================================================
//                      GLOBAL UTILITY FUNCTIONS
// =================================================================
// These elements and functions are defined globally so they can be accessed
// by any page's initialization logic that needs a custom confirmation.
const confirmationModal = document.createElement('div'); // Create it dynamically
confirmationModal.id = 'confirmation-modal';
confirmationModal.className = 'modal-overlay hidden';
confirmationModal.innerHTML = `
    <div class="modal-content small-modal">
        <p id="confirmation-message">Are you sure?</p>
        <div class="modal-actions">
            <button id="confirm-yes-btn" class="confirm-yes-btn">Yes</button>
            <button id="confirm-no-btn" class="confirm-no-btn">No</button>
        </div>
    </div>
`;
document.body.appendChild(confirmationModal); // Append to body once

const confirmationMessage = document.getElementById('confirmation-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');
let confirmAction = null; // Stores the function to execute on 'Yes'

/**
 * Shows the custom confirmation modal.
 * @param {string} message - The message to display in the modal.
 * @param {Function} onConfirm - The callback function to execute if 'Yes' is clicked.
 * @param {boolean} isError - If true, style the modal for an error message.
 */
function showConfirmationModal(message, onConfirm, isError = false) {
    confirmationMessage.textContent = message;
    confirmAction = onConfirm; // Store the callback

    if (isError) {
        confirmationModal.querySelector('.modal-content').classList.add('error-modal');
        confirmYesBtn.style.display = 'none'; // Hide Yes button for error
        confirmNoBtn.textContent = 'OK'; // Change No button to OK
    } else {
        confirmationModal.querySelector('.modal-content').classList.remove('error-modal');
        confirmYesBtn.style.display = ''; // Show Yes button
        confirmNoBtn.textContent = 'No'; // Restore No button text
    }

    confirmationModal.classList.remove('hidden');

    // Remove previous listeners to prevent multiple executions
    confirmYesBtn.removeEventListener('click', handleConfirmYes);
    confirmNoBtn.removeEventListener('click', handleConfirmNo);

    // Add new listeners
    confirmYesBtn.addEventListener('click', handleConfirmYes);
    confirmNoBtn.addEventListener('click', handleConfirmNo);
}

function handleConfirmYes() {
    confirmationModal.classList.add('hidden');
    if (confirmAction) {
        confirmAction(); // Execute the stored callback
    }
}

function handleConfirmNo() {
    confirmationModal.classList.add('hidden');
    // If it was an error modal, just close on OK.
    // If it was a confirmation, 'No' means do nothing further.
}


// =================================================================
//                      PAGE INITIALIZATION LOGIC
// =================================================================
// This is the main entry point. It runs when the page is loaded.
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on and run the correct setup function.
    if (document.querySelector('.homepage-container')) {
        initHomepage();
    }
    if (document.getElementById('character-form')) {
        initCharacterPage();
    }
    if (document.getElementById('campaign-list')) {
        initCampaignPage();
    }
    // Call updateNavUI on every page load to ensure user status is correct
    updateNavUI();
});


// =================================================================
//                      HOMEPAGE LOGIC
// =================================================================
function initHomepage() {
    // --- Elements ---
    const authModal = document.getElementById('authModal');
    const authTitle = document.getElementById('authTitle');
    const authForm = document.getElementById('authForm');
    const authSubmit = document.getElementById('authSubmit');
    const closeBtn = document.querySelector('#authModal .close');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');

    // --- Predefined Users ---
    const defaultUsers = [
        { email: 'admin@example.com', password: 'admin123', isAdmin: true },
        { email: 'user@example.com', password: 'user123', isAdmin: false }
    ];

    // Initialize users in localStorage if not already present
    if (!localStorage.getItem('registeredUsers')) {
        localStorage.setItem('registeredUsers', JSON.stringify(defaultUsers));
    }

    // --- Event Listeners ---
    signInBtn?.addEventListener('click', () => {
        authTitle.textContent = 'Sign In';
        authSubmit.textContent = 'Sign In';
        authForm.dataset.mode = 'signIn';
        authModal.style.display = 'block';
    });

    signUpBtn?.addEventListener('click', () => {
        authTitle.textContent = 'Sign Up';
        authSubmit.textContent = 'Sign Up';
        authForm.dataset.mode = 'signUp';
        authModal.style.display = 'block';
    });

    closeBtn?.addEventListener('click', () => {
        authModal.style.display = 'none';
        authForm.reset();
    });

    window.addEventListener('click', (event) => {
        if (event.target == authModal) {
            authModal.style.display = 'none';
            authForm.reset();
        }
    });

    authForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = authForm.elements.email.value;
        const password = authForm.elements.password.value;
        const mode = authForm.dataset.mode;

        let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

        if (mode === 'signUp') {
            if (users.some(user => user.email === email)) {
                showConfirmationModal('Account with this email already exists!', () => {}, true);
            } else {
                users.push({ email, password, isAdmin: false });
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                showConfirmationModal('Registration successful! You can now sign in.', () => {}, false);
                authModal.style.display = 'none';
                authForm.reset();
            }
        } else if (mode === 'signIn') {
            const user = users.find(user => user.email === email && user.password === password);
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showConfirmationModal(`Welcome, ${user.email}!`, () => {
                    authModal.style.display = 'none';
                    authForm.reset();
                    updateNavUI(); // Update UI after successful login
                    location.reload(); // Reload the page to reflect login status
                });

            } else {
                showConfirmationModal('Invalid email or password.', () => {}, true);
            }
        }
    });

    // Forgot Password Logic
    document.querySelector('.forgot-password')?.addEventListener('click', () => {
        const email = prompt("Enter your registered email:");

        if (!email) return; // User cancelled

        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const user = users.find(u => u.email === email);

        if (user) {
            showConfirmationModal(`Your password is: ${user.password}`, () => {});
        } else {
            showConfirmationModal('No account found with that email.', () => {}, true);
        }
    });
}

// Update UI on login/logout
function updateNavUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const navArea = document.getElementById('user-status');

    if (navArea) { // Ensure navArea exists
        if (user) {
            navArea.innerHTML = `
                Logged in as ${user.email} (${user.isAdmin ? 'Admin' : 'User'})
                <button onclick="logoutUser()">Logout</button>
            `;
        } else {
            navArea.innerHTML = `
                <button id="signInBtn">Sign In</button>
                <button id="signUpBtn">Sign Up</button>
            `;
            // Re-attach listeners for sign in/up buttons if they were just added
            document.getElementById('signInBtn')?.addEventListener('click', () => {
                document.getElementById('authTitle').textContent = 'Sign In';
                document.getElementById('authSubmit').textContent = 'Sign In';
                document.getElementById('authForm').dataset.mode = 'signIn';
                document.getElementById('authModal').style.display = 'block';
            });
            document.getElementById('signUpBtn')?.addEventListener('click', () => {
                document.getElementById('authTitle').textContent = 'Sign Up';
                document.getElementById('authSubmit').textContent = 'Sign Up';
                document.getElementById('authForm').dataset.mode = 'signUp';
                document.getElementById('authModal').style.display = 'block';
            });
        }
    }
}

// Logout
function logoutUser() {
    showConfirmationModal('Are you sure you want to log out?', () => {
        localStorage.removeItem('currentUser');
        // alert('Logged out!'); // Replaced by confirmation modal
        location.reload(); // Reload the page to reflect logged out status
    });
}


// =================================================================
//                      CHARACTER PAGE LOGIC
// =================================================================
function initCharacterPage() {
    // --- Elements ---
    const characterList = document.getElementById('character-list');
    const noCharactersMessage = document.getElementById('no-characters-message');
    const openModalBtn = document.getElementById('open-character-modal-btn');
    const characterModal = document.getElementById('character-modal');
    const characterModalCloseBtn = document.getElementById('character-modal-close');
    const characterForm = document.getElementById('character-form');
    const saveCharacterBtn = document.getElementById('save-character-btn');
    const modalTitle = document.getElementById('modal-title');

    // --- Constants ---
    const STORAGE_KEY_CHARACTERS = 'dndCharacters';

    // --- Helper Functions ---
    const getCharacters = () => {
        const charactersJSON = localStorage.getItem(STORAGE_KEY_CHARACTERS);
        return charactersJSON ? JSON.parse(charactersJSON) : [];
    };

    const saveCharacters = (characters) => {
        localStorage.setItem(STORAGE_KEY_CHARACTERS, JSON.stringify(characters));
    };

    const renderCharacters = () => {
        const characters = getCharacters();
        characterList.innerHTML = ''; // Clear existing cards

        if (characters.length === 0) {
            noCharactersMessage.classList.remove('hidden');
            return;
        } else {
            noCharactersMessage.classList.add('hidden');
        }

        characters.forEach(character => {
            const characterCard = document.createElement('div');
            characterCard.className = 'character-card';
            characterCard.dataset.id = character.id; // Store ID for editing/deleting

            characterCard.innerHTML = `
                <h3>${character.name}</h3>
                <p><strong>Class:</strong> ${character.class}</p>
                <p><strong>Race:</strong> ${character.race}</p>
                <p><strong>Background:</strong> ${character.background}</p>
                <div class="card-buttons">
                    <button class="edit-character-btn">Edit</button>
                    <button class="delete-character-btn">Delete</button>
                </div>
            `;
            characterList.appendChild(characterCard);
        });
    };

    const openCharacterModal = (character = {}) => {
        characterForm.reset(); // Clear form
        characterForm.dataset.id = character.id || ''; // Set ID for editing
        modalTitle.textContent = character.id ? 'Edit Character' : 'Create New Character';

        if (character.id) {
            // Populate form for editing
            document.getElementById('character-name').value = character.name || '';
            document.getElementById('character-class').value = character.class || 'Warrior';
            document.getElementById('character-race').value = character.race || 'Human';
            document.getElementById('character-background').value = character.background || '';
        }
        characterModal.classList.remove('hidden');
    };

    const closeCharacterModal = () => {
        characterModal.classList.add('hidden');
    };

    // --- Event Listeners ---
    openModalBtn?.addEventListener('click', () => openCharacterModal());
    characterModalCloseBtn?.addEventListener('click', closeCharacterModal);
    characterModal?.addEventListener('click', (event) => {
        if (event.target === characterModal) {
            closeCharacterModal();
        }
    });

    characterForm?.addEventListener('submit', (event) => {
        event.preventDefault();

        const id = characterForm.dataset.id;
        const newCharacterData = {
            id: id || Date.now(), // Use existing ID or generate new one
            name: document.getElementById('character-name').value,
            class: document.getElementById('character-class').value,
            race: document.getElementById('character-race').value,
            background: document.getElementById('character-background').value
        };

        let characters = getCharacters();
        if (id) {
            // Update existing character
            const index = characters.findIndex(char => char.id == id);
            if (index !== -1) {
                characters[index] = newCharacterData;
            }
        } else {
            // Add new character
            characters.push(newCharacterData);
        }

        saveCharacters(characters);
        renderCharacters();
        closeCharacterModal();
    });

    characterList?.addEventListener('click', (event) => {
        const target = event.target;
        const card = target.closest('.character-card');
        if (!card) return;

        const characterId = card.dataset.id;
        let characters = getCharacters();
        const characterToEdit = characters.find(char => char.id == characterId);

        if (target.classList.contains('edit-character-btn')) {
            openCharacterModal(characterToEdit);
        } else if (target.classList.contains('delete-character-btn')) {
            showConfirmationModal('Are you sure you want to delete this character?', () => {
                const updatedCharacters = characters.filter(char => char.id != characterId);
                saveCharacters(updatedCharacters);
                renderCharacters();
            });
        }
    });

    // --- Initial Load ---
    renderCharacters();
}


// =================================================================
//                      CAMPAIGN PAGE LOGIC
// =================================================================
function initCampaignPage() {
    // --- Elements ---
    const campaignList = document.getElementById('campaign-list');
    const openModalBtn = document.getElementById('openModalBtn');
    const campaignModal = document.getElementById('campaignModal');
    const createModalClose = document.getElementById('createModalClose');
    const campaignForm = document.getElementById('campaign-form');
    const modalTitle = document.getElementById('modal-title');
    const detailModal = document.getElementById('detailModal');
    const detailModalClose = document.getElementById('detailModalClose');
    const enemyOthersCheckbox = document.getElementById('enemy-others-checkbox');
    const enemyOthersText = document.getElementById('enemy-others-text');

    // --- Constants ---
    const STORAGE_KEY_CAMPAIGNS = 'dndCampaigns';

    // --- Helper Functions ---
    const getCampaigns = () => {
        const campaignsJSON = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
        return campaignsJSON ? JSON.parse(campaignsJSON) : [];
    };

    const saveCampaigns = (campaigns) => {
        localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
    };

    const renderCampaigns = () => {
        const campaigns = getCampaigns();
        campaignList.innerHTML = ''; // Clear existing cards

        if (campaigns.length === 0) {
            campaignList.innerHTML = '<p class="no-campaigns-message">No campaigns created yet. Click "Add New Campaign" to begin!</p>';
            return;
        }

        campaigns.forEach(campaign => {
            const campaignCard = document.createElement('div');
            campaignCard.className = 'campaign-card';
            campaignCard.dataset.id = campaign.id;

            let difficultyClass = '';
            if (campaign.difficulty === 'Easy') difficultyClass = 'difficulty-easy';
            else if (campaign.difficulty === 'Medium') difficultyClass = 'difficulty-medium';
            else if (campaign.difficulty === 'Hard') difficultyClass = 'difficulty-hard';

            campaignCard.innerHTML = `
                <h3>${campaign.name}</h3>
                <p>${campaign.description.substring(0, 100)}...</p>
                <p class="difficulty-tag ${difficultyClass}">${campaign.difficulty}</p>
                <div class="card-actions">
                    <button class="view-btn"><i class="fas fa-eye"></i> View</button>
                    <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            `;
            campaignList.appendChild(campaignCard);
        });
    };

    const openCampaignModal = (campaign = {}) => {
        campaignForm.reset();
        enemyOthersText.classList.add('hidden'); // Hide others text by default
        enemyOthersText.value = ''; // Clear its value

        campaignForm.dataset.id = campaign.id || '';
        modalTitle.textContent = campaign.id ? 'Edit Campaign' : 'New Campaign';

        if (campaign.id) {
            document.getElementById('campaign-name').value = campaign.name || '';
            document.getElementById('campaign-description').value = campaign.description || '';

            // Populate enemy types checkboxes
            document.querySelectorAll('input[name="enemy-type"]').forEach(checkbox => {
                checkbox.checked = campaign.enemyTypes.includes(checkbox.value);
            });
            // Handle 'Others' enemy type
            if (campaign.enemyTypes && campaign.enemyTypes.includes('Others')) {
                enemyOthersCheckbox.checked = true;
                enemyOthersText.classList.remove('hidden');
                const othersValue = campaign.enemyTypes.find(type => type !== 'Goblins' && type !== 'Orcs' && type !== 'Dragons');
                if (othersValue && othersValue !== 'Others') { // Check if there's a specific 'Others' value
                    enemyOthersText.value = othersValue;
                } else {
                    enemyOthersText.value = ''; // Clear if only "Others" was checked without specific text
                }
            }


            // Populate secrets checkboxes
            document.querySelectorAll('input[name="secrets"]').forEach(checkbox => {
                checkbox.checked = campaign.secrets.includes(checkbox.value);
            });
            document.getElementById('difficulty').value = campaign.difficulty || 'Easy';
        }

        campaignModal.style.display = 'block';
    };

    const openDetailModal = (campaign) => {
        document.getElementById('detail-name').textContent = campaign.name;
        document.getElementById('detail-description').textContent = campaign.description;
        document.getElementById('detail-enemies').textContent = campaign.enemyTypes.join(', ') || 'None';
        document.getElementById('detail-secrets').textContent = campaign.secrets.join(', ') || 'None';

        const detailDifficulty = document.getElementById('detail-difficulty');
        detailDifficulty.textContent = campaign.difficulty;
        detailDifficulty.className = 'difficulty-tag'; // Reset class
        if (campaign.difficulty === 'Easy') detailDifficulty.classList.add('difficulty-easy');
        else if (campaign.difficulty === 'Medium') detailDifficulty.classList.add('difficulty-medium');
        else if (campaign.difficulty === 'Hard') detailDifficulty.classList.add('difficulty-hard');

        detailModal.style.display = 'block';
    };

    // --- Event Listeners ---
    openModalBtn?.addEventListener('click', () => openCampaignModal());
    createModalClose?.addEventListener('click', () => {
        campaignModal.style.display = 'none';
    });
    detailModalClose?.addEventListener('click', () => {
        detailModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == campaignModal) {
            campaignModal.style.display = 'none';
        }
        if (event.target == detailModal) {
            detailModal.style.display = 'none';
        }
    });

    // Toggle 'Others' enemy type text input
    enemyOthersCheckbox?.addEventListener('change', () => {
        if (enemyOthersCheckbox.checked) {
            enemyOthersText.classList.remove('hidden');
            enemyOthersText.setAttribute('required', 'required'); // Make required if checked
        } else {
            enemyOthersText.classList.add('hidden');
            enemyOthersText.removeAttribute('required'); // Remove required if unchecked
            enemyOthersText.value = ''; // Clear value when hidden
        }
    });


    campaignForm?.addEventListener('submit', (event) => {
        event.preventDefault();

        const id = campaignForm.dataset.id;
        const enemyTypes = Array.from(campaignForm.querySelectorAll('input[name="enemy-type"]:checked')).map(cb => cb.value);

        if (enemyOthersCheckbox.checked && enemyOthersText.value.trim() !== '') {
            if (!enemyTypes.includes(enemyOthersText.value.trim())) { // Avoid duplicates if "Others" was already in predefined list
                 // Replace "Others" if it was checked, with the custom value.
                 // Otherwise, just add the custom value.
                const othersIndex = enemyTypes.indexOf('Others');
                if (othersIndex > -1) {
                    enemyTypes[othersIndex] = enemyOthersText.value.trim();
                } else {
                    enemyTypes.push(enemyOthersText.value.trim());
                }
            }
        } else if (enemyOthersCheckbox.checked && enemyOthersText.value.trim() === '') {
            // If "Others" is checked but text is empty, ensure "Others" value is still added
            if (!enemyTypes.includes('Others')) {
                enemyTypes.push('Others');
            }
        }


        const campaignData = {
            id: id || Date.now(),
            name: document.getElementById('campaign-name').value,
            description: document.getElementById('campaign-description').value,
            enemyTypes: enemyTypes,
            secrets: Array.from(campaignForm.querySelectorAll('input[name="secrets"]:checked')).map(cb => cb.value),
            difficulty: document.getElementById('difficulty').value
        };

        let campaigns = getCampaigns();
        if (id) {
            const index = campaigns.findIndex(c => c.id == id);
            if (index !== -1) {
                campaigns[index] = campaignData;
                console.log("Updating existing campaign. New array:", campaigns);
            } else {
                console.warn("Campaign ID not found for update, adding as new:", id);
                campaigns.push(campaignData);
            }
        } else {
            campaigns.push(campaignData);
            console.log("Adding new campaign. New array:", campaigns);
        }
        try {
            saveCampaigns(campaigns);
            renderCampaigns();
            campaignModal.style.display = 'none';
            console.log("Campaign successfully saved to localStorage.");
        } catch (e) {
            console.error("Error saving campaign to localStorage:", e);
            let errorMessage = "Failed to save campaign. Your browser's storage might be full or blocked. Check console for details.";
            if (e.name === 'QuotaExceededError') {
                errorMessage = "Failed to save campaign: Local storage limit reached. Please delete some campaigns or clear browser data.";
            } else if (e.name === 'SecurityError') {
                errorMessage = "Failed to save campaign: Browser security settings prevent storage (e.g., private Browse).";
            }
            showConfirmationModal(errorMessage, () => {}, true);
        }
    });

    campaignList?.addEventListener('click', (e) => {
        const card = e.target.closest('.campaign-card');
        if (!card) return;
        const id = card.dataset.id;
        const campaigns = getCampaigns();
        const campaign = campaigns.find(c => c.id == id);

        if (e.target.matches('.delete-btn, .delete-btn *')) {
            showConfirmationModal('Are you sure you want to delete this campaign?', () => {
                saveCampaigns(getCampaigns().filter(c => c.id != id));
                renderCampaigns();
            });
        } else if (e.target.matches('.edit-btn, .edit-btn *')) {
            openCampaignModal(campaign);
        } else if (e.target.matches('.view-btn, .view-btn *')) {
            openDetailModal(campaign);
        }
    });

    // Auto-Resizing Description Box - specific to campaign form
    const descriptionBox = document.getElementById('campaign-description');
    if (descriptionBox) {
        descriptionBox.addEventListener('input', () => {
            descriptionBox.style.height = 'auto';
            descriptionBox.style.height = descriptionBox.scrollHeight + 'px';
        });
    }

    // Initial Load
    renderCampaigns();
}