// C:\laragon\www\TenRusl-Droid-IconLab\assets\js\language.js
// ESM — i18n TRDIL (EN/ID) — SELARAS DENGAN header.js (TRDV)
// - Global window.TRI18N { t, getLang, setLang, toggleUiLang }
// - Persist ke 2 key LS: "trdil:lang" & "tenrusl.uiLang"
// - Set <html lang="..">, merge fallback, auto-translate DOM
// - Dispatch & tangkap event "tenrusl:i18nUpdated" agar header badge sinkron

const LS_KEY_TRDIL = "trdil:lang";
const LS_KEY_HDR = "tenrusl.uiLang";
const DEFAULT_LANG = "en";
const SUPPORTED = new Set(["en", "id"]);
const I18N_BASE = "assets/i18n";

// Fallback minimum supaya UI kebaca sebelum JSON termuat
const FALLBACK = {
    en: {
        "app.name": "TenRusl Droid IconLab",
        "app.tagline": "Android adaptive icons generator — fast, offline, consistent.",
        "ui.language": "Language",
        "ui.step1": "1) Upload Logo",
        "ui.dropHint": "Drag & drop PNG/SVG or click to choose.",
        "ui.noFile": "No file selected.",
        "ui.step2": "2) Settings",
        "ui.padding": "Padding",
        "ui.shape": "Shape",
        "shape.squircle": "Squircle",
        "shape.circle": "Circle",
        "shape.rounded": "Rounded",
        "ui.background": "Background",
        "bg.mode": "Mode",
        "bg.solid": "Solid",
        "bg.gradient": "Gradient",
        "bg.colorA": "Color A",
        "bg.colorB": "Color B",
        "ui.watermark": "Watermark (optional)",
        "wm.text": "Text",
        "wm.opacity": "Opacity",
        "wm.position": "Position",
        "pos.br": "Bottom-Right",
        "pos.bl": "Bottom-Left",
        "pos.tr": "Top-Right",
        "pos.tl": "Top-Left",
        "opt.round": "Include legacy round icon",
        "opt.anydpi": "Include mipmap-anydpi-v26 (adaptive)",
        "opt.preview": "Include preview sheet (PNG)",
        "cta.generate": "Generate ZIP",
        "note.privacy": "All local. No network calls.",
        "ui.step3": "3) Preview",
        "footer.offline": "PWA • Offline • No telemetry",
        "footer.privacy": "Privacy",
        "footer.term": "Term",
        "footer.cookies": "Cookies",

        "err.noLogo": "Please upload a logo first.",
        "err.zipVendors": "ZIP vendors not loaded. Ensure jszip.min.js & FileSaver.min.js are available.",
        "err.loadImage": "Failed to load image. Please provide a valid PNG/SVG.",
    },
    id: {
        "app.name": "TenRusl Droid IconLab",
        "app.tagline": "Generator adaptive icons Android — cepat, offline, konsisten.",
        "ui.language": "Bahasa",
        "ui.step1": "1) Upload Logo",
        "ui.dropHint": "Seret & lepas PNG/SVG atau klik untuk memilih.",
        "ui.noFile": "Belum ada file.",
        "ui.step2": "2) Pengaturan",
        "ui.padding": "Padding",
        "ui.shape": "Bentuk",
        "shape.squircle": "Squircle",
        "shape.circle": "Lingkaran",
        "shape.rounded": "Rounded",
        "ui.background": "Latar",
        "bg.mode": "Mode",
        "bg.solid": "Solid",
        "bg.gradient": "Gradient",
        "bg.colorA": "Warna A",
        "bg.colorB": "Warna B",
        "ui.watermark": "Watermark (opsional)",
        "wm.text": "Teks",
        "wm.opacity": "Opacity",
        "wm.position": "Posisi",
        "pos.br": "Kanan-Bawah",
        "pos.bl": "Kiri-Bawah",
        "pos.tr": "Kanan-Atas",
        "pos.tl": "Kiri-Atas",
        "opt.round": "Sertakan ikon legacy bulat",
        "opt.anydpi": "Sertakan mipmap-anydpi-v26 (adaptive)",
        "opt.preview": "Sertakan preview sheet (PNG)",
        "cta.generate": "Buat ZIP",
        "note.privacy": "Semua lokal. Tidak ada panggilan jaringan.",
        "ui.step3": "3) Pratinjau",
        "footer.offline": "PWA • Offline • Tanpa telemetry",
        "footer.privacy": "Privasi",
        "footer.term": "Kebijakan",
        "footer.cookies": "Cookies",

        "err.noLogo": "Upload logo terlebih dahulu.",
        "err.zipVendors": "Vendor ZIP belum dimuat. Pastikan jszip.min.js & FileSaver.min.js tersedia.",
        "err.loadImage": "Gagal memuat gambar. Pastikan berkas PNG/SVG valid.",
    },
};

let currentLang = detectInitialLang();
let dict = { ...FALLBACK[currentLang] };

boot();

/* ================= core ================= */
function detectInitialLang() {
    // Prioritaskan TRDV header key → lalu TRDIL key → fallback navigator
    try {
        const fromHdr = localStorage.getItem(LS_KEY_HDR);
        if (fromHdr && SUPPORTED.has(fromHdr)) return fromHdr;
        const fromTrdil = localStorage.getItem(LS_KEY_TRDIL);
        if (fromTrdil && SUPPORTED.has(fromTrdil)) return fromTrdil;
    } catch {}
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("id")) return "id";
    return DEFAULT_LANG;
}

async function loadLangPayload(lang) {
    const url = `${I18N_BASE}/${lang}.json`;
    try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        return { ...FALLBACK[lang], ...json };
    } catch {
        return { ...FALLBACK[lang] };
    }
}

async function setLang(lang) {
    if (!SUPPORTED.has(lang)) lang = DEFAULT_LANG;
    // muat payload & merge
    dict = await loadLangPayload(lang);
    currentLang = lang;

    // persist ke 2 key agar header.js & app konsisten
    try {
        localStorage.setItem(LS_KEY_TRDIL, lang);
        localStorage.setItem(LS_KEY_HDR, lang);
    } catch {}

    // reflect ke <html lang="..">
    document.documentElement.lang = lang;

    // translate DOM sekarang juga
    translateDocument();

    // beritahu header.js & lainnya
    document.dispatchEvent(new CustomEvent("tenrusl:i18nUpdated", { detail: { lang } }));
}

function getLang() {
    return currentLang;
}

function toggleUiLang() {
    const next = currentLang === "en" ? "id" : "en";
    setLang(next);
}

export function t(key, fallback = "") {
    return dict[key] ?? fallback ?? key;
}

export function translateDocument(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key) return;
        // jika elemen punya child .label (gaya header.js), hormati itu
        const label = el.querySelector?.(".label");
        const txt = t(key, label ? label.textContent : el.textContent);
        if (label) label.textContent = txt;
        else el.textContent = txt;
    });
}

export function getCurrentLang() {
    return getLang();
}

/* ============ boot & wiring ============ */
function boot() {
    // kalau masih ada <select id="langSelect"> di masa depan, sinkronkan
    const sel = document.getElementById("langSelect");
    if (sel) {
        sel.value = currentLang;
        sel.addEventListener("change", () => {
            const val = sel.value;
            if (SUPPORTED.has(val)) setLang(val);
        });
    }

    // render awal pakai fallback lalu fetch JSON
    document.documentElement.lang = currentLang;
    translateDocument();
    setLang(currentLang); // load JSON & broadcast event

    // Dengarkan event dari header fallback
    document.addEventListener("tenrusl:i18nUpdated", (e) => {
        const next = (e?.detail?.lang || "").toLowerCase();
        if (SUPPORTED.has(next) && next !== currentLang) {
            // Hindari loop: hanya set jika beda
            setLang(next);
        }
    });

    // Expose global API agar header.js bisa panggil
    window.TRI18N = window.TRI18N || {
        t,
        getLang,
        setLang,
        toggleUiLang,
    };
}
