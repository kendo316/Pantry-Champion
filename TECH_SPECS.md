# TECH SPECS OVERVIEW - PANTRY CHAMPION

## 1. EXTERNAL SERVICES & APIs

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| Firebase Authentication | User login/signup with email & password | CDN import (v10.7.1) |
| Firebase Firestore | Real-time NoSQL database for pantry data | CDN import (v10.7.1) |
| Firebase Hosting | Static web app deployment & CDN | CLI deployment |
| Web Speech API | Browser-native voice recognition for hands-free item entry | Native browser API (no external service) |
| Web Share API | iOS share sheet for ChatGPT meal planning export | Native browser API |
| iOS Shortcuts | Automation via URL parameters for NFC/Siri integration | URL scheme protocol |

**Firebase Project Details:**
- Project ID: pantry-champion
- Auth Domain: pantry-champion.firebaseapp.com
- Live URL: https://pantry-champion.web.app

---

## 2. TECH STACK

### Core Technologies
- **Language:** JavaScript (ES6+) - 1,430 lines in main app
- **Framework:** None (Vanilla JS) - no React, Vue, or Angular
- **HTML:** HTML5 with semantic markup
- **Styling:** Pure CSS (727 lines) - no Tailwind, Bootstrap, or SASS
- **Module System:** ES6 imports

### Key Libraries & SDKs
- **Firebase SDK v10.7.1** (via CDN):
  - firebase-app - Core initialization
  - firebase-auth - Authentication
  - firebase-firestore - Real-time database
- **Firebase CLI** (npm): firebase-tools@^13.0.0 (dev dependency only)

### Build Tools
- **Dev Server:** Python SimpleHTTPServer (python3 -m http.server 8000)
- **Build Process:** None required (static files served directly)
- **Deployment:** Firebase CLI + GitHub Actions

### Progressive Web App (PWA)
- **Service Worker:** Custom caching strategy (Network-first for HTML, cache-first for assets)
- **Cache Version:** pantry-champion-v7
- **Manifest:** Full PWA manifest with 8 icon sizes (72px-512px)
- **Display Mode:** Standalone (full-screen app)
- **Offline Support:** Yes, via service worker caching

---

## 3. DATA STORAGE

### Database Type
**Firebase Firestore** (NoSQL, Real-time Document Database)

### Database Schema

```
/users/{userId}
  ├─ pantryId: string (6-char code)
  ├─ email: string
  └─ joinedAt: timestamp

/pantries/{pantryId}
  ├─ createdBy: string (userId)
  ├─ createdAt: timestamp
  ├─ name: string (user-defined pantry name)
  │
  ├─ /items/{itemId} (subcollection)
  │   ├─ name: string
  │   ├─ category: string
  │   ├─ status: "in-stock" | "needs-restock"
  │   ├─ createdAt: timestamp
  │   └─ updatedAt: timestamp
  │
  └─ /restock/{restockId} (subcollection)
      ├─ name: string
      ├─ category: string
      ├─ priority: "normal" | "urgent"
      ├─ completed: boolean
      ├─ createdAt: timestamp
      └─ addedVia: "voice" | "manual"
```

### Real-time Synchronization
- Uses onSnapshot() listeners for live updates across all household members
- Changes sync instantly without page refresh
- Multi-user collaborative editing supported

### Firestore Indexes
- **Items:** Indexed by category (ASC) and name (ASC)
- **Restock:** Indexed by priority (ASC) and createdAt (DESC)

### Security Rules
- Users can only access pantries they're members of (via pantryId)
- Firestore security rules enforce pantry code validation
- No server-side API keys required (client-side Firebase Auth)

---

## 4. DEPLOYMENT & HOSTING

### Hosting Platform
**Firebase Hosting** (Google Cloud CDN)

### Deployment Method
- **Manual:** firebase deploy via CLI
- **Automatic:** GitHub Actions on push to claude/pantry-inventory-app-dGe8h branch

### CI/CD Pipeline
**GitHub Actions Workflow** (.github/workflows/firebase-deploy.yml):
```
Trigger: Push to claude/pantry-inventory-app-dGe8h
Steps:
  1. Checkout code (actions/checkout@v4)
  2. Setup Node.js 18 (actions/setup-node@v4)
  3. Install dependencies (npm ci)
  4. Deploy to Firebase (FIREBASE_TOKEN secret)
```

### Hosting Configuration
- **Public Directory:** /public
- **SPA Rewrite:** All routes → /index.html
- **Cache Control:** Service worker set to no-cache for immediate updates
- **SSL/HTTPS:** Automatic via Firebase

---

## 5. API KEYS & SERVICE CONNECTIONS

### Configured in Code

**Firebase Configuration** (public/js/firebase-config.js):
```
apiKey: AIzaSyC-dFh8P2ElM-Mhv4oPpDQ_HInKNiqwBMA
authDomain: pantry-champion.firebaseapp.com
projectId: pantry-champion
storageBucket: pantry-champion.firebasestorage.app
messagingSenderId: 343111846341
appId: 1:343111846341:web:1e7ef2ee2753ebb32ba3ac
```

**GitHub Secrets:**
- FIREBASE_TOKEN - Deployment authentication token

### Security Notes
- Firebase API key is intentionally public (standard for client-side apps)
- Security enforced via Firestore Rules, not API key protection
- No .env files used (config is hardcoded for client-side access)

---

## 6. PROJECT STRUCTURE

```
/home/user/Pantry-Champion/
│
├── public/                          # Static web app root (served by Firebase)
│   ├── index.html                   # Single-page application entry
│   ├── manifest.json                # PWA manifest
│   ├── service-worker.js            # Offline caching & PWA support
│   │
│   ├── css/
│   │   └── styles.css               # 727 lines of vanilla CSS
│   │
│   ├── js/
│   │   ├── app.js                   # 1,430 lines - Main application logic
│   │   └── firebase-config.js       # Firebase credentials
│   │
│   └── images/
│       └── icons/                   # PWA icons (72px-512px, 8 sizes)
│
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml      # CI/CD automation
│
├── .firebase/                       # Firebase deployment cache
├── firebase.json                    # Firebase hosting config
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Database query indexes
├── .firebaserc                      # Firebase project reference
├── package.json                     # Project metadata & scripts
└── .gitignore                       # Git exclusions
```

### Main Application Modules (public/js/app.js)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| Authentication | User login/signup | handleLogin(), handleSignup(), handleJoinPantry(), handleLogout() |
| Pantry Management | Create & load pantries | createNewPantry(), loadUserPantry(), setupRealtimeListeners() |
| Pantry Operations | CRUD for items | renderPantryItems(), toggleItemStatus(), editItem(), deleteItem() |
| Restock Queue | Shopping list management | renderRestockItems(), toggleRestockComplete(), clearCompletedRestockItems() |
| Voice Input | Speech recognition | startVoiceInput(), processVoiceInput(), guessCategory() |
| Export | Meal planning integration | exportToChatGPT() |
| UI Management | View switching & modals | switchView(), openSettingsModal(), showToast() |
| URL Parameters | iOS Shortcuts integration | URL parsing for ?voice= and ?category= |

### CSS Design System (public/css/styles.css)

**Color Palette:**
```
--primary-color: #1e6f74      /* Teal - brand color */
--secondary-color: #6b9b4a     /* Green - accents */
--accent-color: #d89735        /* Gold - highlights */
--background: #f8f6f2          /* Beige - page background */
--surface: #fdfbf7             /* Off-white - cards */
```

**Components:**
- Loading screen with spinner
- Login/signup forms
- Bottom navigation tabs
- Item cards with status indicators
- Modal dialogs
- Toast notifications
- Progress bars

---

## 7. NOTABLE FEATURES & INTEGRATIONS

### Voice Recognition
- Uses Web Speech API (browser-native, no external service)
- Natural language processing: "we're out of olive oil" → "Olive Oil"
- AI-powered category guessing based on item names
- Duplicate detection prevents adding items already in restock queue
- Bug fix (commit 26bd4fa): Prevents multiple recognition instances

### iOS Shortcuts Integration
- URL parameter support: ?voice=itemname&category=category
- Enables NFC tag automation (tap tag to add item via Shortcuts)
- Siri integration via Shortcuts app
- No app permissions required

### ChatGPT Meal Planning Export
- Exports pantry inventory in ChatGPT-friendly format
- Uses iOS Web Share API for native share sheet
- One-tap export to ChatGPT app

### Multi-User Pantry Sharing
- 6-character alphanumeric pantry codes
- Real-time sync across all household members
- Join existing pantry or create new one
- Pantry naming for household identification (commit 0f7329e)

### Categories (10 predefined):
1. Fresh Produce
2. Dairy and Eggs
3. Meat and Seafood
4. Grains Beans Pasta
5. Canned and Jarred
6. Condiments and Oils
7. Snacks and Sweets
8. Beverages
9. Frozen Foods
10. Supplies (non-food household items - commit e46d8c0)

---

## 8. USER-DRIVEN FEATURES

Based on commit history, the following features were added based on user input:

### From Recent Development:

1. **Duplicate Detection for Restock Items** (commit ecb9c08)
   - Prevents adding duplicate items to shopping list
   - User-requested to avoid list clutter

2. **Voice Input Bug Fix** (commit 26bd4fa)
   - Fixed issue preventing multiple voice recognition sessions
   - Critical bug affecting iOS Shortcuts workflow

3. **Supplies Category** (commit e46d8c0)
   - Added non-food household items category
   - User requested to track paper towels, cleaning supplies, etc.

4. **Pantry Naming Feature** (commit 0f7329e, 6151d38)
   - Users can name their pantry (e.g., "Smith Family Pantry")
   - Improved visibility with white text color
   - Helps distinguish multiple households in shared accounts

5. **Color Scheme Update** (commits de26cfd, 847b1bd)
   - Updated to "cozy home aesthetic"
   - Improved progress bar visibility with lighter colors
   - User-requested warmer, more inviting design

6. **Join Pantry Flow Fixes** (commits 70b4507, 462ad6f)
   - Fixed critical bugs preventing users from joining shared pantries
   - Preserved pantry code through authentication flow
   - User-reported issue affecting household collaboration

7. **GitHub Actions Deployment** (commit ad45f3a)
   - Automated deployment pipeline
   - Streamlined development workflow

---

## 9. PERFORMANCE CHARACTERISTICS

- **Bundle Size:** Minimal (no framework overhead, CDN-loaded Firebase SDK)
- **First Load:** Fast (static HTML/CSS/JS, Firebase CDN)
- **Real-time Updates:** Instant via Firestore onSnapshot() listeners
- **Offline Support:** Yes, cached via service worker
- **Mobile Performance:** Optimized for iOS Safari (PWA)

---

## 10. BROWSER COMPATIBILITY

- **Primary Target:** iOS Safari (PWA mode)
- **Voice Recognition:** Chrome, Safari (WebKit Speech API)
- **Service Worker:** All modern browsers
- **Firebase SDK:** All modern browsers (ES6+)

---

## 11. DEVELOPMENT COMMANDS

```bash
# Local development server
npm run dev
# → Opens http://localhost:8000

# Deploy to Firebase
npm run deploy
# → Deploys to https://pantry-champion.web.app

# Auto-deploy
git push origin claude/pantry-inventory-app-dGe8h
# → Triggers GitHub Actions deployment
```

---

## 12. KEY TECHNICAL DECISIONS

| Decision | Rationale |
|----------|-----------|
| Vanilla JS (no framework) | Faster load times, iOS-optimized, minimal dependencies |
| Firebase Backend | Real-time sync, secure multi-user, scalable, no server maintenance |
| PWA Architecture | Installable on iOS home screen, works offline, native app feel |
| Web Speech API | Privacy-focused (local processing), no API costs, native browser support |
| CDN-loaded Firebase | Reduces bundle size, faster initial load, browser caching |
| 6-char Pantry Codes | Easy to share verbally, memorable, unique collision-free IDs |
| Pure CSS (no framework) | Full design control, lightweight, no build step required |

---

## 13. FILE PATHS REFERENCE

**Main Application Files:**
- Main App Code: /home/user/Pantry-Champion/public/js/app.js
- Firebase Config: /home/user/Pantry-Champion/public/js/firebase-config.js
- Styling: /home/user/Pantry-Champion/public/css/styles.css
- HTML Entry: /home/user/Pantry-Champion/public/index.html

**Configuration Files:**
- Firestore Rules: /home/user/Pantry-Champion/firestore.rules
- Firestore Indexes: /home/user/Pantry-Champion/firestore.indexes.json
- Firebase Config: /home/user/Pantry-Champion/firebase.json
- Firebase Project: /home/user/Pantry-Champion/.firebaserc

**PWA Files:**
- Service Worker: /home/user/Pantry-Champion/public/service-worker.js
- PWA Manifest: /home/user/Pantry-Champion/public/manifest.json

**CI/CD:**
- GitHub Workflow: /home/user/Pantry-Champion/.github/workflows/firebase-deploy.yml
- Package Config: /home/user/Pantry-Champion/package.json

---

**Last Updated:** January 26, 2026
**Current Branch:** claude/pantry-inventory-app-dGe8h
**Live URL:** https://pantry-champion.web.app

This project is a lightweight, real-time collaborative pantry management app optimized for iOS households with voice input, NFC automation, and seamless ChatGPT meal planning integration.
