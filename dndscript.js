// dndscript.js

// Global variables for Firebase config, provided by the environment
// Ensure these are accessed safely, as they might not be defined outside the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase modules will be globally available because they are imported via script tags in index.html
// e.g., firebase.initializeApp, firebase.auth.getAuth, firebase.firestore.getFirestore etc.

let app;
let auth;
let db;
let userId = null; // To store the current user ID
let isAuthReady = false; // Flag to indicate if auth state has been checked

// Function to show a custom message box instead of alert() or prompt()
function showMessageBox(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'custom-message-box';
    messageBox.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
            <button class="close-message-box">OK</button>
        </div>
    `;
    document.body.appendChild(messageBox);

    messageBox.querySelector('.close-message-box').addEventListener('click', () => {
        document.body.removeChild(messageBox);
    });
}

// Initialize Firebase when the window loads
window.onload = async function() {
    try {
        // Ensure Firebase modules are loaded before use
        if (typeof firebase === 'undefined' || typeof firebase.initializeApp === 'undefined') {
            console.error("Firebase SDK not loaded. Check script imports in index.html.");
            showMessageBox("Error: Firebase SDK not loaded. Please try again.");
            return;
        }

        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth.getAuth(app);
        db = firebase.firestore.getFirestore(app);

        // Listen for authentication state changes
        firebase.auth.onAuthStateChanged(auth, async (user) => {
            isAuthReady = true; // Auth state has been checked
            const userStatusDiv = document.getElementById('user-status');
            
            // Clear existing buttons to avoid duplicates during state changes
            userStatusDiv.innerHTML = '';

            if (user) {
                userId = user.uid; // Set userId if logged in
                // Truncate user ID for display if it's too long
                const displayUserId = user.uid.length > 8 ? user.uid.substring(0, 8) + '...' : user.uid;
                userStatusDiv.innerHTML = `<span class="user-id-display">Logged in: ${displayUserId}</span><button id="signOutBtn">Sign Out</button>`;
                document.getElementById('signOutBtn').addEventListener('click', handleSignOut);
            } else {
                userId = null; // Clear userId if logged out
                userStatusDiv.innerHTML = `
                    <button id="signInBtn">Sign In</button>
                    <button id="signUpBtn">Sign Up</button>
                `;
                // Re-attach listeners for sign-in/sign-up buttons after they are re-added to DOM
                document.getElementById('signInBtn').addEventListener('click', () => openAuthModal('signIn'));
                document.getElementById('signUpBtn').addEventListener('click', () => openAuthModal('signUp'));
                
                // If an initial token is provided by the environment, try to sign in with it
                // This ensures Canvas environment's auth is prioritized
                if (initialAuthToken) {
                    try {
                        await firebase.auth.signInWithCustomToken(auth, initialAuthToken);
                        console.log("Signed in with custom token from environment.");
                    } catch (error) {
                        console.error("Error signing in with custom token:", error);
                        // Fallback to anonymous if custom token fails
                        await firebase.auth.signInAnonymously(auth);
                        console.log("Signed in anonymously as fallback.");
                    }
                } else {
                    // Sign in anonymously if no initialAuthToken is provided at all
                    await firebase.auth.signInAnonymously(auth);
                    console.log("Signed in anonymously as no custom token was provided.");
                }
            }
        });

        // Setup modal event listeners
        setupAuthModalListeners();
        // Setup comment submission after Firebase and initial auth state are likely ready
        setupCommentSubmission();
        
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showMessageBox("Failed to initialize the app. Please try again later.");
    }
};

// Modal and Auth functions
const authModal = document.getElementById('authModal');
const closeButton = authModal.querySelector('.close');
const authTitle = document.getElementById('authTitle');
const authForm = document.getElementById('authForm');
const authSubmit = document.getElementById('authSubmit');

let isSignInMode = true; // true for Sign In, false for Sign Up

function openAuthModal(mode) {
    if (mode === 'signIn') {
        authTitle.textContent = 'Sign In';
        authSubmit.textContent = 'Sign In';
        isSignInMode = true;
    } else {
        authTitle.textContent = 'Sign Up';
        authSubmit.textContent = 'Sign Up';
        isSignInMode = false;
    }
    authModal.style.display = 'block';
}

function closeAuthModal() {
    authModal.style.display = 'none';
    authForm.reset(); // Clear form fields
}

function setupAuthModalListeners() {
    // These listeners are initially attached to buttons that might be replaced.
    // They are re-attached in onAuthStateChanged for robustness.
    // For now, keep these for initial load.
    document.getElementById('signInBtn')?.addEventListener('click', () => openAuthModal('signIn'));
    document.getElementById('signUpBtn')?.addEventListener('click', () => openAuthModal('signUp'));
    
    closeButton.addEventListener('click', closeAuthModal);
    window.addEventListener('click', (event) => {
        if (event.target === authModal) {
            closeAuthModal();
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authForm.elements.email.value;
        const password = authForm.elements.password.value;

        try {
            if (isSignInMode) {
                // Sign In
                await firebase.auth.signInWithEmailAndPassword(auth, email, password);
                showMessageBox("Signed in successfully!");
            } else {
                // Sign Up
                await firebase.auth.createUserWithEmailAndPassword(auth, email, password);
                showMessageBox("Account created and signed in!");
            }
            closeAuthModal();
        } catch (error) {
            console.error("Authentication error:", error);
            let errorMessage = "An error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already in use.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password should be at least 6 characters.";
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            }
            showMessageBox(errorMessage);
        }
    });
}

async function handleSignOut() {
    try {
        await firebase.auth.signOut(auth);
        showMessageBox("Signed out successfully!");
    } catch (error) {
        console.error("Error signing out:", error);
        showMessageBox("Failed to sign out. Please try again.");
    }
}


// ===== Character Form Logic =====
// Retained from original dndscript.js for character creation functionality
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
// Retained from original dndscript.js for campaign description
const descriptionBox = document.getElementById('campaign-description');
if (descriptionBox) {
    descriptionBox.addEventListener('input', () => {
        descriptionBox.style.height = 'auto';
        descriptionBox.style.height = descriptionBox.scrollHeight + 'px';
    });
}

// ===== Forgot Password Logic =====
// Retained from original dndscript.js, but using showMessageBox
document.querySelector('.forgot-password')?.addEventListener('click', async () => {
    // This prompt needs to be replaced by a custom modal for consistent UI
    // For now, using a simple prompt for demonstration purposes.
    const email = await new Promise(resolve => {
        const inputPromptBox = document.createElement('div');
        inputPromptBox.className = 'custom-message-box';
        inputPromptBox.innerHTML = `
            <div class="message-content">
                <p>Enter your registered email:</p>
                <input type="email" id="promptEmailInput" placeholder="Email" style="width: 80%; padding: 8px; margin-bottom: 15px; border-radius: 5px; border: 1px solid #555; background-color: #1e1e2f; color: #eee;">
                <button id="promptSubmitBtn">Submit</button>
            </div>
        `;
        document.body.appendChild(inputPromptBox);

        inputPromptBox.querySelector('#promptSubmitBtn').addEventListener('click', () => {
            const emailValue = inputPromptBox.querySelector('#promptEmailInput').value;
            document.body.removeChild(inputPromptBox);
            resolve(emailValue);
        });
    });

    if (!email) {
        showMessageBox("Email not entered.");
        return;
    }

    try {
        // Firebase Auth's sendPasswordResetEmail function
        await firebase.auth.sendPasswordResetEmail(auth, email);
        showMessageBox("If an account with that email exists, a password reset link has been sent.");
    } catch (error) {
        console.error("Error sending password reset email:", error);
        let errorMessage = "Could not send password reset email. Please check the email address.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "No account found with that email address.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        }
        showMessageBox(errorMessage);
    }
});

// Assuming these elements exist in DNDcampaign.html if applicable
const enemyOthersCheckbox = document.getElementById('enemy-others-checkbox');
const enemyOthersText = document.getElementById('enemy-others-text');

if (enemyOthersCheckbox && enemyOthersText) {
    enemyOthersCheckbox.addEventListener('change', () => {
      enemyOthersText.disabled = !enemyOthersCheckbox.checked;
      if (!enemyOthersCheckbox.checked) {
        enemyOthersText.value = '';
      }
    });
}


// === Comment Submission Logic ===
function setupCommentSubmission() {
    const commentTextarea = document.querySelector('.comments-section textarea');
    const submitCommentButton = document.querySelector('.comments-section button');

    if (submitCommentButton) {
        submitCommentButton.addEventListener('click', async () => {
            const comment = commentTextarea.value.trim();

            if (!comment) {
                showMessageBox("Please enter a comment before submitting.");
                return;
            }

            // Ensure Firebase auth state is ready before proceeding
            if (!isAuthReady) {
                showMessageBox("App is still initializing. Please wait a moment and try again.");
                return;
            }

            // Check if user is signed in with a non-anonymous account
            if (auth.currentUser && !auth.currentUser.isAnonymous) {
                const userEmail = auth.currentUser.email || "N/A (Email not provided by provider)";
                const userIdVal = auth.currentUser.uid;

                console.log(`User ${userEmail} (${userIdVal}) is attempting to submit a comment.`);

                // **STEP 1: Store comment in Firestore**
                // Comments will be stored in a public collection under the app's artifacts
                try {
                    const commentsCollectionRef = firebase.firestore.collection(db, `artifacts/${appId}/public/data/comments`);
                    await firebase.firestore.addDoc(commentsCollectionRef, {
                        userId: userIdVal,
                        userEmail: userEmail,
                        comment: comment,
                        timestamp: firebase.firestore.serverTimestamp() // Use server timestamp for consistency
                    });
                    console.log("Comment stored in Firestore.");
                    showMessageBox("Comment submitted successfully!");
                    commentTextarea.value = ''; // Clear the textarea

                    // **STEP 2: Trigger backend function to send email (conceptual)**
                    // IMPORTANT: Sending emails directly from client-side JavaScript is not secure or feasible.
                    // To send this comment to your email (wyclef.janssey.gutierrez@gmail.com),
                    // you would typically integrate with a backend service.
                    //
                    // A common approach is to use Firebase Cloud Functions.
                    // 1. A Cloud Function could be triggered when a new document is added to the 'comments' collection in Firestore.
                    // 2. This Cloud Function would then use a third-party email service (like SendGrid, Nodemailer, Mailgun, etc.)
                    //    to send an email containing the comment details to wyclef.janssey.gutierrez@gmail.com.
                    //
                    // Example (pseudocode for a Cloud Function - NOT client-side JS):
                    /*
                    const functions = require('firebase-functions');
                    const admin = require('firebase-admin');
                    const nodemailer = require('nodemailer'); // or SendGrid/other email service SDK

                    // Initialize Firebase Admin SDK if not already done
                    admin.initializeApp();

                    // Configure the email transport (e.g., using Gmail with Nodemailer)
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: functions.config().gmail.email, // Stored in Firebase config
                            pass: functions.config().gmail.password // Stored in Firebase config
                        }
                    });

                    exports.sendCommentEmail = functions.firestore
                        .document('artifacts/{appId}/public/data/comments/{commentId}')
                        .onCreate(async (snap, context) => {
                            const newComment = snap.data();
                            const emailRecipient = 'wyclef.janssey.gutierrez@gmail.com';
                            const mailOptions = {
                                from: 'your_app_email@example.com', // Your verified sender email
                                to: emailRecipient,
                                subject: 'New Comment on Tabletop Nexus!',
                                html: `
                                    <p>A new comment has been submitted:</p>
                                    <p><strong>User ID:</strong> ${newComment.userId}</p>
                                    <p><strong>User Email:</strong> ${newComment.userEmail}</p>
                                    <p><strong>Comment:</strong> ${newComment.comment}</p>
                                    <p><strong>Timestamp:</strong> ${newComment.timestamp.toDate()}</p>
                                `
                            };

                            try {
                                await transporter.sendMail(mailOptions);
                                console.log('New comment email sent successfully!');
                            } catch (error) {
                                console.error('Error sending comment email:', error);
                            }
                            return null;
                        });
                    */
                    console.warn("NOTE: Email sending to wyclef.janssey.gutierrez@gmail.com requires a separate backend service (e.g., Firebase Cloud Functions) to handle securely. This is not implemented in the client-side JavaScript for security reasons.");

                } catch (error) {
                    console.error("Error submitting comment to Firestore:", error);
                    showMessageBox("Failed to submit comment. Please try again.");
                }

            } else {
                showMessageBox("Please sign in with an email and password to leave a comment.");
                openAuthModal('signIn'); // Prompt them to sign in
            }
        });
    }
}
