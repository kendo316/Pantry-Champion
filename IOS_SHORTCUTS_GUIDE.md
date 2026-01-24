# iOS Shortcuts & NFC Integration Guide

This guide will help you set up the NFC + Voice workflow for Pantry Champion on your iPhone.

## Prerequisites

- iPhone 7 or newer (for NFC)
- iOS 13 or newer
- NFC tags (NTAG213/215/216 recommended)
- Shortcuts app (pre-installed on iOS)
- Pantry Champion app added to home screen

## Method 1: Full NFC + Voice Automation (Recommended)

This is the "tap and speak" workflow with no manual app opening.

### Step 1: Create the Voice Input Shortcut

1. Open the **Shortcuts** app
2. Tap the **+** button (top right) to create a new shortcut
3. Tap **Add Action**

4. **Add Action 1: Dictate Text**
   - Search for "Dictate Text"
   - Tap it to add
   - Set language to English (or your preference)
   - Tap "Show More" if you want to customize (optional)

5. **Add Action 2: Set Variable**
   - Search for "Set Variable"
   - Tap it to add
   - Name it: `VoiceInput`
   - Make sure it's set to use the output from "Dictated Text"

6. **Add Action 3: URL Encode**
   - Search for "URL Encode"
   - Tap it to add
   - Tap on the input field
   - Select the `VoiceInput` variable

7. **Add Action 4: Open URL**
   - Search for "Open URL"
   - Tap it to add
   - Set the URL to:
     ```
     https://YOUR_APP_URL/?voice=
     ```
     (Replace YOUR_APP_URL with your actual app URL)
   - Then tap after the `=` sign
   - Select the "URL Encoded" output from step 6

8. Tap the settings icon (toggle switches, top right)
9. Name the shortcut: **"Add to Pantry"**
10. Tap **Done**

### Step 2: Create the NFC Automation

1. In the Shortcuts app, go to the **Automation** tab (bottom center)
2. Tap **+** (top right)
3. Tap **Create Personal Automation**

4. **Choose Trigger:**
   - Scroll down and select **NFC**
   - Tap **Scan** to scan your NFC tag
   - Hold your iPhone near the NFC tag until it vibrates
   - Name the tag: **"Pantry"** (or your preference)
   - Tap **Next**

5. **Add Actions:**
   - Search for "Run Shortcut"
   - Tap it to add
   - Tap "Shortcut" and select **"Add to Pantry"** (the shortcut you created)
   - Tap **Next**

6. **Configure Automation:**
   - **IMPORTANT**: Turn OFF "Ask Before Running"
     - This enables the true "tap and speak" experience
   - Tap **Done**

### Step 3: Test Your Setup

1. Tap your NFC tag with your iPhone
2. You should immediately hear a chime and see the dictation interface
3. Speak an item name: "olive oil" or "we're out of black beans"
4. The app should open and add the item to your restock queue

**Troubleshooting:**
- If nothing happens: Make sure NFC is enabled in Settings
- If it asks for confirmation: Turn off "Ask Before Running" in the automation
- If dictation doesn't start: Check microphone permissions

## Method 2: Simplified NFC (Without Voice)

If you prefer to skip voice input and go directly to the app:

1. Create an automation with **NFC** trigger (same as above)
2. For the action, use **Open URL**
3. Set URL to your app: `https://YOUR_APP_URL/`
4. Turn off "Ask Before Running"
5. Tap the NFC tag to open the app directly

Then use the in-app voice button or manual entry.

## Method 3: Manual Shortcut (No NFC)

If you don't have NFC tags:

### Option A: Home Screen Shortcut
1. Create the "Add to Pantry" shortcut (Step 1 from Method 1)
2. Long-press the shortcut in the app
3. Select "Add to Home Screen"
4. Customize the icon and name
5. Tap the home screen icon to trigger voice input

### Option B: Widget
1. Long-press on your home screen
2. Tap the **+** button (top left)
3. Search for "Shortcuts"
4. Add the Shortcuts widget
5. Configure it to show "Add to Pantry"
6. Tap the widget to trigger

### Option C: Siri Voice Command
1. Create the shortcut
2. Say: "Hey Siri, Add to Pantry"
3. Siri will run the shortcut automatically

## Advanced: Direct API Integration

For developers who want to integrate with the app more deeply:

### Create a URL Scheme Handler

The app listens for URL parameters. You can create shortcuts that directly pass data:

```
https://YOUR_APP_URL/?voice=black%20beans
```

This will:
1. Open the app
2. Automatically process "black beans"
3. Add it to the restock queue

### Custom Shortcut with Categories

You can create a more advanced shortcut that:

1. Shows a menu to select category
2. Then captures voice input
3. Passes both to the app

Example URL:
```
https://YOUR_APP_URL/?voice=olive%20oil&category=Condiments%20and%20Oils
```

## NFC Tag Placement Tips

**Best Locations:**
- Inside pantry door
- On the pantry shelf frame
- On refrigerator (for dairy items)
- Near your grocery list notepad

**Tag Types:**
- NTAG213: Budget option, works great
- NTAG215: More memory (not needed for this)
- NTAG216: Even more memory (overkill)

**Where to Buy:**
- Amazon: Search "NTAG213 stickers"
- eBay: Often cheaper in bulk
- AliExpress: Very cheap but slow shipping

**Placement Tips:**
- Avoid metal surfaces (they interfere with NFC)
- Place at comfortable height
- Mark the tag with a label so everyone knows what it does
- Keep it dry

## Multiple NFC Tags

You can set up multiple tags for different purposes:

**Pantry Tag:**
- Triggers: Add to Restock Queue
- Placed: Inside pantry

**Fridge Tag:**
- Triggers: Add to Restock Queue (Dairy category)
- Placed: On refrigerator

**Shopping Tag:**
- Triggers: Open Restock Queue view
- Placed: By the door/in car

To set this up:
1. Create different automations for each tag
2. Scan different NFC tags for each automation
3. Customize the actions for each

## Privacy & Security Notes

- Voice data is processed by Apple's servers
- The text is then passed to your app
- Nothing is stored on Apple's servers
- Your pantry data stays in Firebase
- NFC tags can be read by anyone (they're not password protected)
- The worst someone can do is trigger your shortcut

## Troubleshooting Common Issues

**"No NFC Tag Detected"**
- Make sure your iPhone supports NFC (iPhone 7+)
- Try holding the top of the phone to the tag
- Remove phone case if it's very thick

**"Shortcuts wants to access the microphone"**
- Tap "OK" to allow
- If you denied it, go to Settings > Shortcuts > Allow Microphone

**Automation not running automatically**
- Check that "Ask Before Running" is OFF
- Make sure the automation is enabled (toggle in automation list)

**Voice input not working in the app**
- Grant microphone permission to Safari
- Make sure you have an internet connection
- Try using the in-app voice button first

**App not opening from NFC**
- Make sure the URL in your shortcut is correct
- Try opening the URL manually in Safari first
- Check that the app is installed to home screen

## Alternative: Siri Shortcuts

You can also trigger the shortcut with Siri:

1. Create the "Add to Pantry" shortcut
2. Say: "Hey Siri, Add to Pantry"
3. Siri will start dictation
4. Speak your item
5. App opens and adds it

To customize the Siri phrase:
1. Open the shortcut settings
2. Tap "Add to Siri"
3. Record a custom phrase like "Pantry restock"

## Tips for Best Experience

1. **Speak Clearly**: Say item names clearly and wait for the beep
2. **Natural Language**: You can say "we're out of olive oil" or just "olive oil"
3. **Multiple Items**: For now, do one at a time. Or say "olive oil, black beans" and the app will try to parse it
4. **Background Noise**: Find a quiet spot for best recognition
5. **Practice**: The first few times might feel awkward, but it gets natural quickly

## Family Setup

To set up NFC for multiple family members:

1. Each person adds the app to their home screen
2. Each person creates the same "Add to Pantry" shortcut
3. Each person creates the NFC automation using the SAME tag
4. Everyone scans the same physical NFC tag
5. Now anyone can tap and speak

Since the tag just triggers the shortcut, and everyone has their own shortcut, it works for the whole household.

## Future Enhancements

Possible improvements for future versions:

- Category selection via voice
- Multiple items in one voice command
- Voice confirmation before adding
- Custom voice commands per tag
- Integration with Reminders app
- Shopping list export

---

**Need Help?**

If you're stuck:
1. Check that the basic "Add to Pantry" shortcut works first
2. Test by tapping it manually in the Shortcuts app
3. Then add the NFC trigger
4. Check the automation is enabled and "Ask Before Running" is OFF

The NFC + Voice workflow is the killer feature of this app. Once set up, it's incredibly satisfying to just tap and speak!
