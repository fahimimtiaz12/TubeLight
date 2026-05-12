**✅ Got it! Here's exactly why you're seeing this:**

The screenshot you shared shows the **raw source** of your `README.md` file (not the rendered version).  

GitHub (and VS Code) is treating the entire file as plain text / code because your `README.md` **accidentally starts with a code fence** (` ```markdown `).  

That fence was part of how I presented the content in my previous message. When you copied it, the fence came along, so GitHub now thinks the whole README is one giant code block. That's why all the `<p align="center">`, `<img>`, `<div>`, and other HTML tags are showing up literally instead of turning into beautiful badges and centered text.

---

### 🔥 Quick Fix (30 seconds)

1. Open your `README.md` file  
2. **Delete everything** currently in it  
3. Copy the **clean version** below (starts directly with `# 🚀`)  
4. Paste it in  
5. Save the file  

```markdown
# 🚀 TubeLight — Your Desk Lamp for Ideas ✨

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License">
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B67F?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/InsForge-00A3FF?style=flat&logo=supabase&logoColor=white" alt="InsForge Backend">
</p>

<p align="center">
  <strong>A calm, personal, multimodal AI workspace.</strong><br>
  Connect to frontier models • Ground answers in your own files • Keep a private image library • All powered by InsForge.
</p>

---

<div align="center">

**TubeLight** is a beautiful, distraction-free web app that turns InsForge into your personal AI thinking companion.  
Think of it as a soft tube light glowing over your late-night desk — focused, warm, and always ready to help you explore ideas.

</div>

---

## ✨ What is TubeLight?

TubeLight is a **secure, user-owned multimodal chat interface** built on top of [InsForge](https://insforge.dev) — a modern, AI-native backend platform (Postgres + vector search + auth + storage + AI gateway).

### 🎯 Core Capabilities

- **🔐 Secure Sign-in & Personal History**  
  Every conversation is private and scoped to *you*. Chat history persists across sessions and devices.

- **🌐 Switch Frontier Models Instantly**  
  Seamlessly toggle between the latest models:  
  - GPT-4o mini  
  - Claude 3.5 Sonnet  
  - Gemini 1.5 Flash / Pro  
  (and more — powered by InsForge’s AI gateway)

- **📄 Document RAG (Retrieval-Augmented Generation)**  
  Upload **PDFs, Markdown, or plain text** files.  
  Ask questions grounded **only** in *your* documents — no generic internet answers.  
  Leverages InsForge’s vector search tables for fast, accurate retrieval.

- **🖼️ Personal Image Library**  
  Upload reference images (**JPEG, PNG, WebP, GIF, SVG**) to your private `tubelight-docs` bucket.  
  Use them as context for vision-capable models or keep them as visual inspiration.

Built for **learners, builders, researchers, writers, and solo creators** who want one peaceful place to think deeply with AI — without the noise of generic chatbots.

---

## 👤 Author & Credit

**Md Fahim Imtiaz Khan**  
*B.Eng in Software Engineering*

Thank you for checking out TubeLight!  
If it helps you think clearer or build faster, please ⭐ the repo — it means the world.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js **20+** (recommended)
- npm
- An InsForge project (free tier works great)

### Step-by-Step Setup

1. **Link your InsForge project**  
   ```bash
   npx @insforge/cli login
   npx @insforge/cli link
   ```
   → This creates `.insforge/project.json`

2. **Set up environment variables**
   ```bash
   cp .env.example .env          # macOS / Linux
   # or
   copy .env.example .env        # Windows
   ```

   Fill in:
   ```env
   VITE_INSFORGE_URL=<your oss_host from .insforge/project.json>
   VITE_INSFORGE_ANON_KEY=<run: npx @insforge/cli secrets get ANON_KEY>
   ```

3. **Install & Run**
   ```bash
   npm install
   npm run dev
   ```

4. **Open the app**  
   Visit `http://localhost:5173` (or the URL shown in your terminal).

> 💡 **Tip**: In the InsForge dashboard, add your dev URL (`http://localhost:5173`) to **Allowed Auth Redirects** if you’re using email verification or OAuth.

---

## 🗄️ Database & Storage

- **Migrations** live in the `/migrations` folder.  
  They automatically create:
  - Vector search tables (for RAG)
  - Chat history tables
  - Row-level security (RLS) policies scoped to the signed-in user

- **Storage**  
  All documents and images go into the private Supabase/InsForge bucket: **`tubelight-docs`**

Everything is private by default — only you can access your data.

---

## 🌍 Deploy to Production (InsForge → Vercel)

```bash
# 1. Build
npm run build

# 2. Set environment variables via CLI
npx @insforge/cli deployments env set VITE_INSFORGE_URL <your-production-url>
npx @insforge/cli deployments env set VITE_INSFORGE_ANON_KEY <your-anon-key>

# 3. Deploy
npx @insforge/cli deployments deploy .
```

`vercel.json` is already included for perfect SPA routing.

---

## 🛠️ Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: InsForge (Auth, Postgres, Vector Search, Storage, AI Gateway)
- **Styling**: Tailwind CSS + modern, clean UI
- **Deployment**: Vercel (via InsForge CLI)
- **AI**: Multi-model support through InsForge

---

## 📜 License

**MIT License**  
Use, modify, and build upon this project freely for your own work.  
If you ship something cool with it, I’d love to hear about it!

---

<div align="center">

**TubeLight** — *crafted with care* — 2026 🌟

*Your calm corner of the internet for thinking with AI.*

</div>

---

Made with ❤️ by [Md Fahim Imtiaz Khan](https://github.com/fahimimtiaz12)

---

**Happy building & thinking!**  
Any questions? Open an issue or reach out — I’d love to help you customize TubeLight for your workflow.
```
