# Pantry Champion 🏆

A shared pantry management system for households with iOS support, NFC integration, voice input, and ChatGPT meal planning export.

## Features

- **Pantry Snapshot View**: Categorized inventory with search and filtering
- **Restock Queue**: Running list of items to restock with priority flags
- **Voice Input**: Add items via voice using iOS Speech Recognition
- **NFC Integration**: Tap and speak workflow via iOS Shortcuts
- **ChatGPT Export**: One-tap export of inventory for meal planning
- **Multi-User Sync**: Real-time sync between household members
- **PWA Support**: Install as an app on iOS devices

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Firebase (Authentication, Firestore)
- **PWA**: Service Worker for offline support
- **Voice**: Web Speech API
- **NFC**: iOS Shortcuts integration

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
4. Create a **Firestore Database**:
   - Go to Firestore Database > Create database
   - Start in **production mode** (we'll set rules next)
   - Choose your location
5. Set up **Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own user document
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }

       // Pantry access - users can access pantries they're members of
       match /pantries/{pantryId} {
         allow read, write: if request.auth != null &&
           exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.pantryId == pantryId;

         // Items and restock subcollections inherit parent permissions
         match /{document=**} {
           allow read, write: if request.auth != null &&
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.pantryId == pantryId;
         }
       }
     }
   }
   ```

6. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to create a web app
   - Copy the configuration object

7. Update `/public/js/firebase-config.js` with your credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 2. Local Development

You can run this app using any static file server. Here are a few options:

**Option 1: Python (if installed)**
```bash
# Python 3
cd public
python3 -m http.server 8000

# Python 2
cd public
python -m SimpleHTTPServer 8000
```

**Option 2: Node.js http-server**
```bash
npm install -g http-server
cd public
http-server -p 8000
```

**Option 3: VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `public/index.html`
- Select "Open with Live Server"

Then open your browser to `http://localhost:8000`

### 3. Firebase Hosting (Optional)

To deploy your app to Firebase Hosting:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set `public` as your public directory
   - Configure as a single-page app: Yes
   - Don't overwrite index.html

4. Deploy:
   ```bash
   firebase deploy
   ```

Your app will be live at `https://YOUR_PROJECT_ID.web.app`

### 4. iOS Installation

1. Open Safari on your iPhone
2. Navigate to your app URL
3. Tap the Share button
4. Scroll down and tap "Add to Home Screen"
5. Name it "Pantry Champion" and tap "Add"

The app will now appear on your home screen like a native app!

### 5. NFC + Voice Input Setup

#### Create the iOS Shortcut:

1. Open the **Shortcuts** app on your iPhone
2. Tap the **+** button to create a new shortcut
3. Add these actions in order:

   **Action 1: Get Text from Input**
   - Search for and add "Get Text from Input"
   - Tap "Input" and select "Ask Each Time"

   **Action 2: Dictate Text**
   - Search for and add "Dictate Text"
   - This will capture voice input

   **Action 3: Open URL**
   - Search for and add "Open URL"
   - Set the URL to: `https://YOUR_APP_URL`
   - Tap "Show More"
   - Add the dictated text as a parameter

4. Name your shortcut "Add to Pantry"
5. Tap the shortcut icon to customize (optional)

#### Connect to NFC Tag:

1. Go to the **Automation** tab in Shortcuts
2. Tap **+** to create a new automation
3. Select **NFC**
4. Tap **Scan** and scan your NFC tag
5. Name it "Pantry" (or whatever you like)
6. Tap **Next**
7. Search for and add **Run Shortcut**
8. Select your "Add to Pantry" shortcut
9. Tap **Next**
10. **IMPORTANT**: Turn OFF "Ask Before Running"
11. Tap **Done**

Now when you tap the NFC tag, it will automatically:
1. Trigger the shortcut
2. Start listening for voice input
3. Process what you say and add it to the restock queue

#### Alternative: Widget or Home Screen

If you don't have NFC tags, you can:
- Add the shortcut to your home screen
- Add the Shortcuts widget and pin your shortcut
- Use Siri: "Hey Siri, Add to Pantry"

## Usage Guide

### First Time Setup

1. Create an account with email and password
2. You'll automatically get a 6-character pantry code
3. Share this code with your household members
4. They can use "Join Pantry" to sync with your pantry

### Adding Items

**Manual Add:**
1. Tap the "+ Add Item" button
2. Enter item name and select category
3. Choose status (In Stock or Needs Restock)
4. Tap Save

**Bulk Add:**
1. Tap Settings (gear icon)
2. Tap "Open Bulk Entry"
3. Enter items one per line
4. Optionally specify category: "item name, category"
5. Tap "Add Items"

**Voice Add:**
1. Go to Restock Queue tab
2. Tap the "🎤 Voice Add" button
3. Speak the item name (e.g., "olive oil", "black beans")
4. The app will parse and add it to the restock queue

**NFC Add:**
1. Tap your NFC tag
2. Speak the item name when prompted
3. Item is automatically added

### Managing Items

- **Change Status**: Tap "Need Restock" or "In Stock" on any item
- **Edit**: Tap "Edit" to modify item details
- **Delete**: Tap "Delete" to remove an item

### Restock Queue

- **Priority**: Mark items as "Urgent" for high-priority restocking
- **Complete**: Check off items as you shop
- **Clear Completed**: Remove all completed items at once

### Export to ChatGPT

1. Tap the "💬 Get Dinner Ideas" button
2. On iOS, you can:
   - Use the share sheet to send to ChatGPT app
   - Copy to clipboard and paste manually
3. ChatGPT will receive your full inventory and can suggest recipes

## Categories

The app uses these predefined categories:
- Proteins
- Dairy and Eggs
- Produce
- Grains, Beans, Pasta
- Canned Goods
- Condiments and Oils
- Spices
- Baking Supplies

## Tips for Success

1. **Start Small**: Don't try to inventory everything at once. Add items as you use them.
2. **Voice Input**: Use natural language like "we're out of olive oil" or "need black beans"
3. **NFC Placement**: Put the NFC tag on your pantry shelving for easy access
4. **Regular Updates**: Update the app after grocery shopping
5. **Coverage Metric**: The percentage shows how complete your inventory is
6. **Household Sync**: Make sure everyone joins with the same pantry code

## Troubleshooting

**Voice input not working:**
- Make sure you're using Safari on iOS
- Grant microphone permissions when prompted
- Voice input requires an internet connection

**Items not syncing:**
- Check your internet connection
- Make sure all users joined the same pantry code
- Try refreshing the page

**Can't install as PWA:**
- Must use Safari browser (not Chrome)
- Make sure you're using "Add to Home Screen" from the share menu

**NFC not working:**
- iPhone 7 or newer required
- Make sure NFC is enabled in Settings
- Check that automation is set to run without asking

## Browser Support

- **iOS Safari**: Full support (recommended)
- **Chrome/Firefox**: Works but can't install as PWA on iOS
- **Desktop**: Works but optimized for mobile

## Privacy & Security

- All data is stored in your Firebase project
- Only users with your pantry code can access your data
- Voice data is processed locally and not stored
- Firebase security rules prevent unauthorized access

## Future Enhancements

Potential features for future versions:
- Receipt OCR for quick entry
- Barcode scanning
- Recipe storage
- Meal planning calendar
- Shopping list sharing
- Expiration date tracking
- Nutrition information

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase console for any errors
3. Check browser console for JavaScript errors

## License

This project is open source and available for personal use.

---

Built with ❤️ for home cooks who love to plan meals and hate running out of ingredients mid-recipe.
