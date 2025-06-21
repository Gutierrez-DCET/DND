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
    if (!localStorage.getItem('registeredUsers')) {
        localStorage.setItem('registeredUsers', JSON.stringify(defaultUsers));
    }

    // --- Modal Events ---
    signInBtn.addEventListener('click', () => {
        authTitle.textContent = 'Sign In';
        authSubmit.textContent = 'Sign In';
        authModal.style.display = 'block';
    });
    signUpBtn.addEventListener('click', () => {
        authTitle.textContent = 'Sign Up';
        authSubmit.textContent = 'Sign Up';
        authModal.style.display = 'block';
    });
    closeBtn.addEventListener('click', () => authModal.style.display = 'none');
    window.addEventListener('click', e => {
        if (e.target === authModal) authModal.style.display = 'none';
    });

    // --- Form Submission ---
    authForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = authForm.email.value;
        const password = authForm.password.value;
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

        if (authSubmit.textContent === 'Sign In') {
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert(`Welcome back, ${user.isAdmin ? 'Admin' : 'User'}: ${user.email}`);
                authModal.style.display = 'none';
                updateNavUI();
            } else {
                alert('Invalid email or password.');
            }
        } else { // Sign Up
            if (users.some(u => u.email === email)) {
                alert('Email already exists!');
            } else {
                const newUser = { email, password, isAdmin: false };
                users.push(newUser);
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                alert('Sign up successful!');
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
            navArea.innerHTML = `
                <button id="signInBtn">Sign In</button>
                <button id="signUpBtn">Sign Up</button>
            `;
            // Re-add event listeners since we replaced the HTML
            document.getElementById('signInBtn').addEventListener('click', () => initHomepage());
            document.getElementById('signUpBtn').addEventListener('click', () => initHomepage());
        }
    }

    // --- Initial Load ---
    updateNavUI();
}

// Global function, can be called from any page
function logoutUser() {
    localStorage.removeItem('currentUser');
    alert('Logged out!');
    location.reload();
}

// =================================================================
//                      CHARACTER PAGE LOGIC
// =================================================================
function initCharacterPage() {
    // --- Elements ---
    const characterForm = document.getElementById('character-form');
    const characterDisplay = document.getElementById('character-display');
    const resetButton = document.getElementById('reset-character-btn');
    const STORAGE_KEY = 'dndCharacterData';

    // --- Functions ---
    const displayCharacter = (data) => {
        if (!data) {
            characterDisplay.classList.add('hidden');
            return;
        }
        document.getElementById('display-name').textContent = data.name;
        document.getElementById('display-class').textContent = data.class;
        document.getElementById('display-race').textContent = data.race;
        document.getElementById('display-background').textContent = data.background;
        characterDisplay.classList.remove('hidden');
    };

    const populateForm = (data) => {
        if (!data) return;
        document.getElementById('character-name').value = data.name;
        document.getElementById('character-class').value = data.class;
        document.getElementById('character-race').value = data.race;
        document.getElementById('character-background').value = data.background;
    };

    // --- Event Listeners ---
    characterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const characterData = {
            name: document.getElementById('character-name').value,
            class: document.getElementById('character-class').value,
            race: document.getElementById('character-race').value,
            background: document.getElementById('character-background').value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(characterData));
        displayCharacter(characterData);
    });

    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this character?')) {
            localStorage.removeItem(STORAGE_KEY);
            characterForm.reset();
            characterDisplay.classList.add('hidden');
        }
    });

    // --- Initial Load ---
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (savedData) {
        displayCharacter(savedData);
        populateForm(savedData);
    }
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
                    <button class="edit-btn" title="Edit">✏️</button>
                    <button class="delete-btn" title="Delete">🗑️</button>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-actions')) showCampaignDetail(campaign.id);
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
        campaignForm.querySelectorAll('input[name="secrets"]').forEach(cb => cb.checked = campaign.secrets.includes(cb.value));
        const standardEnemies = ['Undead', 'Monsters', 'Beasts', 'Celestial', 'Dragon', 'Mystics', 'Others'];
        const otherEnemy = campaign.enemyTypes.find(e => !standardEnemies.includes(e));
        campaignForm.querySelectorAll('input[name="enemy-types"]').forEach(cb => cb.checked = campaign.enemyTypes.includes(cb.value));
        enemyOthersCheckbox.checked = !!otherEnemy || campaign.enemyTypes.includes('Others');
        enemyOthersText.disabled = !enemyOthersCheckbox.checked;
        enemyOthersText.value = otherEnemy || '';
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
    openModalBtn.addEventListener('click', openCreateModal);
    createModalClose.addEventListener('click', () => campaignModal.style.display = 'none');
    detailModalClose.addEventListener('click', () => detailModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === campaignModal) campaignModal.style.display = 'none';
        if (e.target === detailModal) detailModal.style.display = 'none';
    });

    enemyOthersCheckbox.addEventListener('change', () => {
        enemyOthersText.disabled = !enemyOthersCheckbox.checked;
        if (!enemyOthersText.disabled) enemyOthersText.focus();
        else enemyOthersText.value = '';
    });

    campaignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('campaign-id').value;
        const campaigns = getCampaigns();
        let enemyTypes = Array.from(campaignForm.querySelectorAll('input[name="enemy-types"]:checked:not(#enemy-others-checkbox)')).map(cb => cb.value);
        if (enemyOthersCheckbox.checked) {
            if (enemyOthersText.value) enemyTypes.push(enemyOthersText.value.trim());
            else enemyTypes.push('Others');
        }
        const campaignData = {
            id: id || Date.now(),
            name: document.getElementById('campaign-name').value,
            description: document.getElementById('campaign-description').value,
            enemyTypes: enemyTypes,
            secrets: Array.from(campaignForm.querySelectorAll('input[name="secrets"]:checked')).map(cb => cb.value),
            difficulty: document.getElementById('difficulty').value
        };
        if (id) {
            const index = campaigns.findIndex(c => c.id == id);
            campaigns[index] = campaignData;
        } else {
            campaigns.push(campaignData);
        }
        saveCampaigns(campaigns);
        renderCampaigns();
        campaignModal.style.display = 'none';
    });

    campaignList.addEventListener('click', (e) => {
        const card = e.target.closest('.campaign-card');
        if (!card) return;
        const id = card.dataset.id;
        if (e.target.matches('.delete-btn, .delete-btn *')) {
            if (confirm('Are you sure you want to delete this campaign?')) {
                saveCampaigns(getCampaigns().filter(c => c.id != id));
                renderCampaigns();
            }
        } else if (e.target.matches('.edit-btn, .edit-btn *')) {
            openEditModal(id);
        }
    });

    // --- Initial Load ---
    renderCampaigns();
}