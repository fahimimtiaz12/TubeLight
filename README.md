# 🚀 TubeLight — Your Desk Lamp for Ideas ✨

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License">
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B67F?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/InsForge-00A3FF?style=flat&logo=supabase&logoColor=white" alt="InsForge Backend">
  <img src="https://img.shields.io/badge/Made%20with%20❤️-FA4B4B" alt="Made with Love">
</p>

<p align="center">
  <strong>A calm, personal, multimodal AI workspace.</strong><br>
  Chat with frontier models • Ground answers in your own documents • Private image library • Powered by InsForge
</p>

---

<div align="center">
  <img src="https://img.shields.io/github/stars/fahimimtiaz12/TubeLight?style=social" alt="GitHub Stars">
  <img src="https://img.shields.io/github/forks/fahimimtiaz12/TubeLight?style=social" alt="GitHub Forks">
</div>

---

<div align="center">

**TubeLight** is a beautiful, distraction-free web app that turns InsForge into your personal AI thinking companion.  
Think of it as a **soft tube light glowing over your late-night desk** — focused, warm, and always ready to help you explore ideas.

**[🌐 Live Demo](https://93nrkbcg.insforge.site)** • **[⭐ Star this repo](https://github.com/fahimimtiaz12/TubeLight)**

</div>

---

## ✨ Features

| Feature                        | Description |
|--------------------------------|-------------|
| 🔐 **Secure Personal History** | Private chats scoped only to you |
| 🌐 **Multi-Model Switching**   | GPT-4o mini, Claude 3.5 Sonnet, Gemini & more |
| 📄 **Document RAG**            | Ask questions grounded in your PDFs, Markdown & text |
| 🖼️ **Private Image Library**   | Upload & reference images (JPEG, PNG, WebP, GIF, SVG) |
| ⚡ **Fast & Clean UI**          | Built with Vite + Tailwind — beautiful and responsive |

Built for **learners, builders, researchers, writers, and solo creators** who want one peaceful place to think deeply with AI.

---

## 👤 Author & Credits

**Md Fahim Imtiaz Khan**  
*B.Eng in Software Engineering*

Thank you for checking out TubeLight!  
If it helps you think clearer or build faster, please ⭐ the repo — it means the world.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js **20+** (recommended)
- npm
- An InsForge project (free tier is perfect)

### Step-by-Step

1. **Link your InsForge project**
   ```bash
   npx @insforge/cli login
   npx @insforge/cli link

Environment variablesBashcp .env.example .envFill in:envVITE_INSFORGE_URL=<your oss_host from .insforge/project.json>
VITE_INSFORGE_ANON_KEY=<run: npx @insforge/cli secrets get ANON_KEY>
Run the appBashnpm install
npm run dev
Open http://localhost:5173

💡 Tip: Add http://localhost:5173 to Allowed Auth Redirects in your InsForge dashboard.

🗄️ Database & Storage

Migrations in /migrations automatically create:
Vector search tables (for RAG)
Chat history
Row-level security (RLS) scoped to the signed-in user

Storage: All documents & images are saved in the private tubelight-docs bucket.

Everything is private by default — only you can access your data.

🌍 Deploy to Production
Bash# 1. Build
npm run build

# 2. Set environment variables
npx @insforge/cli deployments env set VITE_INSFORGE_URL <your-production-url>
npx @insforge/cli deployments env set VITE_INSFORGE_ANON_KEY <your-anon-key>

# 3. Deploy
npx @insforge/cli deployments deploy .
vercel.json is included for perfect SPA routing.

🛠️ Tech Stack

Frontend: Vite + React + TypeScript + Tailwind CSS
Backend: InsForge (Auth • Postgres • Vector Search • Storage • AI Gateway)
Deployment: Vercel (via InsForge CLI)


📜 License
MIT License — Free to use, modify, and build upon for your own projects.
See LICENSE for details.

🤝 Contributing
We welcome contributions of all sizes!
Please read our Contributing Guide first.


TubeLight — crafted with care — 2026 🌟
Your calm corner of the internet for thinking with AI.


Made with ❤️ by Md Fahim Imtiaz Khan

Happy building & thinking!
Any questions? Open an issue or reach out — I’d love to help you customize TubeLight for your workflow.

⭐ If you like this project, please star the repo! It helps others discover it.
