// C:\laragon\www\TenRusl-Droid-IconLab\assets\js\app.js
// ESM — upload → detect → preview → export ZIP

import { getState, updateSettings, setFile, setImage, loadSettings, saveSettings } from "../modules/state.js";
import { loadImageFromFile } from "../modules/utils/image.js";
import { detectTransparency, dominantColor } from "../modules/utils/color.js";
import { renderIcon } from "../modules/rendering/compose.js";
import { generateAll } from "../modules/generator/exporter.js";
import { saveZip } from "../modules/generator/zip.js";
import { getCurrentLang, translateDocument } from "./language.js";

const qs = (s) => document.querySelector(s);

// DOM refs
const file = qs("#file");
const drop = qs("#drop");
const shape = qs("#shape");
const bgMode = qs("#bgMode");
const bgA = qs("#bgA");
const bgB = qs("#bgB");
const wmText = qs("#wmText");
const wmFontSel = qs("#wmFont");
const wmFontSize = qs("#wmFontSize");
const withRound = qs("#withRound");
const withAnyDpi = qs("#withAnyDpi");
const withPreview = qs("#withPreview");
const btnGen = qs("#btnGen");
const previews = qs("#previews");
const fileMeta = qs("#fileMeta");

// Manual position controls (px @ 432 ref)
const REF = 432;
const posPad = /** @type {HTMLCanvasElement|null} */ (qs("#posPad"));
const posCtx = posPad ? posPad.getContext("2d") : null;
const posX = /** @type {HTMLInputElement|null} */ (qs("#wmPosX"));
const posY = /** @type {HTMLInputElement|null} */ (qs("#wmPosY"));
const coordX = qs("#wmCoordX");
const coordY = qs("#wmCoordY");

const PREVIEW_SIZES = [48, 72, 96, 144, 192, 256, 384, 512, 768, 1024];

// Persist settings
loadSettings();
window.addEventListener("beforeunload", saveSettings);

// SW (opsional)
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* ====== FONT MAP ====== */
const FONT_MAP = {
    "system-sans": "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    "system-serif": "'Times New Roman', Georgia, 'Noto Serif', serif",
    "system-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    "sf-pro":
        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    "segoe-ui": "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    roboto: "Roboto, 'Noto Sans', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
    inter: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    poppins: "'Poppins', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    "helvetica-neue": "'Helvetica Neue', Helvetica, Arial, sans-serif",
    arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    ubuntu: "Ubuntu, 'Noto Sans', Arial, sans-serif",
    cantarell: "Cantarell, 'Noto Sans', Arial, sans-serif",
    georgia: "Georgia, 'Times New Roman', Times, serif",
    times: "'Times New Roman', Times, serif",
    courier: "'Courier New', Courier, monospace",
    consolas: "Consolas, 'Liberation Mono', Menlo, Monaco, monospace",
    menlo: "Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
    monaco: "Monaco, Menlo, Consolas, 'Liberation Mono', monospace",
    "fira-code": "'Fira Code', Consolas, Menlo, Monaco, monospace",
    "jetbrains-mono": "'JetBrains Mono', Consolas, Menlo, Monaco, monospace",
};
function detectFontKey(fontStr) {
    if (!fontStr) return "system-sans";
    const f = fontStr.toLowerCase();
    if (f.includes("sf pro") || f.includes("-apple-system")) return "sf-pro";
    if (f.includes("segoe ui")) return "segoe-ui";
    if (f.includes("roboto")) return "roboto";
    if (f.includes("inter")) return "inter";
    if (f.includes("poppins")) return "poppins";
    if (f.includes("helvetica")) return "helvetica-neue";
    if (f.includes("ubuntu")) return "ubuntu";
    if (f.includes("cantarell")) return "cantarell";
    if (f.includes("georgia")) return "georgia";
    if (f.includes("times")) return "times";
    if (f.includes("courier")) return "courier";
    if (f.includes("consolas")) return "consolas";
    if (f.includes("menlo")) return "menlo";
    if (f.includes("monaco")) return "monaco";
    if (f.includes("fira")) return "fira-code";
    if (f.includes("jetbrains")) return "jetbrains-mono";
    if (f.includes("mono")) return "system-mono";
    if (f.includes("serif") && !f.includes("sans")) return "system-serif";
    if (f.includes("arial")) return "arial";
    return "system-sans";
}
wmFontSel?.addEventListener("change", () => {
    const key = wmFontSel.value || "system-sans";
    updateSettings({ watermark: { font: FONT_MAP[key] } });
    drawPreviews();
});

/* ====== RANGE SLIDERS ====== */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
function bindSlider(inId, outId, { min = 0, max = 100, toText = (n) => `${n}%`, onUpdate = () => {} } = {}) {
    const getIn = () => /** @type {HTMLInputElement|null} */ (document.getElementById(inId));
    const getOut = () => /** @type {HTMLElement|null} */ (document.getElementById(outId));
    const getValNodeNear = () => getIn()?.closest(".row.range")?.querySelector(".val") || null;

    let rafId = 0,
        last = NaN;
    const apply = () => {
        const $in = getIn();
        if (!$in) return;
        const lo = $in.min !== "" ? Number($in.min) : min;
        const hi = $in.max !== "" ? Number($in.max) : max;
        const v = clamp(Number($in.value) || 0, lo, hi);
        const txt = toText(v);
        const $out = getOut(),
            $near = getValNodeNear();
        if ($out) $out.textContent = txt;
        if ($near) $near.textContent = txt;
        if (v !== last) {
            last = v;
            onUpdate(v);
            drawPreviews();
        }
    };
    const loop = () => {
        apply();
        rafId = requestAnimationFrame(loop);
    };

    document.addEventListener(
        "input",
        (e) => {
            if (e.target?.id === inId) apply();
        },
        { passive: true, capture: true }
    );
    document.addEventListener(
        "change",
        (e) => {
            if (e.target?.id === inId) apply();
        },
        { capture: true }
    );
    document.addEventListener("keyup", (e) => {
        if (e.target?.id === inId) apply();
    });

    document.addEventListener("pointerdown", (e) => {
        if (e.target?.id === inId) {
            cancelAnimationFrame(rafId);
            requestAnimationFrame(loop);
        }
    });
    document.addEventListener("pointerup", (e) => {
        if (e.target?.id === inId) {
            cancelAnimationFrame(rafId);
            apply();
        }
    });

    requestAnimationFrame(apply);
}
bindSlider("pad", "padVal", {
    min: 0,
    max: 30,
    toText: (v) => `${v}%`,
    onUpdate: (v) => updateSettings({ padPct: v }),
});
bindSlider("wmOpacity", "wmOpacityVal", {
    min: 0,
    max: 100,
    toText: (v) => `${v}%`,
    onUpdate: (v) => updateSettings({ watermark: { opacity: v / 100 } }),
});
bindSlider("wmFontSize", "wmFontSizeVal", {
    min: 8,
    max: 96,
    toText: (v) => `${v}`, // px @ 432 (angka saja)
    onUpdate: (v) => updateSettings({ watermark: { fontSizeRef: v } }),
});

/* ====== POSITION: MANUAL (px @ 432) ====== */
let posState = { x: Math.round(REF * 0.85), y: Math.round(REF * 0.85) }; // default 368,368

function setPos(x, y, triggerUpdate = true) {
    posState.x = clamp(Math.round(x), 0, REF);
    posState.y = clamp(Math.round(y), 0, REF);

    if (posX) posX.value = String(posState.x);
    if (posY) posY.value = String(posState.y);
    if (coordX) coordX.textContent = `${posState.x}`;
    if (coordY) coordY.textContent = `${posState.y}`;

    drawPosPad();

    if (triggerUpdate) {
        updateSettings({ watermark: { coordPx: { x: posState.x, y: posState.y }, pos: "custom" } });
        drawPreviews();
    }
}

function drawPosPad() {
    if (!posPad || !posCtx) return;
    const w = posPad.width,
        h = posPad.height;
    posCtx.clearRect(0, 0, w, h);

    // background
    posCtx.fillStyle = "rgba(255,255,255,0.03)";
    posCtx.fillRect(0, 0, w, h);

    // grid 3x3
    posCtx.strokeStyle = "rgba(255,255,255,0.12)";
    posCtx.lineWidth = 1;
    posCtx.beginPath();
    posCtx.moveTo(w / 3, 0);
    posCtx.lineTo(w / 3, h);
    posCtx.moveTo((2 * w) / 3, 0);
    posCtx.lineTo((2 * w) / 3, h);
    posCtx.moveTo(0, h / 3);
    posCtx.lineTo(w, h / 3);
    posCtx.moveTo(0, (2 * h) / 3);
    posCtx.lineTo(w, (2 * h) / 3);
    posCtx.stroke();

    // crosshair
    const cx = (posState.x / REF) * w;
    const cy = (posState.y / REF) * h;

    posCtx.strokeStyle = "rgba(109,40,217,0.9)";
    posCtx.lineWidth = 1.5;
    posCtx.beginPath();
    posCtx.moveTo(cx, 0);
    posCtx.lineTo(cx, h);
    posCtx.moveTo(0, cy);
    posCtx.lineTo(w, cy);
    posCtx.stroke();

    // knob
    posCtx.fillStyle = "rgba(109,40,217,1)";
    posCtx.beginPath();
    posCtx.arc(cx, cy, 6, 0, Math.PI * 2);
    posCtx.fill();

    posCtx.strokeStyle = "rgba(255,255,255,0.9)";
    posCtx.lineWidth = 2;
    posCtx.beginPath();
    posCtx.arc(cx, cy, 6, 0, Math.PI * 2);
    posCtx.stroke();
}

// drag handlers
let dragging = false;
function pointerToPad(e) {
    const rect = posPad.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * REF, 0, REF);
    const y = clamp(((e.clientY - rect.top) / rect.height) * REF, 0, REF);
    return { x, y };
}
posPad?.addEventListener("pointerdown", (e) => {
    dragging = true;
    posPad.setPointerCapture(e.pointerId);
    const { x, y } = pointerToPad(e);
    setPos(x, y);
});
posPad?.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const { x, y } = pointerToPad(e);
    setPos(x, y);
});
posPad?.addEventListener("pointerup", (e) => {
    dragging = false;
    posPad.releasePointerCapture(e.pointerId);
});

posX?.addEventListener("input", () => setPos(Number(posX.value || 0), posState.y));
posY?.addEventListener("input", () => setPos(posState.x, Number(posY.value || 0)));

/* ====== DND ROBUST ====== */
function fileFromDataTransfer(dt) {
    if (!dt) return null;
    if (dt.files && dt.files.length) return dt.files[0];
    if (dt.items && dt.items.length) {
        for (const it of dt.items)
            if (it.kind === "file") {
                const f = it.getAsFile();
                if (f) return f;
            }
    }
    return null;
}
function wireDnD(dropEl, inputEl) {
    if (!dropEl && !inputEl) return;
    const addHover = (e) => {
        e.preventDefault();
        dropEl?.classList.add("hover");
    };
    const remHover = (e) => {
        e.preventDefault();
        dropEl?.classList.remove("hover");
    };
    const onDrop = async (e) => {
        e.preventDefault();
        dropEl?.classList.remove("hover");
        const f = fileFromDataTransfer(e.dataTransfer);
        if (f) await handleFile(f);
    };

    dropEl?.addEventListener("dragenter", addHover);
    dropEl?.addEventListener("dragover", addHover);
    dropEl?.addEventListener("dragleave", remHover);
    dropEl?.addEventListener("drop", onDrop);

    inputEl?.addEventListener("dragenter", addHover);
    inputEl?.addEventListener("dragover", (e) => e.preventDefault());
    inputEl?.addEventListener("dragleave", remHover);
    inputEl?.addEventListener("drop", onDrop);

    window.addEventListener("dragover", (e) => e.preventDefault());
    window.addEventListener("drop", (e) => {
        const target = e.target;
        const inside = dropEl?.contains(target) || target === inputEl;
        if (!inside) e.preventDefault();
    });
}
wireDnD(drop, file);
file?.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (f) await handleFile(f);
});

/* ====== OTHER CONTROLS ====== */
shape?.addEventListener("change", () => {
    updateSettings({ shape: shape.value });
    drawPreviews();
});
bgMode?.addEventListener("change", () => {
    toggleGrad();
    drawPreviews();
});
bgA?.addEventListener("input", () => {
    updateSettings({ bg: { a: bgA.value } });
    drawPreviews();
});
bgB?.addEventListener("input", () => {
    updateSettings({ bg: { b: bgB.value } });
    drawPreviews();
});
wmText?.addEventListener("input", () => {
    updateSettings({ watermark: { text: wmText.value } });
    drawPreviews();
});

withRound?.addEventListener("change", () => updateSettings({ options: { withRound: withRound.checked } }));
withAnyDpi?.addEventListener("change", () => updateSettings({ options: { withAnyDpi: withAnyDpi.checked } }));
withPreview?.addEventListener("change", () => updateSettings({ options: { withPreview: withPreview.checked } }));

btnGen?.addEventListener("click", onGenerate);

/* ====== INIT UI ====== */
syncUIFromState();
drawPreviews();
translateDocument(document); // i18n

/* ====== HELPERS ====== */
function toggleGrad() {
    const show = bgMode?.value === "gradient";
    document.querySelectorAll(".only-gradient").forEach((el) => {
        el.style.display = show ? "block" : "none";
    });
    updateSettings({ bg: { mode: bgMode?.value || "solid" } });
}

function syncUIFromState() {
    const s = getState();

    const pad = /** @type {HTMLInputElement|null} */ (document.getElementById("pad"));
    const padVal = document.getElementById("padVal");
    const wmOpacity = /** @type {HTMLInputElement|null} */ (document.getElementById("wmOpacity"));
    const wmOpacityVal = document.getElementById("wmOpacityVal");

    if (pad) pad.value = String(s.padPct);
    if (padVal) padVal.textContent = `${s.padPct}%`;

    if (shape) shape.value = s.shape;
    if (bgMode) bgMode.value = s.bg.mode;
    if (bgA) bgA.value = s.bg.a;
    if (bgB) bgB.value = s.bg.b || s.bg.a;
    if (wmText) wmText.value = s.watermark.text || "";

    // font family
    const fontKey = detectFontKey(s.watermark.font);
    if (wmFontSel) wmFontSel.value = fontKey;

    // font size (px @ 432)
    const fsRef = Math.max(8, Math.min(96, s?.watermark?.fontSizeRef ?? 48));
    if (wmFontSize) wmFontSize.value = String(fsRef);
    const fsOut = document.getElementById("wmFontSizeVal");
    if (fsOut) fsOut.textContent = String(fsRef);

    // opacity
    const op = Math.round((s.watermark.opacity ?? 0.2) * 100);
    if (wmOpacity) wmOpacity.value = String(op);
    if (wmOpacityVal) wmOpacityVal.textContent = `${op}%`;

    // koordinat px (fallback: jika ada coord persen lama → konversi ke px @ 432)
    const legacyXPct = s?.watermark?.coord?.xPct ?? s?.watermark?.coord?.x;
    const legacyYPct = s?.watermark?.coord?.yPct ?? s?.watermark?.coord?.y;
    const xPx = Number.isFinite(s?.watermark?.coordPx?.x)
        ? s.watermark.coordPx.x
        : Number.isFinite(legacyXPct)
        ? Math.round((legacyXPct / 100) * REF)
        : Math.round(REF * 0.85);
    const yPx = Number.isFinite(s?.watermark?.coordPx?.y)
        ? s.watermark.coordPx.y
        : Number.isFinite(legacyYPct)
        ? Math.round((legacyYPct / 100) * REF)
        : Math.round(REF * 0.85);

    setPos(xPx, yPx, false);

    if (withRound) withRound.checked = !!s.options.withRound;
    if (withAnyDpi) withAnyDpi.checked = !!s.options.withAnyDpi;
    if (withPreview) withPreview.checked = !!s.options.withPreview;

    toggleGrad();
    drawPosPad();
}

async function handleFile(f) {
    try {
        setFile(f);
        if (fileMeta) fileMeta.textContent = `${f.name} • ${(f.size / 1024).toFixed(1)} KB • ${f.type || ""}`;

        const loaded = await loadImageFromFile(f);
        setImage(loaded.image, { width: loaded.width, height: loaded.height });

        const transparent = detectTransparency(loaded.image);
        const dominant = dominantColor(loaded.image);
        updateSettings({ meta: { transparent, dominant } });
        if (bgMode?.value === "solid") {
            updateSettings({ bg: { a: dominant } });
            if (bgA) bgA.value = dominant;
        }
        drawPreviews();
    } catch {
        alert(
            getCurrentLang() === "id"
                ? "Gagal memuat gambar. Pastikan berkas PNG/SVG valid."
                : "Failed to load image. Please provide a valid PNG/SVG."
        );
    }
}

function drawPreviews() {
    const s = getState();
    if (!previews) return;
    previews.innerHTML = "";
    if (!s.image) return;

    for (const px of PREVIEW_SIZES) {
        const c = renderIcon({
            img: s.image,
            size: px,
            padPct: s.padPct,
            shape: s.shape,
            bg: s.bg,
            watermark: s.watermark, // text, font, fontSizeRef, opacity, coordPx{x,y}
            showSafeArea: true,
        });

        c.classList.add("pv");
        if (px <= 256) c.classList.add(`w${px}`);
        else c.classList.add("wL");

        const cell = document.createElement("div");
        cell.className = "cell";
        const label = document.createElement("div");
        label.className = "muted";
        label.textContent = `${px} px`;
        cell.appendChild(label);
        cell.appendChild(c);
        previews.appendChild(cell);
    }
}

async function onGenerate() {
    const s = getState();
    if (!s.image) {
        alert(getCurrentLang() === "id" ? "Upload logo terlebih dahulu." : "Please upload a logo first.");
        return;
    }
    if (!window.JSZip || !window.saveAs) {
        alert(
            getCurrentLang() === "id"
                ? "Vendor ZIP belum dimuat. Pastikan jszip.min.js & FileSaver.min.js tersedia."
                : "ZIP vendors not loaded. Ensure jszip.min.js & FileSaver.min.js are available."
        );
        return;
    }

    const entries = await generateAll({
        img: s.image,
        padPct: s.padPct,
        shape: s.shape,
        bg: s.bg,
        watermark: s.watermark,
        withRound: s.options.withRound,
        withAnyDpi: s.options.withAnyDpi,
        withPreview: s.options.withPreview,
    });

    await saveZip(entries, `TenRuslDroidIconLab_${Date.now()}.zip`);
}
