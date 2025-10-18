# Contributing to TenRusl Droid IconLab (TRDIL)

Thanks for considering a contribution! 🎉  
This project is a static PWA (no build step). We welcome bug reports, features, docs, and UX/DX improvements.

> By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🧰 Local Setup

```bash
# Clone your fork
git clone --depth 1 https://github.com/<you>/TenRusl-Droid-IconLab.git
cd TenRusl-Droid-IconLab

# Serve locally (pick one)
npx serve . -p 5173
# or
python -m http.server 5173
# or
bunx serve . -p 5173
```

Open **http://localhost:5173**.  
Ensure the Service Worker is reachable at **/sw.js** (or set `Service-Worker-Allowed: /` if under `/assets/js/sw.js`).

---

## 🌳 Branching & Workflow

1. **Fork** the repo and clone your fork.
2. Create a feature branch from `main`:
    ```bash
    git checkout -b feat/<short-feature-name>
    ```
3. Make your changes and commit with **conventional commits**:
    ```bash
    git add -A
    git commit -m "feat: add font size slider for watermark"
    ```
4. Push and open a PR:
    ```bash
    git push origin feat/<short-feature-name>
    ```

Keep PRs focused and include before/after notes for UI changes.

---

## 📝 Conventional Commits

Examples:

```
feat: add adaptive anydpi-v26 toggle
fix: correct watermark X/Y coordinate mapping
docs: update README ZIP rules
chore: bump vendor libs (JSZip, FileSaver)
refactor: simplify compose pipeline
perf: cache canvases across previews
test: add exporter unit tests (if applicable)
```

---

## ✅ PR Checklist

-   [ ] **ZIP layout** matches spec (legacy sizes, optional round, optional anydpi‑v26 with XML).
-   [ ] **Preview grid** renders crisp at multiple sizes (no stretching).
-   [ ] **Watermark**: text, font family, **font size slider**, opacity, and **X/Y numeric** positioning all work.
-   [ ] **Safe‑area** overlay shows in preview (not in export).
-   [ ] **PWA**: generation works offline; vendors cached.
-   [ ] **CSP** compatible; no external network calls required.
-   [ ] **i18n** keys updated for labels/help text.
-   [ ] **SW `VERSION`** bumped if assets changed.
-   [ ] Docs updated (README / ZIP rules / screenshots if UI changed).

---

## 🌐 Adding i18n

-   Add translations in `/assets/i18n/` (e.g., `fr.json`).
-   Keep labels concise to avoid truncation.

---

## 🛡️ Security & Headers

See `/_headers` for CSP and caching. If you add external vendors, adjust CSP accordingly.

---

## 🐞 Good Bug Reports

Please include:

-   Minimal reproduction steps (files or logo used)
-   Expected vs actual behavior
-   Browser/OS/version
-   Console logs and screenshots where relevant

Search existing issues before opening a new one.

---

## 📜 License

By contributing, you agree that your contributions are licensed under this repository’s **MIT License**.
