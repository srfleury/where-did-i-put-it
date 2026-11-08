# Where Did I Put It

## About the owner
Not very technical. Explain things in plain language, one step at a time, and do as much of the work as possible (edits, git commands) once they say go. Confirm before pushing to GitHub.

## What this project is
A small app that tracks household items and which location each one is in (for example "Passport" in "Desk drawer"). It began as a claude.ai artifact and is being turned into an installable home-screen app (PWA) for two Android phones (the owner's and their wife's). It must work fully offline and sync automatically between the phones when either is online.

## Decisions already made (do not revisit without asking)
- **Backend:** Firebase Firestore with offline persistence (`persistentLocalCache`), so changes are stored on the phone and synced later.
- **No user sign-in.** Both phones enter the same secret "household code" (12+ characters, stored lowercase in `localStorage` under `wdip_household`). All data lives under `households/{code}/items` and `households/{code}/locations`. The code must never be committed to the repo.
- **Hosting:** GitHub Pages from this repo's main branch. A free GitHub account needs the repo to be public. Confirm the remote is on GitHub.
- **Install method:** Chrome on Android, "Install app" or "Add to Home screen".
- **No build step.** Plain static files, vanilla JS, no framework or bundler.

## Files
- `index.html`: the whole app. The original code calls `db.doc(path).set()/delete()` and `db.collection(name).onSnapshot()`. That call shape is kept, and an adapter in a `<script type="module">` maps it to Firestore (SDK 10.12.2, loaded from `www.gstatic.com`). Writes resolve immediately so the UI never waits on the server while offline. The status pill shows "Synced" or "Offline: saved on this phone".
- `firebase-config.js`: sets `window.FIREBASE_CONFIG`. It may still contain `PASTE_..._HERE` placeholders that the owner must replace with their Firebase web-app settings. These values are not secret, but do not invent them.
- `sw.js`: service worker with a precached app shell and stale-while-revalidate caching for same-origin files and `www.gstatic.com`. Cache name is `wdip-v1`. Bump it when shipping changes so phones pick up updates.
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`: PWA install metadata and icons.

## Firestore rules (published in the Firebase console, not stored in this repo)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /households/{code}/{collection}/{doc} {
      allow read, write: if code.size() >= 12
        && collection in ['items', 'locations'];
    }
  }
}
```
Security tradeoff: anyone who knows the household code can read and write the list. The app should not be used to store sensitive information.

## Status
The code has been written but not run or tested against a real Firebase project. Setup steps still to do:
1. Create the Firebase project and a Firestore database (production mode), then publish the rules above.
2. Register a web app in Firebase and paste its config values into `firebase-config.js`.
3. Commit and push to GitHub.
4. Turn on GitHub Pages for the main branch.
5. Open the URL in Chrome on the PC, enter the household code, and add a test item. Check that it appears in the Firebase console.
6. On each Android phone: open the URL, enter the same code, tap "Install app", open it once from the icon while online, then test in airplane mode and confirm changes sync back to the other phone.

## Working notes
- First, review `index.html`, `sw.js` and the module script for bugs. Pay special attention to offline behavior, the first-run flow (household code prompt) and service worker updates.
- Test offline behavior in Chrome DevTools (Application tab, Service Workers, Offline) before asking the owner to test on phones.
- Likely future requests: a way to change the household code, a visible version number, and a backup/export button.
- Keep it dependency-free and simple. Prefer small, clearly explained changes.
