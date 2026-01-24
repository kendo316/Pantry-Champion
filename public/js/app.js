// Import Firebase modules from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Safe localStorage wrapper for Safari private mode compatibility
function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn('localStorage not available (Safari private mode?):', e);
        return false;
    }
}

function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn('localStorage not available (Safari private mode?):', e);
        return null;
    }
}

function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.warn('localStorage not available (Safari private mode?):', e);
        return false;
    }
}

// App State
let currentUser = null;
let currentPantryId = null;
let pantryItems = [];
let restockItems = [];
let currentFilter = 'all';
let searchQuery = '';
let editingItemId = null;

// DOM Elements - Screens
const loadingScreen = document.getElementById('loading-screen');
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app');

// DOM Elements - Login
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const pantryCodeInput = document.getElementById('pantry-code');
const joinPantryBtn = document.getElementById('join-pantry-btn');

// DOM Elements - Navigation
const navTabs = document.querySelectorAll('.nav-tab');
const pantryView = document.getElementById('pantry-view');
const restockView = document.getElementById('restock-view');

// DOM Elements - Header
const settingsBtn = document.getElementById('settings-btn');
const logoutBtn = document.getElementById('logout-btn');

// DOM Elements - Pantry View
const totalItemsEl = document.getElementById('total-items');
const coverageProgressEl = document.getElementById('coverage-progress');
const coveragePercentEl = document.getElementById('coverage-percent');
const pantrySearchInput = document.getElementById('pantry-search');
const addItemBtn = document.getElementById('add-item-btn');
const exportChatGPTBtn = document.getElementById('export-chatgpt-btn');
const filterChips = document.querySelectorAll('.filter-chip');
const pantryList = document.getElementById('pantry-list');

// DOM Elements - Restock View
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const voiceAddBtn = document.getElementById('voice-add-btn');
const restockList = document.getElementById('restock-list');

// DOM Elements - Modals
const itemModal = document.getElementById('item-modal');
const modalTitle = document.getElementById('modal-title');
const itemForm = document.getElementById('item-form');
const itemNameInput = document.getElementById('item-name');
const itemCategorySelect = document.getElementById('item-category');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');

const bulkModal = document.getElementById('bulk-modal');
const bulkItemsTextarea = document.getElementById('bulk-items');
const bulkCategorySelect = document.getElementById('bulk-category');
const closeBulkModalBtn = document.getElementById('close-bulk-modal');
const cancelBulkModalBtn = document.getElementById('cancel-bulk-modal');
const saveBulkItemsBtn = document.getElementById('save-bulk-items');

const settingsModal = document.getElementById('settings-modal');
const closeSettingsModalBtn = document.getElementById('close-settings-modal');
const pantryInviteUrl = document.getElementById('pantry-invite-url');
const copyUrlBtn = document.getElementById('copy-url-btn');
const pantryCodeDisplay = document.getElementById('pantry-code-display');
const copyCodeBtn = document.getElementById('copy-code-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const openBulkEntryBtn = document.getElementById('open-bulk-entry-btn');
const joinPantryCodeInput = document.getElementById('join-pantry-code-input');
const joinPantrySettingsBtn = document.getElementById('join-pantry-settings-btn');

const toastContainer = document.getElementById('toast-container');

// Categories for the app
const CATEGORIES = [
    'Proteins',
    'Dairy and Eggs',
    'Produce',
    'Grains Beans Pasta',
    'Canned Goods',
    'Condiments and Oils',
    'Spices',
    'Baking Supplies'
];

// Initialize App
function initApp() {
    // Check for invite code in URL before authentication
    checkForInviteCode();

    // Auth state observer
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserPantry();
            showApp();

            // Check for URL parameters (iOS Shortcuts integration)
            checkUrlParameters();
        } else {
            currentUser = null;
            currentPantryId = null;
            showLogin();
        }
    });

    // Setup event listeners
    setupEventListeners();
}

// Check for invite code in URL and store it for later
function checkForInviteCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite') || urlParams.get('code') || urlParams.get('pantry');

    if (inviteCode) {
        // Store the invite code so it persists through login/signup
        safeLocalStorageSet('pendingInvite', inviteCode.toUpperCase());

        // Pre-fill the pantry code input if visible
        if (pantryCodeInput) {
            pantryCodeInput.value = inviteCode.toUpperCase();
        }

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check URL Parameters for iOS Shortcuts Integration
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const voiceInput = urlParams.get('voice');
    const category = urlParams.get('category');

    if (voiceInput) {
        // Process voice input from iOS Shortcut
        processVoiceInput(voiceInput, category);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Show/Hide Screens
function showLogin() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

function showApp() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
}

function showLoading() {
    loadingScreen.classList.remove('hidden');
    loginScreen.classList.add('hidden');
    appScreen.classList.add('hidden');
}

// Setup Event Listeners
function setupEventListeners() {
    // Login/Signup
    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignup);
    joinPantryBtn.addEventListener('click', handleJoinPantry);

    // Navigation
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Header actions
    settingsBtn.addEventListener('click', openSettingsModal);
    logoutBtn.addEventListener('click', handleLogout);

    // Pantry view
    addItemBtn.addEventListener('click', () => openItemModal());
    exportChatGPTBtn.addEventListener('click', exportToChatGPT);
    pantrySearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderPantryItems();
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.category;
            renderPantryItems();
        });
    });

    // Restock view
    clearCompletedBtn.addEventListener('click', clearCompletedRestockItems);
    voiceAddBtn.addEventListener('click', startVoiceInput);

    // Item modal
    closeModalBtn.addEventListener('click', closeItemModal);
    cancelModalBtn.addEventListener('click', closeItemModal);
    itemForm.addEventListener('submit', handleSaveItem);

    // Bulk modal
    closeBulkModalBtn.addEventListener('click', closeBulkModal);
    cancelBulkModalBtn.addEventListener('click', closeBulkModal);
    saveBulkItemsBtn.addEventListener('click', handleBulkAdd);

    // Settings modal
    closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    copyUrlBtn.addEventListener('click', copyInviteUrl);
    copyCodeBtn.addEventListener('click', copyPantryCode);
    openBulkEntryBtn.addEventListener('click', openBulkModal);
    joinPantrySettingsBtn.addEventListener('click', handleJoinPantryFromSettings);
}

// Authentication Functions
async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Logged in successfully', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message, 'error');
    }
}

async function handleSignup() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Check if there's a pending invite code
        const pendingInvite = safeLocalStorageGet('pendingInvite');

        if (pendingInvite) {
            // User is signing up to join an existing pantry
            try {
                await joinPantryWithCode(userCredential.user.uid, pendingInvite);
                safeLocalStorageRemove('pendingInvite'); // Clear the pending invite
                showToast('Account created and joined pantry successfully', 'success');
            } catch (error) {
                console.error('Error joining pantry after signup:', error);
                // Fallback: create new pantry if join fails
                await createNewPantry(userCredential.user.uid);
                safeLocalStorageRemove('pendingInvite');
                showToast('Account created (could not join pantry, created new one)', 'warning');
            }
        } else {
            // Normal signup - create a new pantry for this user
            await createNewPantry(userCredential.user.uid);
            showToast('Account created successfully', 'success');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast(error.message, 'error');
    }
}

async function handleJoinPantry() {
    const code = pantryCodeInput.value.trim().toUpperCase();

    if (!code) {
        showToast('Please enter a pantry code', 'error');
        return;
    }

    if (!currentUser) {
        showToast('Please sign in first', 'error');
        return;
    }

    try {
        await joinPantryWithCode(currentUser.uid, code);
        currentPantryId = code;
        setupRealtimeListeners();
        showToast('Joined pantry successfully', 'success');
        showApp();
    } catch (error) {
        console.error('Join pantry error:', error);
        showToast('Error joining pantry', 'error');
    }
}

// Helper function to join a pantry with a code (used by both manual join and signup flow)
async function joinPantryWithCode(userId, code) {
    // Check if pantry exists
    const pantryDoc = await getDoc(doc(db, 'pantries', code));

    if (!pantryDoc.exists()) {
        throw new Error('Pantry code not found');
    }

    // Update user's pantry reference
    await setDoc(doc(db, 'users', userId), {
        pantryId: code,
        email: auth.currentUser.email,
        joinedAt: serverTimestamp()
    });

    currentPantryId = code;
}

async function handleLogout() {
    try {
        await signOut(auth);
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Pantry Management
async function createNewPantry(userId) {
    // Generate a random 6-character pantry code
    const pantryId = generatePantryCode();

    try {
        // Create pantry document
        await setDoc(doc(db, 'pantries', pantryId), {
            createdBy: userId,
            createdAt: serverTimestamp(),
            name: 'My Pantry'
        });

        // Link user to pantry
        await setDoc(doc(db, 'users', userId), {
            pantryId: pantryId,
            email: auth.currentUser.email,
            joinedAt: serverTimestamp()
        });

        currentPantryId = pantryId;
    } catch (error) {
        console.error('Error creating pantry:', error);
        throw error;
    }
}

async function loadUserPantry() {
    try {
        // Check if there's a pending invite (for existing users logging in via invite link)
        const pendingInvite = safeLocalStorageGet('pendingInvite');

        if (pendingInvite) {
            try {
                await joinPantryWithCode(currentUser.uid, pendingInvite);
                safeLocalStorageRemove('pendingInvite');
                showToast('Joined pantry successfully', 'success');
                setupRealtimeListeners();
                updateSettingsDisplay();
                return;
            } catch (error) {
                console.error('Error joining pantry from invite:', error);
                safeLocalStorageRemove('pendingInvite');
                showToast('Invalid invite code', 'error');
                // Continue to load user's existing pantry
            }
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

        if (userDoc.exists()) {
            currentPantryId = userDoc.data().pantryId;
            setupRealtimeListeners();
            updateSettingsDisplay();
        } else {
            // New user - create a pantry
            await createNewPantry(currentUser.uid);
            setupRealtimeListeners();
            updateSettingsDisplay();
        }
    } catch (error) {
        console.error('Error loading pantry:', error);
        showToast('Error loading pantry data', 'error');
    }
}

function setupRealtimeListeners() {
    if (!currentPantryId) return;

    // Listen to pantry items
    const pantryItemsRef = collection(db, 'pantries', currentPantryId, 'items');
    onSnapshot(pantryItemsRef, (snapshot) => {
        pantryItems = [];
        snapshot.forEach((doc) => {
            pantryItems.push({ id: doc.id, ...doc.data() });
        });
        renderPantryItems();
        updateStats();
    });

    // Listen to restock items
    const restockItemsRef = collection(db, 'pantries', currentPantryId, 'restock');
    onSnapshot(restockItemsRef, (snapshot) => {
        restockItems = [];
        snapshot.forEach((doc) => {
            restockItems.push({ id: doc.id, ...doc.data() });
        });
        renderRestockItems();
    });
}

// UI Functions
function switchView(viewName) {
    navTabs.forEach(tab => {
        if (tab.dataset.view === viewName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    if (viewName === 'pantry') {
        pantryView.classList.add('active');
        restockView.classList.remove('active');
    } else if (viewName === 'restock') {
        pantryView.classList.remove('active');
        restockView.classList.add('active');
    }
}

function renderPantryItems() {
    let filteredItems = pantryItems;

    // Apply category filter
    if (currentFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === currentFilter);
    }

    // Apply search filter
    if (searchQuery) {
        filteredItems = filteredItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery)
        );
    }

    // Sort by category then name
    filteredItems.sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
    });

    if (filteredItems.length === 0) {
        pantryList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No items found</h3>
                <p>Add items to start tracking your pantry</p>
            </div>
        `;
        return;
    }

    pantryList.innerHTML = filteredItems.map(item => `
        <div class="item-card" data-id="${item.id}">
            <div class="item-status-icon">
                ${item.status === 'in-stock' ? '✅' : '⚠️'}
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-category">${item.category}</div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn ${item.status === 'in-stock' ? 'restock' : 'in-stock'}"
                        onclick="toggleItemStatus('${item.id}', '${item.status}')">
                    ${item.status === 'in-stock' ? 'Need Restock' : 'In Stock'}
                </button>
                <button class="item-action-btn" onclick="editItem('${item.id}')">Edit</button>
                <button class="item-action-btn delete" onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function renderRestockItems() {
    // Sort by priority (urgent first) then by creation date
    const sortedItems = [...restockItems].sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    if (sortedItems.length === 0) {
        restockList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <h3>No items to restock</h3>
                <p>Items flagged for restocking will appear here</p>
            </div>
        `;
        return;
    }

    restockList.innerHTML = sortedItems.map(item => `
        <div class="item-card restock-item ${item.priority === 'urgent' ? 'urgent' : ''} ${item.completed ? 'completed' : ''}"
             data-id="${item.id}">
            <div class="item-status-icon">${item.completed ? '✓' : '🛒'}</div>
            <div class="item-info">
                <div class="item-name">
                    ${item.name}
                    ${item.priority === 'urgent' ? '<span class="priority-badge">URGENT</span>' : ''}
                </div>
                <div class="item-category">${item.category || 'Uncategorized'}</div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn"
                        onclick="toggleRestockComplete('${item.id}', ${item.completed || false})">
                    ${item.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="item-action-btn"
                        onclick="toggleRestockPriority('${item.id}', '${item.priority || 'normal'}')">
                    ${item.priority === 'urgent' ? 'Normal' : 'Urgent'}
                </button>
                <button class="item-action-btn delete" onclick="deleteRestockItem('${item.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const totalItems = pantryItems.length;
    const inStockItems = pantryItems.filter(item => item.status === 'in-stock').length;
    const coverage = totalItems > 0 ? Math.round((inStockItems / totalItems) * 100) : 0;

    totalItemsEl.textContent = totalItems;
    coveragePercentEl.textContent = `${coverage}%`;
    coverageProgressEl.style.width = `${coverage}%`;
}

function updateSettingsDisplay() {
    if (currentPantryId) {
        pantryCodeDisplay.textContent = currentPantryId;

        // Generate shareable invite URL
        const baseUrl = window.location.origin + window.location.pathname;
        const inviteUrl = `${baseUrl}?invite=${currentPantryId}`;
        pantryInviteUrl.textContent = inviteUrl;
    }
    if (currentUser) {
        userEmailDisplay.textContent = currentUser.email;
    }
}

// Item Modal Functions
function openItemModal(itemId = null) {
    editingItemId = itemId;

    if (itemId) {
        const item = pantryItems.find(i => i.id === itemId);
        if (item) {
            modalTitle.textContent = 'Edit Item';
            itemNameInput.value = item.name;
            itemCategorySelect.value = item.category;
            document.querySelector(`input[name="status"][value="${item.status}"]`).checked = true;
        }
    } else {
        modalTitle.textContent = 'Add Item';
        itemForm.reset();
    }

    itemModal.classList.remove('hidden');
}

function closeItemModal() {
    itemModal.classList.add('hidden');
    itemForm.reset();
    editingItemId = null;
}

async function handleSaveItem(e) {
    e.preventDefault();

    const name = itemNameInput.value.trim();
    const category = itemCategorySelect.value;
    const status = document.querySelector('input[name="status"]:checked').value;

    if (!name || !category) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        if (editingItemId) {
            // Update existing item
            await updateDoc(doc(db, 'pantries', currentPantryId, 'items', editingItemId), {
                name,
                category,
                status,
                updatedAt: serverTimestamp()
            });
            showToast('Item updated successfully', 'success');
        } else {
            // Add new item
            const itemRef = doc(collection(db, 'pantries', currentPantryId, 'items'));
            await setDoc(itemRef, {
                name,
                category,
                status,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            showToast('Item added successfully', 'success');
        }

        closeItemModal();
    } catch (error) {
        console.error('Error saving item:', error);
        showToast('Error saving item', 'error');
    }
}

// Bulk Entry Functions
function openBulkModal() {
    closeSettingsModal();
    bulkModal.classList.remove('hidden');
}

function closeBulkModal() {
    bulkModal.classList.add('hidden');
    bulkItemsTextarea.value = '';
    bulkCategorySelect.value = '';
}

async function handleBulkAdd() {
    const items = bulkItemsTextarea.value.trim().split('\n').filter(line => line.trim());
    const defaultCategory = bulkCategorySelect.value;

    if (items.length === 0) {
        showToast('Please enter at least one item', 'error');
        return;
    }

    try {
        let addedCount = 0;

        for (const line of items) {
            const parts = line.split(',').map(p => p.trim());
            const name = parts[0];
            let category = parts[1] || defaultCategory;

            // Try to match category
            if (category && !CATEGORIES.includes(category)) {
                // Try fuzzy match
                const match = CATEGORIES.find(c =>
                    c.toLowerCase().includes(category.toLowerCase()) ||
                    category.toLowerCase().includes(c.toLowerCase())
                );
                category = match || defaultCategory;
            }

            if (!category) {
                category = 'Condiments and Oils'; // Default fallback
            }

            if (name) {
                const itemRef = doc(collection(db, 'pantries', currentPantryId, 'items'));
                await setDoc(itemRef, {
                    name,
                    category,
                    status: 'in-stock',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                addedCount++;
            }
        }

        showToast(`Added ${addedCount} items successfully`, 'success');
        closeBulkModal();
    } catch (error) {
        console.error('Error adding bulk items:', error);
        showToast('Error adding items', 'error');
    }
}

// Item Actions
window.toggleItemStatus = async function(itemId, currentStatus) {
    const newStatus = currentStatus === 'in-stock' ? 'needs-restock' : 'in-stock';

    try {
        await updateDoc(doc(db, 'pantries', currentPantryId, 'items', itemId), {
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        // If marking as needs-restock, also add to restock queue
        if (newStatus === 'needs-restock') {
            const item = pantryItems.find(i => i.id === itemId);
            if (item) {
                const restockRef = doc(collection(db, 'pantries', currentPantryId, 'restock'));
                await setDoc(restockRef, {
                    name: item.name,
                    category: item.category,
                    priority: 'normal',
                    completed: false,
                    createdAt: serverTimestamp()
                });
            }
        }

        showToast('Status updated', 'success');
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status', 'error');
    }
};

window.editItem = function(itemId) {
    openItemModal(itemId);
};

window.deleteItem = async function(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        await deleteDoc(doc(db, 'pantries', currentPantryId, 'items', itemId));
        showToast('Item deleted', 'success');
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error deleting item', 'error');
    }
};

// Restock Actions
window.toggleRestockComplete = async function(itemId, currentCompleted) {
    try {
        await updateDoc(doc(db, 'pantries', currentPantryId, 'restock', itemId), {
            completed: !currentCompleted,
            updatedAt: serverTimestamp()
        });

        // If marking as complete, update the pantry item to in-stock
        if (!currentCompleted) {
            const restockItem = restockItems.find(i => i.id === itemId);
            if (restockItem) {
                const pantryItem = pantryItems.find(i => i.name === restockItem.name);
                if (pantryItem) {
                    await updateDoc(doc(db, 'pantries', currentPantryId, 'items', pantryItem.id), {
                        status: 'in-stock',
                        updatedAt: serverTimestamp()
                    });
                }
            }
        }

        showToast('Status updated', 'success');
    } catch (error) {
        console.error('Error updating restock status:', error);
        showToast('Error updating status', 'error');
    }
};

window.toggleRestockPriority = async function(itemId, currentPriority) {
    const newPriority = currentPriority === 'urgent' ? 'normal' : 'urgent';

    try {
        await updateDoc(doc(db, 'pantries', currentPantryId, 'restock', itemId), {
            priority: newPriority,
            updatedAt: serverTimestamp()
        });
        showToast('Priority updated', 'success');
    } catch (error) {
        console.error('Error updating priority:', error);
        showToast('Error updating priority', 'error');
    }
};

window.deleteRestockItem = async function(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        await deleteDoc(doc(db, 'pantries', currentPantryId, 'restock', itemId));
        showToast('Item deleted', 'success');
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error deleting item', 'error');
    }
};

async function clearCompletedRestockItems() {
    const completedItems = restockItems.filter(item => item.completed);

    if (completedItems.length === 0) {
        showToast('No completed items to clear', 'error');
        return;
    }

    if (!confirm(`Clear ${completedItems.length} completed items?`)) return;

    try {
        for (const item of completedItems) {
            await deleteDoc(doc(db, 'pantries', currentPantryId, 'restock', item.id));
        }
        showToast('Completed items cleared', 'success');
    } catch (error) {
        console.error('Error clearing items:', error);
        showToast('Error clearing items', 'error');
    }
}

// Voice Input
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice input not supported on this device', 'error');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        voiceAddBtn.textContent = '🎤 Listening...';
        voiceAddBtn.style.background = 'var(--accent-color)';
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        await processVoiceInput(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showToast('Voice input error: ' + event.error, 'error');
        voiceAddBtn.textContent = '🎤 Voice Add';
        voiceAddBtn.style.background = '';
    };

    recognition.onend = () => {
        voiceAddBtn.textContent = '🎤 Voice Add';
        voiceAddBtn.style.background = '';
    };

    recognition.start();
}

async function processVoiceInput(text, categoryOverride = null) {
    // Parse natural language input
    // Examples: "olive oil", "we're out of black beans", "restock chickpeas"

    let itemName = text.toLowerCase()
        .replace(/we'?re out of /gi, '')
        .replace(/restock /gi, '')
        .replace(/need /gi, '')
        .replace(/add /gi, '')
        .trim();

    if (!itemName) {
        showToast('Could not understand the item name', 'error');
        return;
    }

    // Capitalize first letter of each word
    itemName = itemName.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Use provided category or guess based on common items
    const category = categoryOverride || guessCategory(itemName);

    try {
        // Add to restock queue
        const restockRef = doc(collection(db, 'pantries', currentPantryId, 'restock'));
        await setDoc(restockRef, {
            name: itemName,
            category: category,
            priority: 'normal',
            completed: false,
            createdAt: serverTimestamp(),
            addedVia: 'voice'
        });

        // Check if item exists in pantry
        const existingItem = pantryItems.find(item =>
            item.name.toLowerCase() === itemName.toLowerCase()
        );

        if (!existingItem) {
            // Prompt user to add to pantry
            if (confirm(`"${itemName}" is not in your pantry inventory. Add it now?`)) {
                const itemRef = doc(collection(db, 'pantries', currentPantryId, 'items'));
                await setDoc(itemRef, {
                    name: itemName,
                    category: category,
                    status: 'needs-restock',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        }

        showToast(`Added "${itemName}" to restock queue`, 'success');

        // Switch to restock view
        switchView('restock');
    } catch (error) {
        console.error('Error processing voice input:', error);
        showToast('Error adding item', 'error');
    }
}

function guessCategory(itemName) {
    const lower = itemName.toLowerCase();

    // Proteins
    if (/(beef|chicken|pork|bacon|turkey|meat|fish|salmon|tuna|shrimp)/i.test(lower)) {
        return 'Proteins';
    }

    // Dairy and Eggs
    if (/(milk|cheese|yogurt|butter|cream|egg|sour cream)/i.test(lower)) {
        return 'Dairy and Eggs';
    }

    // Produce
    if (/(apple|banana|orange|lemon|lettuce|tomato|onion|garlic|potato|carrot|celery|pepper|avocado|spinach|kale)/i.test(lower)) {
        return 'Produce';
    }

    // Grains Beans Pasta
    if (/(rice|pasta|bean|lentil|chickpea|quinoa|couscous|noodle)/i.test(lower)) {
        return 'Grains Beans Pasta';
    }

    // Canned Goods
    if (/(canned|can of)/i.test(lower)) {
        return 'Canned Goods';
    }

    // Condiments and Oils
    if (/(oil|vinegar|sauce|mustard|ketchup|mayo|soy sauce|hot sauce)/i.test(lower)) {
        return 'Condiments and Oils';
    }

    // Spices
    if (/(pepper|salt|cumin|paprika|oregano|basil|thyme|cinnamon|spice)/i.test(lower)) {
        return 'Spices';
    }

    // Baking Supplies
    if (/(flour|sugar|baking|chocolate|vanilla|yeast)/i.test(lower)) {
        return 'Baking Supplies';
    }

    // Default
    return 'Condiments and Oils';
}

// Export to ChatGPT
function exportToChatGPT() {
    if (pantryItems.length === 0) {
        showToast('No items in pantry to export', 'error');
        return;
    }

    // Group items by category
    const itemsByCategory = {};
    CATEGORIES.forEach(cat => {
        itemsByCategory[cat] = [];
    });

    pantryItems
        .filter(item => item.status === 'in-stock')
        .forEach(item => {
            if (itemsByCategory[item.category]) {
                itemsByCategory[item.category].push(item.name);
            }
        });

    // Build the prompt
    let prompt = "Here's what's currently stocked in my pantry:\n\n";

    CATEGORIES.forEach(category => {
        const items = itemsByCategory[category];
        if (items.length > 0) {
            prompt += `**${category}:**\n`;
            prompt += items.map(item => `- ${item}`).join('\n');
            prompt += '\n\n';
        }
    });

    prompt += "I'm looking for dinner ideas that use mostly these ingredients. What would you suggest? Feel free to ask about time constraints, dietary preferences, or what kind of meal sounds good tonight.";

    // Use iOS share sheet if available
    if (navigator.share) {
        navigator.share({
            title: 'My Pantry Inventory',
            text: prompt
        }).then(() => {
            showToast('Shared successfully', 'success');
        }).catch(err => {
            if (err.name !== 'AbortError') {
                // Fallback to copy to clipboard
                copyToClipboard(prompt);
            }
        });
    } else {
        // Fallback to copy to clipboard
        copyToClipboard(prompt);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard! Paste into ChatGPT', 'success');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            showToast('Error copying to clipboard', 'error');
        });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard! Paste into ChatGPT', 'success');
        } catch (err) {
            showToast('Error copying to clipboard', 'error');
        }
        document.body.removeChild(textarea);
    }
}

// Settings Functions
function openSettingsModal() {
    updateSettingsDisplay();
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

function copyPantryCode() {
    const code = pantryCodeDisplay.textContent;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
            showToast('Pantry code copied', 'success');
        });
    } else {
        showToast('Error copying code', 'error');
    }
}

function copyInviteUrl() {
    const url = pantryInviteUrl.textContent;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Invite link copied - share it with your household!', 'success');
        });
    } else {
        showToast('Error copying link', 'error');
    }
}

async function handleJoinPantryFromSettings() {
    const code = joinPantryCodeInput.value.trim().toUpperCase();

    if (!code) {
        showToast('Please enter a pantry code', 'error');
        return;
    }

    if (!currentUser) {
        showToast('Please sign in first', 'error');
        return;
    }

    try {
        await joinPantryWithCode(currentUser.uid, code);
        currentPantryId = code;
        setupRealtimeListeners();
        showToast('Joined pantry successfully', 'success');
        joinPantryCodeInput.value = ''; // Clear the input
        updateSettingsDisplay(); // Update the displayed pantry code
        closeSettingsModal(); // Close the modal
    } catch (error) {
        console.error('Join pantry error:', error);
        showToast('Error joining pantry', 'error');
    }
}

// Utility Functions
function generatePantryCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Expose processVoiceInput for iOS Shortcuts integration
window.addItemViaVoice = async function(text) {
    await processVoiceInput(text);
};
