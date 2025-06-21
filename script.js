document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const characterForm = document.getElementById('character-form');
    const characterDisplay = document.getElementById('character-display');
    const resetButton = document.getElementById('reset-character-btn');

    // Key for localStorage
    const STORAGE_KEY = 'dndCharacterData';

    // Function to display character data on the page
    const displayCharacter = (data) => {
        if (!data) {
            characterDisplay.classList.add('hidden');
            return;
        }
        
        document.getElementById('display-name').textContent = data.name;
        document.getElementById('display-class').textContent = data.class;
        document.getElementById('display-race').textContent = data.race;
        document.getElementById('display-background').textContent = data.background;

        // Show the display card
        characterDisplay.classList.remove('hidden');
    };

    // Function to populate the form with existing data
    const populateForm = (data) => {
        if (!data) return;
        document.getElementById('character-name').value = data.name;
        document.getElementById('character-class').value = data.class;
        document.getElementById('character-race').value = data.race;
        document.getElementById('character-background').value = data.background;
    };

    // --- Event Listeners ---

    // 1. Handle Form Submission
    characterForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Create a character object from form values
        const characterData = {
            name: document.getElementById('character-name').value,
            class: document.getElementById('character-class').value,
            race: document.getElementById('character-race').value,
            background: document.getElementById('character-background').value
        };

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(characterData));

        // Display the new character data
        displayCharacter(characterData);
    });

    // 2. Handle Character Reset
    resetButton.addEventListener('click', () => {
        // Confirmation dialog
        if (confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
            // Remove from localStorage
            localStorage.removeItem(STORAGE_KEY);

            // Reset the form fields
            characterForm.reset();

            // Hide the character display card
            characterDisplay.classList.add('hidden');
        }
    });


    // --- Initial Page Load ---

    // Check for saved data when the page loads
    const savedDataJSON = localStorage.getItem(STORAGE_KEY);
    if (savedDataJSON) {
        const savedData = JSON.parse(savedDataJSON);
        // If data exists, display it and populate the form for editing
        displayCharacter(savedData);
        populateForm(savedData);
    }
});