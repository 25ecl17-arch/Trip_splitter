# Trip Split

A group trip expense splitter that reveals a "travel personality" card for each person based on their spending.

## Deploy to GitHub Pages (no local setup needed)

1. Create a new repo on GitHub (e.g. `trip-splitter`) — public, no README/gitignore needed since this folder has them.
2. Upload all files in this folder to that repo. Easiest way:
   - Go to your new repo → **Add file → Upload files**
   - Drag in everything from this folder (including the hidden `.github` folder — if your browser hides it, use `git` instead, see below)
   - Commit directly to `main`
3. In the repo, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **GitHub Actions**.
5. Go to the **Actions** tab — a workflow called "Deploy to GitHub Pages" should already be running (it triggers on every push to `main`). Wait for it to finish (green check).
6. Your site is live at:
   `https://<your-username>.github.io/<repo-name>/`

The URL also appears at **Settings → Pages** once the first deployment succeeds.

## Deploying with git instead (recommended, handles the hidden .github folder automatically)

```bash
cd trip-splitter
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then do steps 3–6 above.

## Local development (optional)

```bash
npm install
npm run dev
```

## Making changes later

Edit `src/App.jsx`, commit, and push to `main` — the GitHub Action rebuilds and redeploys automatically.
