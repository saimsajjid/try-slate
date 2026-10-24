# 🎓 Slate — Academic Operating System (Fall 2026)

> **"Built by Saim & run by Slate"**  
> A fast, zero-friction academic companion for BSCS Green (Fall 2026).

🌐 **Live URL:** [https://try-slate.web.app](https://try-slate.web.app)  
🚀 **Hosting:** Firebase Hosting (Google CDN)  
⚡ **Stack:** React 19, TypeScript, Tailwind CSS v4, Vite

---

## 🌟 Features

- **⚡ Instant 0ms Navigation:** JSON-driven recursive tree architecture (`semester.json`).
- **👁️ Native In-Browser Previews:** View PDFs, PPTX slides, DOCX files, Markdown notes, and video lectures directly in the browser with zero IDM hijacking.
- **⌨️ 2D Grid Keyboard Controls:**
  - `←` / `→` / `↑` / `↓` : Move between columns and rows with balanced eye-level viewport centering.
  - `Enter` : Open selected course, folder, or file preview.
  - `Backspace` / `Esc` : Step back up a directory level or close preview.
  - `1`–`5` : Jump to Monday through Friday in the timetable.
  - `?` : Open keyboard shortcut cheat sheet.
- **🇵🇰 Optimized for Pakistan Internet:**
  - HTTP 206 Byte-Range streaming for sub-second first-page rendering.
  - Aggressive asset caching for sub-30ms load times.
- **🎨 Neo-Brutalist Whiteboard Design:**
  - Hand-drawn subject logos with interactive physics/animations.
  - Custom interactive vector Slate mascot featuring "The Hello Wave" state in the footer.
  - Zero-Emoji Law: strictly clean vector SVGs, zero fake SaaS badges.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Test production build
npm run build
```

---

## 🚀 Deployment & CI/CD

This repository is connected to Firebase Hosting via GitHub Actions. Every push to the `main` branch automatically triggers the build and deployment pipeline to [https://try-slate.web.app](https://try-slate.web.app).

Manual deploy:
```bash
firebase deploy --only hosting --project try-slate
```
