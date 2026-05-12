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

**[⭐ Star this repo](https://github.com/fahimimtiaz12/TubeLight)**

</div>

---

## ✨ Features

| Feature                        | Description |
|--------------------------------|-------------|
| 🔐 **Secure Personal History** | Private chats scoped only to you |
| 🌐 **Multi-Model Switching**   | GPT-4o mini, Claude 3.5 Sonnet, Gemini & more |
| 📄 **Document RAG**            | Ask smart questions grounded in your own PDFs, Markdown & text files |
| ⚡ **Fast & Beautiful UI**     | Modern, clean and responsive design with Tailwind CSS |

Built for **learners, builders, researchers, writers, and solo creators** who want one peaceful place to think deeply with AI.

---

## 📸 Screenshots & Demo

<div align="center">

![Login / Sign Up](./screenshots/login-signup.png)  
![Chat Interface](./screenshots/chat-interface.png)  
![Document Upload](./screenshots/document-upload.png)  
![Model Switcher](./screenshots/model-switcher.png)

</div>

---

## 👤 Author & Connect

**Md Fahim Imtiaz Khan**  
*B.Eng in Software Engineering*

- **Portfolio** → [mdfahimimtiazkhan.dev](https://mdfahimimtiazkhan.dev/)
- **GitHub** → [@fahimimtiaz12](https://github.com/fahimimtiaz12)

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

Set up environment variablesBashcp .env.example .env
Install & RunBashnpm install
npm run dev
Open http://localhost:5173

💡 Tip: Add http://localhost:5173 to Allowed Auth Redirects in the InsForge dashboard.

🗄️ Database & Storage
Your app uses 4 main tables automatically created by the migrations:

tubelight_chats — Stores chat sessions and metadata
tubelight_messages — Individual messages in each chat
tubelight_chunks — Document chunks with vector embeddings (powers RAG)
tubelight_document_sources — Metadata of uploaded documents (PDFs, etc.)

Row-level security (RLS) is enabled so every user can only see their own data.
Storage: All documents and images are stored in the private bucket tubelight-docs.
Everything is private by default — only the signed-in user can access their data.

🌍 Deploy to Production
Bashnpm run build
npx @insforge/cli deployments deploy .

🛠️ Tech Stack

Frontend: Vite + React + TypeScript + Tailwind CSS
Backend: InsForge (Auth • Postgres • Vector Search • Storage • AI Gateway)


📜 License
MIT License — Free to use, modify, and build upon.

🤝 Contributing
We welcome contributions of all sizes!
Please read our Contributing Guide first.


TubeLight — crafted with care — 2026 🌟
Your calm corner of the internet for thinking with AI.
Made with ❤️ by Md Fahim Imtiaz Khan


Happy building & thinking!
Any questions? Open an issue or reach out — I’d love to help you customize TubeLight for your workflow.
⭐ If you like this project, please star the repo! It helps others discover it.