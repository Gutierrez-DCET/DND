// ===== Character Form Logic =====
document.getElementById('character-form')?.addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('character-name').value;
    const charClass = document.getElementById('character-class').value;
    const charRace = document.getElementById('character-race').value;
    const background = document.getElementById('character-background').value;

    document.getElementById('display-name').textContent = `Name: ${name}`;
    document.getElementById('display-class').textContent = `Class: ${charClass}`;
    document.getElementById('display-race').textContent = `Race: ${charRace}`;
    document.getElementById('display-background').textContent = `Background: ${background}`;
});

// ===== Auto-Resizing Description Box =====
const descriptionBox = document.getElementById('campaign-description');
if (descriptionBox) {
    descriptionBox.addEventListener('input', () => {
        descriptionBox.style.height = 'auto';
        descriptionBox.style.height = descriptionBox.scrollHeight + 'px';
    });
}

// ===== Predefined Users =====
const defaultUsers = [
    { email: 'admin@example.com', password: 'admin123', isAdmin: true },
    { email: 'user@example.com', password: 'user123', isAdmin: false }
];
if (!localStorage.getItem('registeredUsers')) {
    localStorage.setItem('registeredUsers', JSON.stringify(defaultUsers));
}

// ===== Authentication Modal Logic =====
const authModal = document.getElementById('authModal');
const authTitle = document.getElementById('authTitle');
const authForm = document.getElementById('authForm');
const authSubmit = document.getElementById('authSubmit');
const closeBtn = document.querySelector('.modal .close');
const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');

// Open modals
signInBtn?.addEventListener('click', () => {
    authTitle.textContent = 'Sign In';
    authSubmit.textContent = 'Sign In';
    authModal.style.display = 'block';
});
signUpBtn?.addEventListener('click', () => {
    authTitle.textContent = 'Sign Up';
    authSubmit.textContent = 'Sign Up';
    authModal.style.display = 'block';
});
closeBtn?.addEventListener('click', () => authModal.style.display = 'none');
window.addEventListener('click', e => {
    if (e.target === authModal) authModal.style.display = 'none';
});

// Auth submit logic
authForm?.addEventListener('submit', e => {
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
    } else {
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

// Update UI on login
function updateNavUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const navArea = document.getElementById('user-status');

    if (user && navArea) {
        navArea.innerHTML = `
            Logged in as ${user.email} (${user.isAdmin ? 'Admin' : 'User'}) 
            <button onclick="logoutUser()">Logout</button>
        `;
    }
}

// Logout
function logoutUser() {
    localStorage.removeItem('currentUser');
    alert('Logged out!');
    location.reload();
}

// Auto-update nav on load
window.onload = () => {
    updateNavUI();
};

// Forgot Password Logic
document.querySelector('.forgot-password')?.addEventListener('click', () => {
    const email = prompt("Enter your registered email:");

    if (!email) return;

    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    const user = users.find(u => u.email === email);

    if (user) {
        alert(`Your password is: ${user.password}`);
    } else {
        alert('No account found with that email.');
    }
});