# TenRusl Droid IconLab (TRDIL) — Android Adaptive Icons Generator (PWA, Offline)

Private, fast, and **offline‑first** tool to generate **Android launcher icons** consistently:
- Legacy mipmaps (**ldpi…xxxhdpi**), optional **round**
- Adaptive **anydpi‑v26** (**foreground/background + XML**)
- Live **preview grid**, **safe‑area** overlay, and **ZIP export**

![PWA](https://img.shields.io/badge/PWA-Ready-8b5cf6)
![License](https://img.shields.io/badge/License-MIT-green)
![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Canvas%20%7C%20PWA-111)
![Build](https://img.shields.io/badge/Build-None%20%28Static%20Site%29-2ea44f)

Live: **https://tenrusl-droid-iconlab.pages.dev/**

---

## Table of Contents

- [✨ Key Features](#-key-features)
- [▶️ Quick Demo](#️-quick-demo)
- [📦 Install (Open Source)](#-install-open-source)
- [🚀 Deployment](#-deployment)
- [🗂️ Directory Structure](#️-directory-structure)
- [⚙️ How It Works](#️-how-it-works)
- [📦 ZIP Output Rules](#-zip-output-rules)
- [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
- [🖨️ Export & Preview](#️-export--preview)
- [📲 PWA & Caching](#-pwa--caching)
- [🌍 I18N](#-i18n)
- [🛡️ Security Headers (Recommended)](#️-security-headers-recommended)
- [🛠️ Development](#️-development)
- [🐞 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📜 Code of Conduct](#-code-of-conduct)
- [🏆 Credits](#-credits)
- [👤 Author](#-author)
- [🗺️ Roadmap](#-roadmap)
- [📄 License](#-license)

---

## ✨ Key Features

- **Upload PNG/SVG** (drag‑and‑drop or click)
- **Auto‑fit logo** with padding control
- **Shapes**: *squircle*, *circle*, *rounded*
- **Background**: *solid* or *linear gradient* (A & B colors)
- **Watermark** (optional):
  - **Text**, **opacity slider**
  - **Font family** (system stacks & popular choices)
  - **Font size** slider (reference px @ 432), scaled per output size
  - **Manual position** via pad and **numeric X/Y** coordinates (0…100 of inner area)
- **Preview grid** (multiple sizes) with **safe‑area overlay**
- **ZIP export** with all densities, adaptive anydpi‑v26, optional preview sheet
- **Offline‑first PWA**, **no network calls** (privacy‑friendly)

---

## ▶️ Quick Demo

1) Upload or drop your **logo** (PNG/SVG).  
2) Set **padding**, **shape**, **background** mode + colors.  
3) (Optional) Enter **watermark** text, choose **font**, tweak **opacity** & **size**, drag the pad or set **X/Y**.  
4) Inspect the **preview grid**.  
5) Click **Generate ZIP** — ready to drop into your Android project.

---

## 📦 Install (Open Source)

```bash
# Clone
git clone --depth 1 https://github.com/<you>/TenRusl-Droid-IconLab.git
cd TenRusl-Droid-IconLab

# Serve (pick one)
npx serve . -p 5173
# or
python -m http.server 5173
# or
bunx serve . -p 5173
```

Open **http://localhost:5173**.

> No build step. Keep **sw.js** at `/` scope (or set `Service-Worker-Allowed: /` header when serving from `/assets/js/sw.js`).

---

## 🚀 Deployment

### Cloudflare Pages (recommended)
- **Build command**: _(empty)_  
- **Output directory**: `/`  
- Place `/_headers` at repo root (CSP, caching, SW scope).

### Any static host
- Upload as is.
- Mirror security headers (see below).

---

## 🗂️ Directory Structure

```
/
├─ index.html
├─ manifest.webmanifest
├─ robots.txt
├─ sitemap.xml
├─ sitemap-index.xml
├─ humans.txt
├─ _headers
├─ assets/
│  ├─ css/
│  │  ├─ app.css
│  │  ├─ chrome.css
│  │  ├─ header.css
│  │  ├─ footer.css
│  │  ├─ language.css
│  │  └─ theme.css
│  ├─ js/
│  │  ├─ app.js
│  │  ├─ header.js / footer.js / theme.js / language.js
│  │  └─ modules/
│  │     ├─ rendering/compose.js (mask + compose)
│  │     ├─ rendering/mask.js
│  │     ├─ generator/{exporter.js, zip.js, densities.js}
│  │     └─ utils/{canvas.js, color.js, image.js}
│  ├─ vendor/ (JSZip, FileSaver)
│  ├─ plugin/fontawesome/
│  └─ i18n/{en.json,id.json}
```

---

## ⚙️ How It Works

**Pipeline**
1. **Mask** path (squircle/circle/rounded) built at size N.  
2. **Background** fill: solid or gradient (A→B).  
3. **Logo** is **contain‑fit** into inner box with **padPct** and drawn with high‑quality smoothing.  
4. (Preview) **Safe‑area** overlay (Android reference 72/108).  
5. **Watermark** (if provided): font family, scaled **font size**, **opacity**, and **position**:
   - If **coord.x/y** exists → treat as 0–100 of the inner box (pad‑aware), centered baseline.
   - Else, **pos** anchor fallback (e.g., bottom‑right).

**Export**
- Generate **legacy** (36,48,72,96,144,192).  
- Optional **round** variants.  
- Optional **anydpi‑v26** (`ic_launcher_foreground.png`, `ic_launcher_background.png`, `ic_launcher.xml`).  
- Optional **preview-sheet.png** and **README.txt** inside the ZIP.

---

## 📦 ZIP Output Rules

**Legacy densities**
- `mipmap-ldpi/ic_launcher.png` (36)
- `mipmap-mdpi/ic_launcher.png` (48)
- `mipmap-hdpi/ic_launcher.png` (72)
- `mipmap-xhdpi/ic_launcher.png` (96)
- `mipmap-xxhdpi/ic_launcher.png` (144)
- `mipmap-xxxhdpi/ic_launcher.png` (192)

Optional: **`ic_launcher_round.png`** in each folder (if selected).

**Adaptive anydpi‑v26** (optional)
- `mipmap-anydpi-v26/ic_launcher_foreground.png` (432)  
- `mipmap-anydpi-v26/ic_launcher_background.png` (432)  
- `mipmap-anydpi-v26/ic_launcher.xml`

**Preview & notes**
- `preview/preview-sheet.png`  
- `README.txt`

---

## ⌨️ Keyboard Shortcuts

- `Alt + ↑` / `Alt + ↓` — switch details sections (browser/UA dependent)
- `Esc` — close any focused control (UA dependent)

---

## 🖨️ Export & Preview

- Preview grid renders multiple sizes for quick visual QA.
- Exported PNGs are drawn on **DPR‑aware canvas** for crisp edges.

---

## 📲 PWA & Caching

Service Worker precaches the app shell and vendors so generation works **offline**:

- **CORE**: HTML, CSS, JS, manifest, icons
- **VENDORS**: **JSZip**, **FileSaver.js**
- Navigations: network‑then‑cache (optional)

> Bump a SW `VERSION` to invalidate old caches after asset changes.

---

## 🌍 I18N

- English `en.json` and Indonesian `id.json`
- Language switch updates all labels at runtime

---

## 🛡️ Security Headers (Recommended)

Use `_headers` similar to:

```
/*
  Content-Security-Policy: default-src 'self'; img-src 'self' blob: data:; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

---

## 🛠️ Development

- Entry: `index.html`
- Core: `assets/js/app.js`
- Composition: `assets/js/modules/rendering/compose.js`
- Exporter/ZIP: `assets/js/modules/generator/*`
- PWA: `assets/js/sw.js`
- Theme: `assets/css/*`
- i18n: `assets/i18n/*.json`

---

## 🐞 Troubleshooting

- **Image won’t load** → ensure valid **PNG/SVG**, check CSP.  
- **Colors look off** → verify CSS variables; for gradient, both A & B must be valid hex/rgb.  
- **Watermark not visible** → increase **opacity/size**, or move **X/Y** away from edges.  
- **ZIP missing anydpi** → enable **“Include mipmap-anydpi-v26 (adaptive)”**.  
- **SW not active** → serve over HTTP(S) and hard‑reload (DevTools → Application → Clear storage).  
- **Safari blurring** → avoid extreme font sizes; the app sets `imageSmoothingQuality = high`.  

---

## 🤝 Contributing

We welcome issues and PRs. See **CONTRIBUTING.md**.

---

## 📜 Code of Conduct

By participating, you agree to the **Contributor Covenant v2.1**. See **CODE_OF_CONDUCT.md**.

---

## 🏆 Credits

- **JSZip**
- **FileSaver.js**
- **Font Awesome** (icons)

---

## 👤 Author

- **TenRusl (Andika Rusli)**
- **Site**: https://tenrusl-droid-iconlab.pages.dev
- **GitHub**: https://github.com/kakrusliandika

---

## 🗺️ Roadmap

- [ ] Drag handle overlay for watermark with snap‑to‑grid
- [ ] Export SVG mask previews
- [ ] More shape presets (rounded‑8, rounded‑12, etc.)
- [ ] CLI wrapper (Node) to batch‑generate
- [ ] Theming preset export/import

---

## 📄 License

**MIT** — see `LICENSE`.
