// Modal open/close handlers for Create modal
const openCreateModalBtn = document.getElementById('openModalBtn');
const createModal = document.getElementById('campaignModal');
const createModalClose = document.getElementById('createModalClose');

openCreateModalBtn.onclick = () => {
  createModal.style.display = 'block';
};

createModalClose.onclick = () => {
  createModal.style.display = 'none';
};

// Modal open/close handlers for Detail modal
const detailModal = document.getElementById('detailModal');
const detailModalClose = document.getElementById('detailModalClose');

detailModalClose.onclick = () => {
  detailModal.style.display = 'none';
};

// Close modals if clicking outside modal content
window.onclick = (event) => {
  if (event.target === createModal) createModal.style.display = 'none';
  if (event.target === detailModal) detailModal.style.display = 'none';
};

// Enable/disable "Others" text input based on checkbox
const enemyOthersCheckbox = document.getElementById('enemy-others-checkbox');
const enemyOthersText = document.getElementById('enemy-others-text');

enemyOthersCheckbox.addEventListener('change', () => {
  enemyOthersText.disabled = !enemyOthersCheckbox.checked;
  if (!enemyOthersCheckbox.checked) {
    enemyOthersText.value = '';
  }
});

// Handle campaign form submission
const campaignForm = document.getElementById('campaign-form');
const campaignList = document.getElementById('campaign-list');

campaignForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const form = e.target;

  // Get form values
  const name = form['campaign-name'].value.trim();
  const description = form['campaign-description'].value.trim();

  // Enemy types
  const enemyTypes = [];
  form.querySelectorAll('input[name="enemy-types"]:checked').forEach((cb) => {
    if (cb.value !== 'Others') enemyTypes.push(cb.value);
  });
  if (!enemyOthersText.disabled && enemyOthersText.value.trim()) {
    enemyTypes.push(enemyOthersText.value.trim());
  }

  // Secrets
  const secrets = [];
  form.querySelectorAll('input[name="secrets"]:checked').forEach((cb) => {
    secrets.push(cb.value);
  });

  // Difficulty
  const difficulty = form['difficulty'].value;

  // Create a campaign object
  const campaign = {
    name,
    description,
    enemyTypes,
    secrets,
    difficulty,
  };

  // Add campaign card to list
  addCampaignCard(campaign);

  // Close the create modal
  createModal.style.display = 'none';

  // Reset form and disable others text input
  form.reset();
  enemyOthersText.disabled = true;
});

function addCampaignCard(campaign) {
  // Create card container
  const card = document.createElement('div');
  card.className = 'campaign-card';
  card.tabIndex = 0; // make card focusable

  // Fill card content: name + difficulty
  card.innerHTML = `
    <h3>${campaign.name}</h3>
    <div class="difficulty">Difficulty: ${campaign.difficulty}</div>
  `;

  // On click, show detail modal with full campaign info
  card.addEventListener('click', () => showCampaignDetail(campaign));

  // Also allow keyboard Enter key to open details for accessibility
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showCampaignDetail(campaign);
    }
  });

  campaignList.appendChild(card);
}

function showCampaignDetail(campaign) {
  document.getElementById('detail-name').textContent = campaign.name;
  document.getElementById('detail-description').textContent = campaign.description;
  document.getElementById('detail-enemies').textContent = campaign.enemyTypes.length
    ? campaign.enemyTypes.join(', ')
    : 'None';
  document.getElementById('detail-secrets').textContent = campaign.secrets.length
    ? campaign.secrets.join(', ')
    : 'None';
  document.getElementById('detail-difficulty').textContent = campaign.difficulty;

  detailModal.style.display = 'block';
}
