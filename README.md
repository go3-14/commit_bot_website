<div align="center">

# phakeit

**Paint your GitHub contribution graph.**<br>
Draw on a heatmap and it creates the backdated commits for you.

[**phakeit.vercel.app**](https://phakeit.vercel.app)

<br>

![phakeit interface showing the contribution heatmap, paint tools and commit queue](docs/screenshots/overview.png)

</div>

## About

A personal hobby project, built for fun and to experiment with the GitHub API. Click or drag on the graph to queue days, then sign in with GitHub and push the commits to one of your own repositories.

Built with Next.js, React, TypeScript and Tailwind CSS.

## Run it locally

```bash
npm install
npm run dev
```

You need a GitHub OAuth App and a `.env.local` file. Full steps, environment variables and security notes are in [docs/SETUP.md](docs/SETUP.md).

## Responsible use

I don't encourage or support faking a public profile, and I have never used this tool on my own main account. Backdated commits are real commits with the dates you choose, and they stay visible in the repository's history. Please don't use it to misrepresent your work to employers or anyone else.
