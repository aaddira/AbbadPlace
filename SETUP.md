# AbbadPlace Setup Guide

## Local Development

### 1. Configure Firebase Credentials

1. Copy the template to your local config:
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```

2. Get your Firebase credentials:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project "abbad-s"
   - Click ⚙️ **Settings** → **Project settings**
   - Scroll to **Your apps** → Select Web app
   - Copy the config values

3. Paste values into `firebase-config.js`

### 2. Security Note

⚠️ **IMPORTANT**: `firebase-config.js` is **NOT committed to GitHub**

- Your local copy stays private
- GitHub repo has `firebase-config.example.js` template only
- If you see `firebase-config.js` in git status, it won't be pushed

### 3. Run Locally

```bash
# Start a local HTTP server (required for ES6 modules)
python -m http.server 8000
# or
npx serve
```

Then open http://localhost:8000

---

## GitHub Pages Deployment

Since GitHub Pages serves static files, you have two options:

### Option A: Manual Setup (Recommended)
1. Fork/clone the repo
2. Add your `firebase-config.js` locally (not in git)
3. Push to GitHub
4. GitHub Pages serves the files as-is

### Option B: GitHub Actions (Advanced)
Add a build step to inject secrets at deployment time (requires setup)

---

## Troubleshooting

**"firebase-config.js not found" error?**
→ Copy `firebase-config.example.js` to `firebase-config.js` and fill in values

**Orders not saving?**
→ Check browser DevTools (F12) → Console for errors
→ Verify Firebase credentials are correct

**Admin page shows no orders?**
→ Open DevTools → Console to see connection status
→ Try opening `diagnostics.html` to check local logs
