# Abbad's Menu

Static single-page menu site with ordering. Black background, gold typography (Cormorant Garamond for headers, Montserrat for body, Allura for the logo).

## Structure
- `index.html` — menu page, with cart + checkout
- `admin.html` — order list for the shop side (not linked from the menu — visit it directly)
- `style.css` / `admin.css` — theme/layout
- `cart.js` / `admin.js` — cart logic and admin order feed
- `firebase-config.js` — your Firebase project keys (see setup below)
- `assets/` — drop photos here, one per section (see filenames below)
- `sketches/` — placeholder illustrations used until real photos are added
- `photos/` — header gallery photos

## Firebase setup (required for ordering to work)
Orders are stored in Firestore so `admin.html` can list them from any device. One-time setup:

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (free "Spark" plan is enough).
2. Once created, click the **web icon (`</>`)** to register a web app. Skip Firebase Hosting — you're using GitHub Pages.
3. Copy the `firebaseConfig` object it gives you into `firebase-config.js`, replacing the placeholder values.
4. In the left sidebar go to **Build → Firestore Database → Create database**. Start in **production mode**, pick any region.
5. Go to the **Rules** tab and replace the contents with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /orders/{orderId} {
         allow read, create, update, delete: if true;
       }
     }
   }
   ```
   Wide open by design, matching your call not to add admin auth — `admin.html`'s "Mark Fulfilled" and "Delete" buttons write directly to Firestore from the browser, so they need `update`/`delete` allowed too. There's no login distinguishing a customer from you, so a rule that blocked `admin.html` would block everyone.
6. Click **Publish**. That's it — reload `index.html` and place a test order, then check `admin.html`.

**Note on privacy:** per your call, `admin.html` has no password — anyone with the URL (or anyone who inspects the page and calls Firestore directly) can read, edit, or delete orders and see customer names. It's not linked from the menu, but it isn't hidden either. If that changes, say the word and I'll add a password gate or real login and lock the rules down to match.

## Adding photos
Each section has an empty gold-bordered box until you add an image. Drop files into `assets/` using these exact names (or edit the `background-image` path in `index.html` if you rename them):

- `assets/iced-coffee.jpg`
- `assets/breakfast.jpg`
- `assets/protein-shakes.jpg`
- `assets/protein-desserts.jpg`
- `assets/snacks.jpg`
- `assets/entrees.jpg`

Landscape shots around 1200x500px work best (the box is full-width, 220px tall, cropped via `background-position: center`).

## Publish to GitHub Pages
```bash
cd /c/Users/aaddi/abbads-menu
git init
git add .
git commit -m "Abbad's menu site"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```
Then in the repo: **Settings → Pages → Source: `main` branch, `/ (root)`**. Site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Preview locally
Just open `index.html` in a browser, or run:
```bash
cd /c/Users/aaddi/abbads-menu
python -m http.server 8000
```
then visit `http://localhost:8000`.
