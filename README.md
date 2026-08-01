# Portfolio Project

> A polished, motion-driven portfolio website built with Next.js, React, TypeScript, and Three.js.

---

## ✨ What This App Is

This repo contains a visually-rich portfolio landing page with:

- a **studio-style hero section**
- a **desktop-only 3D helix gallery**
- a **clean, touch-friendly project list**
- custom cursor and hover effects
- mobile-first responsive behavior

It is designed to showcase high-quality web projects while keeping the mobile experience clean and readable.

---

## 🚀 Highlights

| Feature | What it does |
|---|---|
| Interactive Hero | Animated headline, intro copy, and centered mobile layout |
| 3D Helix Gallery | Desktop-only rotating project cards created with Three.js |
| Project List | Categorized projects with hover and tap interactions |
| Cursor & Visuals | Custom cursor, glow effects, and animation polish |
| Responsive Design | Mobile-first, centered layout, no unwanted bottom scroll |

---

## 🧱 Project Structure

- `src/app/` — application entry and page layout
- `src/components/` — reusable UI pieces: `Hero`, `ProjectList`, `HelixGallery`, custom cursors
- `src/lib/projects.ts` — project metadata powering gallery cards and list items

---

## 🛠️ Technologies Used

- `Next.js`
- `React`
- `TypeScript`
- `Three.js`
- `Framer Motion`
- `GSAP`
- `CSS Modules`

---

## ▶️ Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📌 Notes

- The **3D helix gallery is intentionally desktop-only** and hides on smaller screens.
- The mobile layout is built to keep content centered and avoid extra vertical scrolling.
- This project is focused on **presentation, motion, and visual polish** rather than a traditional multi-page app.
