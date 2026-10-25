# commit-bot-web 🟩

> Paint your GitHub contribution graph from an interactive web canvas — powered by the GitHub Git Data API. No local git required.

---

## 🌟 Overview

**commit-bot-web** is a fullstack Next.js web application that connects with your GitHub account, renders your real contribution heatmap, lets you draw or generate patterns, and creates backdated commits through the GitHub REST API.

### Features

- 🔗 **GitHub OAuth Login**: Quick 1-click connect with verified email detection.
- 📊 **Real GitHub Graph**: Fetched in real-time via GitHub GraphQL API.
- 🖌️ **Interactive Painting**: Click, drag, and paint individual cells or ranges.
- 🔤 **Text Typography & Preset Shapes**: 5×7 pixel font generator and built-in shapes (heart, star, smiley, check, skull, wave, diamond).
- 🖼️ **Client-Side Canvas Image Converter**: Drag and drop any image; client-side HTML5 Canvas maps pixel darkness to commit intensities.
- 🪣 **Full Year Fill**: Automatically fill entire calendar years with organic randomized daily commits.
- 🎲 **Random Scatter**: Scatter N commits organically across random dates.
- ⚡ **Sequential Git Data API Pipeline**: Commits are created sequentially (blob → tree → commit) and chained with custom `author.date` ISO 8601 timestamps.
- 🔒 **Zero Credential Leakage**: Secrets and access tokens live exclusively on the server in encrypted `httpOnly` cookies.

---

## 🛠️ How It Works (The Backdating Mechanism)

GitHub calculates contribution graph activity based on the commit's `author.date` field, not the time the API request was made:

```http
POST https://api.github.com/repos/{owner}/{repo}/git/commits
Authorization: Bearer {token}

{
  "message": "chore: update",
  "author": {
    "name": "User Name",
    "email": "user@example.com",
    "date": "2024-03-15T14:23:00Z"    <-- Custom backdated timestamp
  },
  "committer": {
    "name": "User Name",
    "email": "user@example.com",
    "date": "2024-03-15T14:23:00Z"
  },
  "parents": ["<sha-of-parent-commit>"],
  "tree": "<sha-of-tree>"
}
```

### Commit Pipeline:
1. `GET /repos/{owner}/{repo}/git/refs/heads/{branch}`: Resolves HEAD commit SHA.
2. `POST /repos/{owner}/{repo}/git/blobs`: Writes updated timestamp line to `contributions.md`.
3. `POST /repos/{owner}/{repo}/git/trees`: Creates a new tree pointing to the blob.
4. `POST /repos/{owner}/{repo}/git/commits`: Creates the commit with custom `author.date`.
5. Checkpoint updates every 50 commits to protect progress against connection timeouts.
6. `PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}`: Updates the branch reference (`force: true`).

---

## 🔒 Security Architecture

| Security Threat | Mitigation |
|---|---|
| Token theft via XSS | `gh_token` is stored in an `httpOnly`, `sameSite: 'lax'` cookie. Browser JavaScript cannot access it. |
| Client secret leakage | `GITHUB_CLIENT_SECRET` is used exclusively in server routes (`/api/auth/github/callback`). |
| CSRF attacks | SameSite cookie policy prevents cross-site request forging. |
| Malicious framing | Security headers include `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`. |
| Unverified commit author | Commit author email is fetched from GitHub's verified primary emails list. |

---

## 🚀 Setup & Local Development

### 1. Create a GitHub OAuth App

1. Visit [GitHub Developer Settings → OAuth Apps → New OAuth App](https://github.com/settings/developers).
2. Fill in the details:
   - **Application name:** `commit-bot-web`
   - **Homepage URL:** `http://localhost:3000` (for dev) or `https://your-app.vercel.app` (for production)
   - **Authorization callback URL:** `http://localhost:3000/api/auth/github/callback`
3. Click **Register application**.
4. Copy the **Client ID** and click **Generate a new client secret**.

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```env
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `GITHUB_CLIENT_ID` (Your GitHub OAuth Client ID)
   - `GITHUB_CLIENT_SECRET` (Your GitHub OAuth Client Secret)
   - `NEXT_PUBLIC_BASE_URL` (`https://your-domain.vercel.app`)
4. In your GitHub OAuth App settings, update the callback URL to:
   ```
   https://your-domain.vercel.app/api/auth/github/callback
   ```
   *(Or create a separate OAuth App specifically for production).*
5. Click **Deploy**.

---

## ⚠️ Important Rules for GitHub Heatmap Updates

- **Default Branch Only:** Commits must be on the repository's default branch (usually `main`).
- **No Forks:** Commits to forked repositories do **not** count on GitHub's contribution graph. Always commit to a repository you own.
- **Verified Email:** The author email must be a verified email on your GitHub account.
- **Update Delay:** GitHub caches contribution graphs. While commits appear in your repository immediately, the heatmap may take anywhere from 5 minutes to 24 hours to recalculate.
