document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References for Character Creation
    const characterForm = document.getElementById('character-form');
    const characterDisplay = document.getElementById('character-display');
    const resetButton = document.getElementById('reset-character-btn');

    // DOM Element References for Campaign Modal
    const addCampaignBtn = document.getElementById('add-campaign-btn');
    const campaignModal = document.getElementById('campaign-modal');
    const closeButton = document.querySelector('.modal .close-button');
    const newCampaignForm = document.getElementById('new-campaign-form');
    const campaignList = document.getElementById('campaign-list'); // To display created campaigns

    // Keys for localStorage
    const CHARACTER_STORAGE_KEY = 'dndCharacterData';
    const CAMPAIGN_STORAGE_KEY = 'dndCampaignsData'; // New key for campaigns

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

    // Function to populate the form with existing character data
    const populateForm = (data) => {
        if (!data) return;
        document.getElementById('character-name').value = data.name;
        document.getElementById('character-class').value = data.class;
        document.getElementById('character-race').value = data.race;
        document.getElementById('character-background').value = data.background;
    };

    // Function to display campaigns
    const displayCampaigns = () => {
        campaignList.innerHTML = ''; // Clear existing campaigns
        const campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY)) || [];
        
        if (campaigns.length === 0) {
            campaignList.innerHTML = '<p>No campaigns created yet. Click "Add New Campaign" to start!</p>';
            return;
        }

        campaigns.forEach((campaign, index) => {
            const campaignCard = document.createElement('div');
            campaignCard.classList.add('campaign-card'); // Add a class for styling

            campaignCard.innerHTML = `
                <h3>${campaign.name}</h3>
                <p><strong>Status:</strong> <span class="status-${campaign.status.toLowerCase().replace(/\s/g, '-')}">${campaign.status}</span></p>
                <p><strong>Difficulty:</strong> <span class="difficulty-${campaign.difficulty.toLowerCase()}">${campaign.difficulty}</span></p>
                <button class="edit-campaign-btn" data-index="${index}"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-campaign-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            `;
            campaignList.appendChild(campaignCard);
        });

        // Add event listeners for edit and delete buttons on newly created campaign cards
        document.querySelectorAll('.edit-campaign-btn').forEach(button => {
            button.addEventListener('click', (event) => editCampaign(event.target.dataset.index));
        });
        document.querySelectorAll('.delete-campaign-btn').forEach(button => {
            button.addEventListener('click', (event) => deleteCampaign(event.target.dataset.index));
        });
    };

    // Function to save a new campaign
    const saveCampaign = (campaignData) => {
        let campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY)) || [];
        campaigns.push(campaignData);
        localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaigns));
        displayCampaigns(); // Re-render campaigns after saving
    };

    // Function to edit a campaign (basic implementation - could open modal with pre-filled data)
    const editCampaign = (index) => {
        let campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY));
        if (campaigns && campaigns[index]) {
            // For now, let's just log and you can expand this to open the modal
            console.log('Editing campaign:', campaigns[index]);
            alert(`Editing campaign: ${campaigns[index].name}. (Functionality to open modal with pre-filled data not fully implemented yet.)`);
            // In a full implementation, you would populate the modal form with campaigns[index]
            // and change the form submission to update instead of add.
        }
    };

    // Function to delete a campaign
    const deleteCampaign = (index) => {
        if (confirm('Are you sure you want to delete this campaign?')) {
            let campaigns = JSON.parse(localStorage.getItem(CAMPAIGN_STORAGE_KEY));
            if (campaigns && campaigns[index]) {
                campaigns.splice(index, 1); // Remove the campaign at the given index
                localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaigns));
                displayCampaigns(); // Re-render campaigns after deletion
            }
        }
    };


    // --- Event Listeners ---

    // 1. Handle Character Form Submission
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
        localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(characterData));

        // Display the new character data
        displayCharacter(characterData);
    });

    // 2. Handle Character Reset
    resetButton.addEventListener('click', () => {
        // Confirmation dialog
        if (confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
            // Remove from localStorage
            localStorage.removeItem(CHARACTER_STORAGE_KEY);

            // Reset the form fields
            characterForm.reset();

            // Hide the character display card
            characterDisplay.classList.add('hidden');
        }
    });

    // 3. Handle "Add New Campaign" button click (to open modal)
    addCampaignBtn.addEventListener('click', () => {
        campaignModal.classList.remove('hidden');
    });

    // 4. Handle modal close button click
    closeButton.addEventListener('click', () => {
        campaignModal.classList.add('hidden');
        newCampaignForm.reset(); // Optionally reset the form when closing
    });

    // 5. Handle clicks outside the modal content to close it
    window.addEventListener('click', (event) => {
        if (event.target === campaignModal) {
            campaignModal.classList.add('hidden');
            newCampaignForm.reset(); // Optionally reset the form when closing
        }
    });

    // 6. Handle New Campaign Form Submission
    newCampaignForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const campaignData = {
            name: document.getElementById('campaign-name').value,
            status: document.getElementById('campaign-status').value,
            difficulty: document.getElementById('campaign-difficulty').value
        };

        saveCampaign(campaignData);
        campaignModal.classList.add('hidden'); // Hide modal after submission
        newCampaignForm.reset(); // Reset form fields
    });


    // --- Initial Page Load ---

    // Check for saved character data when the page loads
    const savedCharacterDataJSON = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (savedCharacterDataJSON) {
        const savedCharacterData = JSON.parse(savedCharacterDataJSON);
        // If data exists, display it and populate the form for editing
        displayCharacter(savedCharacterData);
        populateForm(savedCharacterData);
    }

    // Load and display campaigns on page load
    displayCampaigns();
});
