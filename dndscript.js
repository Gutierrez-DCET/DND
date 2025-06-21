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
 * @param {boolean} isError - If true, style the modal for an error message (shows 'OK' button only).
 */
const showConfirmationModal = (message, onConfirm, isError = false) => {
    confirmationMessage.textContent = message;
    confirmAction = onConfirm; // Store the action to be performed
    confirmationModal.classList.remove('hidden');

    // Remove previous listeners to prevent duplicates
    confirmYesBtn.removeEventListener('click', confirmActionWrapper);
    confirmNoBtn.removeEventListener('click', hideConfirmationModal);

    if (isError) {
        confirmYesBtn.textContent = 'OK';
        confirmNoBtn.classList.add('hidden'); // Hide 'No' button
        confirmYesBtn.addEventListener('click', hideConfirmationModal, { once: true });
    } else {
        confirmYesBtn.textContent = 'Yes';
        confirmNoBtn.classList.remove('hidden'); // Show 'No' button
        confirmYesBtn.addEventListener('click', confirmActionWrapper, { once: true });
        confirmNoBtn.addEventListener('click', hideConfirmationModal, { once: true });
    }
};

/**
 * Wrapper for confirmAction to ensure hideConfirmationModal is called.
 */
const confirmActionWrapper = () => {
    if (confirmAction) {
        confirmAction();
    }
    hideConfirmationModal();
};

/**
 * Hides the custom confirmation modal.
 */
const hideConfirmationModal = () => {
    confirmationModal.classList.add('hidden');
    confirmAction = null; // Clear the action
};


// Global function for logout (accessible from any page)
function logoutUser() {
    localStorage.removeItem('currentUser');
    // Using default alert for logout as it's a simple, non-critical action
    alert('Logged out!');
    location.reload(); // Reload the page to reflect logout status
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

    // --- Modal Events ---
    if (signInBtn) signInBtn.addEventListener('click', () => {
        authTitle.textContent = 'Sign In';
        authSubmit.textContent = 'Sign In';
        authModal.style.display = 'block';
    });
    if (signUpBtn) signUpBtn.addEventListener('click', () => {
        authTitle.textContent = 'Sign Up';
        authSubmit.textContent = 'Sign Up';
        authModal.style.display = 'block';
    });
    if (closeBtn) closeBtn.addEventListener('click', () => authModal.style.display = 'none');
    window.addEventListener('click', e => {
        if (e.target === authModal) authModal.style.display = 'none';
    });

    // --- Form Submission ---
    if (authForm) authForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = authForm.email.value;
        const password = authForm.password.value;
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

        if (authSubmit.textContent === 'Sign In') {
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert(`Welcome back, ${user.isAdmin ? 'Admin' : 'User'}: ${user.email}`); // Using alert as per original
                authModal.style.display = 'none';
                updateNavUI();
            } else {
                alert('Invalid email or password.'); // Using alert as per original
            }
        } else { // Sign Up
            if (users.some(u => u.email === email)) {
                alert('Email already exists!'); // Using alert as per original
            } else {
                const newUser = { email, password, isAdmin: false };
                users.push(newUser);
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                alert('Sign up successful!'); // Using alert as per original
                authModal.style.display = 'none';
                updateNavUI();
            }
        }
        authForm.reset();
    });

    // --- UI Update Functions ---
    function updateNavUI() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const navArea = document.getElementById('user-status');
        if (user && navArea) {
            navArea.innerHTML = `
                Logged in as ${user.email} (${user.isAdmin ? 'Admin' : 'User'})
                <button onclick="logoutUser()">Logout</button>
            `;
        } else if (navArea) {
            // Re-create sign-in/sign-up buttons and re-attach listeners if logged out
            navArea.innerHTML = `
                <button id="signInBtn">Sign In</button>
                <button id="signUpBtn">Sign Up</button>
            `;
            // Re-add event listeners since we replaced the HTML
            const newSignInBtn = document.getElementById('signInBtn');
            const newSignUpBtn = document.getElementById('signUpBtn');
            if (newSignInBtn) newSignInBtn.addEventListener('click', () => {
                authTitle.textContent = 'Sign In';
                authSubmit.textContent = 'Sign In';
                authModal.style.display = 'block';
            });
            if (newSignUpBtn) newSignUpBtn.addEventListener('click', () => {
                authTitle.textContent = 'Sign Up';
                authSubmit.textContent = 'Sign Up';
                authModal.style.display = 'block';
            });
        }
    }

    // --- Initial Load ---
    updateNavUI();
}


// =================================================================
//                      CHARACTER PAGE LOGIC
// =================================================================
function initCharacterPage() {
    // DOM Element References (local to this function)
    const openModalBtn = document.getElementById('open-character-modal-btn');
    const closeModalBtn = document.getElementById('close-character-modal-btn');
    const characterModal = document.getElementById('character-modal');
    const characterForm = document.getElementById('character-form');
    const characterListDiv = document.getElementById('character-list');
    const modalTitle = document.getElementById('modal-title');
    const characterIdInput = document.getElementById('character-id');
    const noCharactersMessage = document.getElementById('no-characters-message');

    // Key for localStorage (local to this page's logic)
    const STORAGE_KEY = 'dndCharacters';

    // --- localStorage Operations ---

    /**
     * Retrieves all characters from localStorage.
     * @returns {Array<Object>} - An array of character objects.
     */
    const getCharactersFromLocalStorage = () => {
        try {
            const charactersJSON = localStorage.getItem(STORAGE_KEY);
            return charactersJSON ? JSON.parse(charactersJSON) : [];
        } catch (e) {
            console.error("Error retrieving characters from localStorage:", e);
            showConfirmationModal("Error loading characters. Your browser's storage might be full or blocked. Check console for details.", () => {}, true);
            return [];
        }
    };

    /**
     * Saves a character to localStorage (adds new or updates existing).
     * @param {Object} characterData - The character data to save.
     * @param {string|null} characterId - The ID of the character if updating, null if new.
     */
    const saveCharacter = (characterData, characterId = null) => {
        try {
            console.log("Attempting to save character data:", characterData);
            let characters = getCharactersFromLocalStorage();

            if (characterId) {
                // Update existing character
                const index = characters.findIndex(char => char.id === characterId);
                if (index !== -1) {
                    characters[index] = { ...characterData, id: characterId }; // Preserve existing ID
                    console.log("Updating existing character. New array:", characters);
                } else {
                    console.warn("Character ID not found for update, adding as new:", characterId);
                    characterData.id = Date.now().toString(); // Generate new ID if not found
                    characters.push(characterData);
                }
            } else {
                // Add new character with a unique ID
                characterData.id = Date.now().toString(); // Simple unique ID
                characters.push(characterData);
                console.log("Adding new character. New array:", characters);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
            console.log("Character data successfully saved to localStorage.");
            closeCharacterModal(); // Close modal after successful save
            loadCharacters(); // Reload characters to update the display
        } catch (e) {
            console.error("Error saving character to localStorage:", e);
            let errorMessage = "Failed to save character. Your browser's storage might be full or blocked. Check console for details.";
            if (e.name === 'QuotaExceededError') {
                errorMessage = "Failed to save character: Local storage limit reached. Please delete some characters or clear browser data.";
            } else if (e.name === 'SecurityError') {
                errorMessage = "Failed to save character: Browser security settings prevent storage (e.g., private browsing).";
            }
            showConfirmationModal(errorMessage, () => {}, true);
        }
    };

    /**
     * Deletes a character from localStorage.
     * @param {string} characterId - The ID of the character to delete.
     */
    const deleteCharacter = (characterId) => {
        try {
            console.log("Attempting to delete character with ID:", characterId);
            let characters = getCharactersFromLocalStorage();
            const initialLength = characters.length;
            characters = characters.filter(char => char.id !== characterId);
            if (characters.length < initialLength) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
                console.log("Character successfully deleted from localStorage. New array:", characters);
                loadCharacters(); // Reload characters to update the display
            } else {
                console.warn("Character with ID not found, nothing to delete:", characterId);
                showConfirmationModal("Character not found for deletion.", () => {}, true);
            }
        } catch (e) {
            console.error("Error deleting character from localStorage:", e);
            showConfirmationModal("Failed to delete character. Check console for details.", () => {}, true);
        }
    };

    /**
     * Renders a single character card.
     * @param {Object} character - The character object with an 'id' property.
     * @returns {HTMLElement} - The character card element.
     */
    const renderCharacterCard = (character) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.setAttribute('data-id', character.id); // Store ID on the element

        card.innerHTML = `
            <h3>${character.name}</h3>
            <p><strong>Class:</strong> ${character.class}</p>
            <p><strong>Race:</strong> ${character.race}</p>
            <p><strong>Background:</strong> ${character.background}</p>
            <div class="character-card-actions">
                <button class="edit-btn"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>
        `;

        // Add event listeners for edit and delete buttons on the card
        card.querySelector('.edit-btn').addEventListener('click', () => {
            openCharacterModal(character); // Open modal with this character's data
        });

        card.querySelector('.delete-btn').addEventListener('click', () => {
            showConfirmationModal(`Are you sure you want to delete ${character.name}?`, () => {
                deleteCharacter(character.id);
            });
        });

        return card;
    };

    /**
     * Loads and displays all characters from localStorage.
     */
    const loadCharacters = () => {
        const characters = getCharactersFromLocalStorage();
        characterListDiv.innerHTML = ''; // Clear current list

        if (characters.length === 0) {
            noCharactersMessage.classList.remove('hidden');
        } else {
            noCharactersMessage.classList.add('hidden');
            // characters.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Uncomment if using timestamp for sorting
            characters.forEach((character) => {
                const card = renderCharacterCard(character);
                characterListDiv.appendChild(card);
            });
        }
    };

    // --- Modal Functions (local to character page) ---
    /**
     * Opens the character modal.
     * If characterData is provided, it's for editing; otherwise, for creating.
     * @param {Object|null} characterData - The character data to populate the form, or null for a new character.
     */
    const openCharacterModal = (characterData = null) => {
        characterForm.reset(); // Clear the form
        characterIdInput.value = ''; // Clear hidden ID input

        if (characterData) {
            // Populate form for editing
            modalTitle.textContent = 'Edit Character';
            characterIdInput.value = characterData.id; // Set hidden ID
            document.getElementById('character-name').value = characterData.name;
            document.getElementById('character-class').value = characterData.class;
            document.getElementById('character-race').value = characterData.race;
            document.getElementById('character-background').value = characterData.background;
        } else {
            // Setup for new character
            modalTitle.textContent = 'Create New Character';
        }
        characterModal.classList.remove('hidden');
    };

    /**
     * Closes the character modal.
     */
    const closeCharacterModal = () => {
        characterModal.classList.add('hidden');
    };


    // --- Event Listeners (local to character page) ---

    // Open Modal button
    if (openModalBtn) openModalBtn.addEventListener('click', () => openCharacterModal());

    // Close Modal button
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeCharacterModal);

    // Close modal if overlay is clicked (but not the content itself)
    if (characterModal) characterModal.addEventListener('click', (event) => {
        if (event.target === characterModal) {
            closeCharacterModal();
        }
    });

    // Handle form submission (Create/Update character)
    if (characterForm) characterForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const characterId = characterIdInput.value || null; // Get ID if editing
        const characterData = {
            name: document.getElementById('character-name').value,
            class: document.getElementById('character-class').value,
            race: document.getElementById('character-race').value,
            background: document.getElementById('character-background').value,
            // You can add a timestamp here if you want to store creation/last modified time
            // timestamp: new Date().toISOString()
        };

        // Basic validation: ensure all fields have values before attempting to save
        if (!characterData.name || !characterData.class || !characterData.race || !characterData.background) {
            showConfirmationModal("Please fill in all character fields.", () => {}, true);
            return;
        }

        saveCharacter(characterData, characterId);
    });

    // Initial load of characters when the page loads
    loadCharacters();
}


// =================================================================
//                      CAMPAIGN PAGE LOGIC
// =================================================================
function initCampaignPage() {
    // --- Elements ---
    const openModalBtn = document.getElementById('openModalBtn');
    const campaignModal = document.getElementById('campaignModal');
    const detailModal = document.getElementById('detailModal');
    const createModalClose = document.getElementById('createModalClose');
    const detailModalClose = document.getElementById('detailModalClose');
    const campaignForm = document.getElementById('campaign-form');
    const campaignList = document.getElementById('campaign-list');
    const enemyOthersCheckbox = document.getElementById('enemy-others-checkbox');
    const enemyOthersText = document.getElementById('enemy-others-text');
    const modalTitle = document.getElementById('modal-title');
    const saveBtn = document.getElementById('save-campaign-btn');
    const STORAGE_KEY = 'dndCampaigns';

    // --- LocalStorage Functions ---
    const getCampaigns = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const saveCampaigns = (campaigns) => localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));

    // --- Core Functions ---
    const renderCampaigns = () => {
        campaignList.innerHTML = '';
        getCampaigns().forEach(campaign => {
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.dataset.id = campaign.id;
            card.innerHTML = `
                <h3>${campaign.name}</h3>
                <p>Status: In Progress</p>
                <span class="difficulty-tag difficulty-${campaign.difficulty}">${campaign.difficulty}</span>
                <div class="card-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            // Add event listener for card detail view (excluding action buttons)
            card.addEventListener('click', (e) => {
                // Check if the click target is NOT one of the action buttons or their icons
                if (!e.target.closest('.card-actions button')) {
                    showCampaignDetail(campaign.id);
                }
            });

            // Add specific listeners for edit and delete buttons
            card.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click from triggering
                openEditModal(campaign.id);
            });
            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click from triggering
                showConfirmationModal(`Are you sure you want to delete "${campaign.name}"?`, () => {
                    saveCampaigns(getCampaigns().filter(c => c.id != campaign.id));
                    renderCampaigns();
                });
            });

            campaignList.appendChild(card);
        });
    };

    const openCreateModal = () => {
        modalTitle.textContent = "New Campaign";
        saveBtn.textContent = "Save Campaign";
        campaignForm.reset();
        document.getElementById('campaign-id').value = '';
        enemyOthersText.disabled = true;
        campaignModal.style.display = 'block';
    };

    const openEditModal = (id) => {
        const campaign = getCampaigns().find(c => c.id == id);
        if (!campaign) return;
        modalTitle.textContent = "Edit Campaign";
        saveBtn.textContent = "Update Campaign";
        document.getElementById('campaign-id').value = campaign.id;
        document.getElementById('campaign-name').value = campaign.name;
        document.getElementById('campaign-description').value = campaign.description;
        document.getElementById('difficulty').value = campaign.difficulty;

        // Reset all checkboxes first
        campaignForm.querySelectorAll('input[name="secrets"]').forEach(cb => cb.checked = false);
        campaignForm.querySelectorAll('input[name="enemy-types"]').forEach(cb => cb.checked = false);

        // Populate secrets
        campaign.secrets.forEach(secret => {
            const checkbox = campaignForm.querySelector(`input[name="secrets"][value="${secret}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Populate enemy types
        const standardEnemies = ['Undead', 'Monsters', 'Beasts', 'Celestial', 'Dragon', 'Mystics'];
        let otherEnemyFound = false;
        let otherEnemyValue = '';

        campaign.enemyTypes.forEach(enemy => {
            if (standardEnemies.includes(enemy)) {
                const checkbox = campaignForm.querySelector(`input[name="enemy-types"][value="${enemy}"]`);
                if (checkbox) checkbox.checked = true;
            } else {
                // This is an "Others" type enemy
                otherEnemyFound = true;
                otherEnemyValue = enemy;
            }
        });

        enemyOthersCheckbox.checked = otherEnemyFound || campaign.enemyTypes.includes('Others');
        enemyOthersText.disabled = !enemyOthersCheckbox.checked;
        enemyOthersText.value = otherEnemyValue;

        campaignModal.style.display = 'block';
    };

    const showCampaignDetail = (id) => {
        const campaign = getCampaigns().find(c => c.id == id);
        if (!campaign) return;
        document.getElementById('detail-name').textContent = campaign.name;
        document.getElementById('detail-description').textContent = campaign.description;
        document.getElementById('detail-enemies').textContent = campaign.enemyTypes.length ? campaign.enemyTypes.join(', ') : 'None specified';
        document.getElementById('detail-secrets').textContent = campaign.secrets.length ? campaign.secrets.join(', ') : 'None specified';
        const difficultySpan = document.getElementById('detail-difficulty');
        difficultySpan.textContent = campaign.difficulty;
        difficultySpan.className = `difficulty-tag difficulty-${campaign.difficulty}`;
        detailModal.style.display = 'block';
    };

    // --- Event Listeners ---
    if (openModalBtn) openModalBtn.addEventListener('click', openCreateModal);
    if (createModalClose) createModalClose.addEventListener('click', () => campaignModal.style.display = 'none');
    if (detailModalClose) detailModalClose.addEventListener('click', () => detailModal.style.display = 'none');
    
    // Close modals if overlay is clicked
    window.addEventListener('click', (e) => {
        if (e.target === campaignModal) campaignModal.style.display = 'none';
        if (e.target === detailModal) detailModal.style.display = 'none';
    });

    if (enemyOthersCheckbox) enemyOthersCheckbox.addEventListener('change', () => {
        enemyOthersText.disabled = !enemyOthersCheckbox.checked;
        if (!enemyOthersText.disabled) enemyOthersText.focus();
        else enemyOthersText.value = '';
    });

    if (campaignForm) campaignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('campaign-id').value;
        const campaigns = getCampaigns();
        let enemyTypes = Array.from(campaignForm.querySelectorAll('input[name="enemy-types"]:checked:not(#enemy-others-checkbox)')).map(cb => cb.value);
        if (enemyOthersCheckbox.checked) {
            const othersValue = enemyOthersText.value.trim();
            if (othersValue) enemyTypes.push(othersValue);
            else {
                // If "Others" is checked but text field is empty, still include "Others"
                enemyTypes.push('Others');
            }
        }
        const campaignData = {
            id: id || Date.now().toString(), // Ensure string ID for consistency
            name: document.getElementById('campaign-name').value,
            description: document.getElementById('campaign-description').value,
            enemyTypes: enemyTypes,
            secrets: Array.from(campaignForm.querySelectorAll('input[name="secrets"]:checked')).map(cb => cb.value),
            difficulty: document.getElementById('difficulty').value
        };

        // Basic validation for campaign name and description
        if (!campaignData.name.trim() || !campaignData.description.trim() || !campaignData.difficulty) {
            showConfirmationModal("Please fill in Campaign Name, Description, and select a Difficulty.", () => {}, true);
            return;
        }

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
                errorMessage = "Failed to save campaign: Browser security settings prevent storage (e.g., private browsing).";
            }
            showConfirmationModal(errorMessage, () => {}, true);
        }
    });

    // Initial Load
    renderCampaigns();
}
