document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const openModalBtn = document.getElementById('open-character-modal-btn');
    const closeModalBtn = document.getElementById('close-character-modal-btn');
    const characterModal = document.getElementById('character-modal');
    const characterForm = document.getElementById('character-form');
    const characterListDiv = document.getElementById('character-list');
    const modalTitle = document.getElementById('modal-title');
    const characterIdInput = document.getElementById('character-id');
    const noCharactersMessage = document.getElementById('no-characters-message');

    // Custom Confirmation Modal Elements
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    let confirmAction = null; // Stores the function to execute on 'Yes'

    // Key for localStorage
    const STORAGE_KEY = 'dndCharacters'; // Changed to store multiple characters

    // --- Utility Functions ---

    /**
     * Shows the custom confirmation modal.
     * @param {string} message - The message to display in the modal.
     * @param {Function} onConfirm - The callback function to execute if 'Yes' is clicked.
     * @param {boolean} isError - If true, style the modal for an error message.
     */
    const showConfirmationModal = (message, onConfirm, isError = false) => {
        confirmationMessage.textContent = message;
        confirmAction = onConfirm; // Store the action to be performed
        confirmationModal.classList.remove('hidden');

        // Adjust modal buttons for error messages (only 'OK' button)
        if (isError) {
            confirmYesBtn.textContent = 'OK';
            confirmNoBtn.classList.add('hidden'); // Hide 'No' button
            confirmYesBtn.removeEventListener('click', confirmAction); // Remove previous listener
            confirmYesBtn.addEventListener('click', hideConfirmationModal); // Make 'OK' close it
        } else {
            confirmYesBtn.textContent = 'Yes';
            confirmNoBtn.classList.remove('hidden'); // Show 'No' button
            // Re-attach original listeners, ensuring no duplicates if already there
            confirmYesBtn.removeEventListener('click', hideConfirmationModal); // Remove 'OK' behavior if it was there
            confirmYesBtn.addEventListener('click', () => { // Re-add 'Yes' behavior
                if (confirmAction) {
                    confirmAction();
                }
            }, { once: true }); // Use { once: true } to prevent multiple attachments
        }
    };


    /**
     * Hides the custom confirmation modal.
     */
    const hideConfirmationModal = () => {
        confirmationModal.classList.add('hidden');
        confirmAction = null; // Clear the action
    };

    // --- Modal Functions ---

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
            showConfirmationModal("Error loading characters. Your browser's storage might be full or blocked.", () => {}, true);
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
            let characters = getCharactersFromLocalStorage();

            if (characterId) {
                // Update existing character
                const index = characters.findIndex(char => char.id === characterId);
                if (index !== -1) {
                    characters[index] = { ...characterData, id: characterId }; // Preserve existing ID
                }
            } else {
                // Add new character with a unique ID
                characterData.id = Date.now().toString(); // Simple unique ID
                characters.push(characterData);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
            closeCharacterModal(); // Close modal after successful save
            loadCharacters(); // Reload characters to update the display
        } catch (e) {
            console.error("Error saving character to localStorage:", e);
            showConfirmationModal("Failed to save character. Your browser's storage might be full or blocked.", () => {}, true);
        }
    };

    /**
     * Deletes a character from localStorage.
     * @param {string} characterId - The ID of the character to delete.
     */
    const deleteCharacter = (characterId) => {
        try {
            let characters = getCharactersFromLocalStorage();
            characters = characters.filter(char => char.id !== characterId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
            loadCharacters(); // Reload characters to update the display
        } catch (e) {
            console.error("Error deleting character from localStorage:", e);
            showConfirmationModal("Failed to delete character.", () => {}, true);
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
                hideConfirmationModal(); // Hide modal after action
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
            // Sort characters by timestamp if you added one, or just display as is
            // characters.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Uncomment if using timestamp for sorting
            characters.forEach((character) => {
                const card = renderCharacterCard(character);
                characterListDiv.appendChild(card);
            });
        }
    };

    // --- Event Listeners ---

    // Open Modal button
    openModalBtn.addEventListener('click', () => openCharacterModal());

    // Close Modal button
    closeModalBtn.addEventListener('click', closeCharacterModal);

    // Close modal if overlay is clicked (but not the content itself)
    characterModal.addEventListener('click', (event) => {
        if (event.target === characterModal) {
            closeCharacterModal();
        }
    });

    // Handle form submission (Create/Update character)
    characterForm.addEventListener('submit', (event) => {
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

        saveCharacter(characterData, characterId);
    });

    // Confirmation modal button listeners
    // These listeners are now dynamically managed within showConfirmationModal
    // but we keep the initial setup for clarity and default behavior.
    confirmYesBtn.addEventListener('click', () => {
        // This listener will be overridden or triggered based on showConfirmationModal's state
        if (confirmAction && !confirmNoBtn.classList.contains('hidden')) { // Only act if it's a 'Yes/No' context
             confirmAction();
        }
    });

    confirmNoBtn.addEventListener('click', hideConfirmationModal);


    // Initial load of characters when the page loads
    loadCharacters();
});
