// Ensure Firebase modules are globally available from the DNDcharacter.html script
// This script will only run after Firebase is initialized in the HTML.
const db = window.firestoreDb;
const auth = window.firebaseAuth;
const appId = window.appId; // Get the appId from the global scope
let currentUserId = window.currentUserId; // Initial user ID from window global

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

    // --- Utility Functions ---

    /**
     * Shows the custom confirmation modal.
     * @param {string} message - The message to display in the modal.
     * @param {Function} onConfirm - The callback function to execute if 'Yes' is clicked.
     */
    const showConfirmationModal = (message, onConfirm) => {
        confirmationMessage.textContent = message;
        confirmAction = onConfirm; // Store the action to be performed
        confirmationModal.classList.remove('hidden');
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

    // --- Firestore Operations ---

    /**
     * Gets the Firestore collection reference for characters for the current user.
     * @returns {import('firebase/firestore').CollectionReference} - The collection reference.
     */
    const getCharactersCollection = () => {
        // Use the currentUserId obtained from Firebase auth.
        // If currentUserId is still null (e.g., auth not ready), use a fallback or handle error.
        // For this app, we ensure script.js only loads after auth is ready, so currentUserId should be set.
        if (!currentUserId) {
            console.error("User ID is not available. Cannot get Firestore collection.");
            // Generate a random ID if auth somehow fails, but ideally, this shouldn't happen.
            currentUserId = auth.currentUser?.uid || crypto.randomUUID();
            console.warn("Using a fallback user ID:", currentUserId);
        }
        // Public data: /artifacts/{appId}/public/data/characters
        return collection(db, `artifacts/${appId}/public/data/characters`);
    };

    /**
     * Saves a character to Firestore (adds new or updates existing).
     * @param {Object} characterData - The character data to save.
     * @param {string|null} characterId - The ID of the character if updating, null if new.
     */
    const saveCharacter = async (characterData, characterId = null) => {
        try {
            const charactersCollection = getCharactersCollection();
            if (characterId) {
                // Update existing character
                const charDocRef = doc(charactersCollection, characterId);
                await updateDoc(charDocRef, characterData);
                console.log("Character updated with ID:", characterId);
            } else {
                // Add new character
                const docRef = await addDoc(charactersCollection, characterData);
                console.log("New character added with ID:", docRef.id);
            }
            closeCharacterModal(); // Close modal after successful save
        } catch (e) {
            console.error("Error saving character: ", e);
            // In a real app, you might show a user-friendly error message here
            alert("Failed to save character. Please try again."); // Using alert for simplicity, but a custom modal is better.
        }
    };

    /**
     * Deletes a character from Firestore.
     * @param {string} characterId - The ID of the character to delete.
     */
    const deleteCharacter = async (characterId) => {
        try {
            const charactersCollection = getCharactersCollection();
            await deleteDoc(doc(charactersCollection, characterId));
            console.log("Character deleted with ID:", characterId);
        } catch (e) {
            console.error("Error deleting character: ", e);
            alert("Failed to delete character. Please try again."); // Using alert for simplicity, but a custom modal is better.
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
     * Fetches and displays all characters from Firestore in real-time.
     */
    const loadCharacters = () => {
        if (!db || !currentUserId) {
            console.warn("Firestore or User ID not available yet. Skipping character load.");
            noCharactersMessage.classList.remove('hidden'); // Show message if characters can't load
            return;
        }

        const charactersCollection = getCharactersCollection();

        // Use onSnapshot for real-time updates
        onSnapshot(charactersCollection, (snapshot) => {
            characterListDiv.innerHTML = ''; // Clear current list

            if (snapshot.empty) {
                noCharactersMessage.classList.remove('hidden');
            } else {
                noCharactersMessage.classList.add('hidden');
                snapshot.forEach((doc) => {
                    const character = { id: doc.id, ...doc.data() };
                    const card = renderCharacterCard(character);
                    characterListDiv.appendChild(card);
                });
            }
        }, (error) => {
            console.error("Error fetching characters:", error);
            characterListDiv.innerHTML = '<p style="color: red;">Error loading characters. Please refresh the page.</p>';
            noCharactersMessage.classList.add('hidden'); // Hide empty message if there was an error
        });
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
            // Add a timestamp for ordering, useful for "last modified" or creation order
            timestamp: new Date().toISOString()
        };

        saveCharacter(characterData, characterId);
    });

    // Confirmation modal button listeners
    confirmYesBtn.addEventListener('click', () => {
        if (confirmAction) {
            confirmAction(); // Execute the stored action
        }
    });

    confirmNoBtn.addEventListener('click', hideConfirmationModal);

    // Initial load: Ensure characters are loaded once Firebase is ready
    // The `onAuthStateChanged` listener in DNDcharacter.html ensures this script loads
    // only when Firebase is initialized and authenticated, so we can directly call loadCharacters here.
    if (db && currentUserId) {
        loadCharacters();
    } else {
        // Fallback for development if loaded directly without the main HTML's Firebase setup
        console.warn("script.js loaded before Firebase was fully ready. Will attempt to load characters once Firebase globals are available.");
        // You might set up a polling or a custom event listener here in a more complex setup
        // For this example, the DNDcharacter.html ensures the proper loading order.
    }
});
