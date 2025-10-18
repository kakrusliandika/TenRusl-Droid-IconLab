// C:\laragon\www\TenRusl-Droid-IconLab\assets\modules\state.js
// ESM — pusat state + event bus + persistence (settings only)

/**
 * @typedef {'squircle'|'circle'|'rounded'} IconShape
 * @typedef {{mode:'solid'|'gradient', a:string, b:string}} BgSpec
 * @typedef {{
 *   text:string,
 *   opacity:number,                    // 0..1
 *   font:string,                       // CSS font-family
 *   fontSizeRefPx:number,              // ukuran font (px) pada kanvas referensi 432
 *   coordRef: {x:number,y:number}|null,// koordinat (px) pada kanvas referensi 432, relatif area konten (setelah padding)
 *   pos:'top-left'|'top-right'|'bottom-left'|'bottom-right'|'center'|'custom'
 * }} Watermark
 * @typedef {{withRound:boolean, withAnyDpi:boolean, withPreview:boolean}} Options
 * @typedef {{transparent:boolean, dominant:string}} Meta
 * @typedef {{
 *   file: File|null,
 *   fileInfo: {name:string,size:number,type:string}|null,
 *   image: HTMLImageElement|ImageBitmap|null,
 *   imageSize: {width:number,height:number}|null,
 *   meta: Meta,
 *   padPct: number,
 *   shape: IconShape,
 *   bg: BgSpec,
 *   watermark: Watermark,
 *   options: Options
 * }} AppState
 */

const STORAGE_KEY = "iconlab:settings:v2";

/** @type {AppState} */
const _state = {
    file: null,
    fileInfo: null,
    image: null,
    imageSize: null,
    meta: { transparent: false, dominant: "#6d28d9" },
    padPct: 12,
    shape: "squircle",
    bg: { mode: "solid", a: "#6d28d9", b: "#ec4899" },
    watermark: {
        text: "",
        opacity: 0.2,
        font: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontSizeRefPx: 48, // default 48px @432
        coordRef: null, // jika null → pakai anchor `pos`
        pos: "bottom-right",
    },
    options: { withRound: false, withAnyDpi: true, withPreview: true },
};

// ---- Simple event bus -------------------------------------------------------
/** @type {Set<(s:Readonly<AppState>)=>void>} */
const listeners = new Set();

/** @returns {Readonly<AppState>} */
export function getState() {
    return _freezeView(_state);
}

/** @param {(s:Readonly<AppState>)=>void} fn */
export function subscribe(fn) {
    listeners.add(fn);
    fn(getState());
    return () => listeners.delete(fn);
}

function emit() {
    const snap = getState();
    listeners.forEach((fn) => {
        try {
            fn(snap);
        } catch {}
    });
}

function _freezeView(s) {
    // produce a shallow read-only snapshot (avoid accidental mutation by consumers)
    return Object.freeze({
        ...s,
        file: s.file,
        image: s.image,
        fileInfo: s.fileInfo && { ...s.fileInfo },
        imageSize: s.imageSize && { ...s.imageSize },
        meta: { ...s.meta },
        bg: { ...s.bg },
        watermark: s.watermark && { ...s.watermark, coordRef: s.watermark.coordRef && { ...s.watermark.coordRef } },
        options: { ...s.options },
    });
}

// ---- Mutations (granular) ---------------------------------------------------

/** @param {Partial<Pick<AppState,'padPct'|'shape'|'bg'|'watermark'|'options'|'meta'>>} patch */
export function updateSettings(patch) {
    if (patch.padPct != null) _state.padPct = clamp(Number(patch.padPct), 0, 50);
    if (patch.shape) _state.shape = patch.shape;
    if (patch.bg) _state.bg = { ..._state.bg, ...patch.bg };

    if (patch.watermark) {
        _state.watermark = { ..._state.watermark, ...normalizeWatermarkPatch(patch.watermark) };
    }

    if (patch.options) _state.options = { ..._state.options, ...patch.options };
    if (patch.meta) _state.meta = { ..._state.meta, ...patch.meta };
    emit();
}

/** @param {File|null} file */
export function setFile(file) {
    _state.file = file || null;
    _state.fileInfo = file ? { name: file.name, size: file.size, type: file.type || "" } : null;
    emit();
}

/** @param {HTMLImageElement|ImageBitmap|null} img @param {{width:number,height:number}|null} size */
export function setImage(img, size) {
    _state.image = img || null;
    _state.imageSize = size
        ? { width: size.width, height: size.height }
        : img
        ? { width: /** @type {*} */ (img).width, height: /** @type {*} */ (img).height }
        : null;
    emit();
}

export function resetTransient() {
    _state.file = null;
    _state.fileInfo = null;
    _state.image = null;
    _state.imageSize = null;
    _state.meta = { transparent: false, dominant: "#6d28d9" };
    emit();
}

// ---- Persistence (settings only — never store images/files) -----------------

export function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            // backward compat v1 (optional)
            const rawV1 = localStorage.getItem("iconlab:settings:v1");
            if (!rawV1) return;
            const old = JSON.parse(rawV1);
            const wmOld = old?.watermark || {};
            const wm = normalizeWatermarkPatch(wmOld);
            updateSettings({
                padPct: old.padPct,
                shape: old.shape,
                bg: old.bg,
                watermark: wm,
                options: old.options,
            });
            return;
        }
        const saved = JSON.parse(raw);
        updateSettings({
            padPct: saved.padPct,
            shape: saved.shape,
            bg: saved.bg,
            watermark: normalizeWatermarkPatch(saved.watermark || {}),
            options: saved.options,
        });
    } catch {}
}

export function saveSettings() {
    try {
        const payload = {
            padPct: _state.padPct,
            shape: _state.shape,
            bg: _state.bg,
            watermark: _state.watermark,
            options: _state.options,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
}

// ---- Utils ------------------------------------------------------------------

/**
 * Normalisasi patch watermark:
 * - Terima alias lama `fontSizeRef` → `fontSizeRefPx`.
 * - Terima `coord` lama (0..100, persen area konten @432) → konversi ke `coordRef` (px @432).
 * - Biarkan `coordRef` langsung jika sudah disediakan.
 * @param {any} wm
 */
function normalizeWatermarkPatch(wm) {
    const out = { ...wm };

    // alias font size
    if (typeof out.fontSizeRef === "number" && out.fontSizeRefPx == null) {
        out.fontSizeRefPx = Number(out.fontSizeRef);
        delete out.fontSizeRef;
    }

    // konversi coord persen lama → coordRef px @432 (relatif inner content)
    if (!out.coordRef && out.coord && (out.coord.x != null || out.coord.xPct != null)) {
        const refSize = 432;
        const padRefPx = (_state.padPct / 100) * refSize;
        const innerRef = Math.max(0, refSize - 2 * padRefPx);
        const xp = Number(out.coord.x ?? out.coord.xPct ?? 0);
        const yp = Number(out.coord.y ?? out.coord.yPct ?? 0);
        const clamp01 = (n) => Math.max(0, Math.min(1, n / 100));
        out.coordRef = {
            x: Math.round(clamp01(xp) * innerRef),
            y: Math.round(clamp01(yp) * innerRef),
        };
        delete out.coord;
    }

    // clamp dasar
    if (typeof out.opacity === "number") out.opacity = Math.max(0, Math.min(1, out.opacity));
    if (typeof out.fontSizeRefPx === "number")
        out.fontSizeRefPx = Math.max(8, Math.min(256, Math.round(out.fontSizeRefPx)));

    if (out.coordRef) {
        out.coordRef = {
            x: Math.max(0, Math.round(Number(out.coordRef.x || 0))),
            y: Math.max(0, Math.round(Number(out.coordRef.y || 0))),
        };
    }

    return out;
}

function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
}
