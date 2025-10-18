// C:\laragon\www\TenRusl-Droid-IconLab\assets\modules\utils\canvas.js
// ESM — DPR-aware canvas, gradients, watermark, safe-area, fit, toBlobPromise

/**
 * Create a DPR-scaled canvas for crisp export.
 * @param {number} w
 * @param {number} h
 * @param {{dpr?:number}} [opt]
 * @returns {{canvas:HTMLCanvasElement, ctx:CanvasRenderingContext2D, scale:number}}
 */
export function createCanvas(w, h, opt = {}) {
    const dpr = opt.dpr ?? (globalThis.devicePixelRatio || 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = "high";
    return { canvas, ctx, scale: dpr };
}

/** @param {CanvasRenderingContext2D} ctx @param {number} w @param {number} h @param {string} a @param {string} b */
export function linearGradient(ctx, w, h, a, b) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
}

/**
 * Draw watermark text — mendukung:
 * - `coordRef` (px @432) + `padPct` → posisi absolut skala otomatis,
 * - atau fallback ke anchor `pos`.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{
 *   text?:string,
 *   opacity?:number,                  // 0..1
 *   font?:string,                     // CSS font-family
 *   fontSizeRefPx?:number,            // px @ 432; bila kosong pakai 0.12 * size
 *   padPct?:number,                   // padding konten (% dari size ikon)
 *   pos?:'top-left'|'top-right'|'bottom-left'|'bottom-right'|'center'|'custom',
 *   coordRef?:{x:number,y:number}|null,// koordinat px pada kanvas referensi 432 (relatif area konten)
 *   fillStyle?:string
 * }} opt
 */
export function drawWatermark(ctx, opt = {}) {
    const text = opt.text || "";
    if (!text) return;

    const size = Math.min(ctx.canvas.width, ctx.canvas.height) / (globalThis.devicePixelRatio || 1);
    const padPct = clamp(opt.padPct ?? 12, 0, 50);

    // Font size scaled dari referensi 432
    const fontPx =
        typeof opt.fontSizeRefPx === "number"
            ? Math.max(8, Math.round((opt.fontSizeRefPx * size) / 432))
            : Math.max(10, Math.round(size * 0.12));

    const font = opt.font || "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    // Hitung padding & inner area
    const padPx = (padPct / 100) * size;
    const inner = Math.max(0, size - 2 * padPx);

    // Default gaya
    const opacity = clamp(opt.opacity ?? 0.2, 0, 1);
    const fillStyle = opt.fillStyle || "#ffffff";

    // Hitung posisi (dari coordRef @432 bila ada)
    let x,
        y,
        align = "center",
        baseline = "middle";

    if (opt.coordRef && Number.isFinite(opt.coordRef.x) && Number.isFinite(opt.coordRef.y)) {
        // Skala koordinat referensi (px @432) → ke ukuran saat ini (relatif inner area)
        const refSize = 432;
        const padRefPx = (padPct / 100) * refSize;
        const innerRef = Math.max(0, refSize - 2 * padRefPx);
        const scale = innerRef > 0 ? inner / innerRef : 1;

        x = padPx + clamp(opt.coordRef.x, 0, innerRef) * scale;
        y = padPx + clamp(opt.coordRef.y, 0, innerRef) * scale;

        align = "center";
        baseline = "middle";
    } else {
        // Fallback anchor klasik (tidak presisi custom)
        const left = padPx + fontPx * 0.6;
        const right = size - padPx - fontPx * 0.6;
        const top = padPx + fontPx * 0.8;
        const bottom = size - padPx - fontPx * 0.8;
        const cx = size / 2;
        const cy = size / 2;
        const pos = (opt.pos || "bottom-right").toLowerCase();

        switch (pos) {
            case "top-left":
                x = left;
                y = top;
                align = "left";
                baseline = "alphabetic";
                break;
            case "top-right":
                x = right;
                y = top;
                align = "right";
                baseline = "alphabetic";
                break;
            case "bottom-left":
                x = left;
                y = bottom;
                align = "left";
                baseline = "ideographic";
                break;
            case "center":
            case "custom":
                x = cx;
                y = cy;
                align = "center";
                baseline = "middle";
                break;
            case "bottom-right":
            default:
                x = right;
                y = bottom;
                align = "right";
                baseline = "ideographic";
                break;
        }
    }

    // Gambar
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = fillStyle;
    ctx.font = `${fontPx}px ${font}`;
    /** @type {'left'|'center'|'right'} */ (ctx.textAlign = align);
    /** @type {'alphabetic'|'middle'|'ideographic'} */ (ctx.textBaseline = baseline);

    // shadow tipis agar kebaca di bg terang
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = Math.max(2, Math.round(fontPx * 0.18));

    ctx.fillText(text, x, y);
    ctx.restore();
}

/** @param {CanvasRenderingContext2D} ctx @param {number} size */
export function drawSafeArea(ctx, size) {
    // inner 72/108 of canvas (Android adaptive safe area reference)
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.setLineDash([4, 4]);
    const inset = (size - size * (72 / 108)) / 2;
    ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
    ctx.restore();
}

/** contain-fit source (sw,sh) into (dw,dh) */
export function fitContain(sw, sh, dw, dh) {
    const s = Math.min(dw / sw, dh / sh);
    return { w: Math.round(sw * s), h: Math.round(sh * s) };
}

/** @param {HTMLCanvasElement} canvas @param {string} [type] @param {number} [quality] */
export function toBlobPromise(canvas, type = "image/png", quality) {
    return new Promise((res) => canvas.toBlob((b) => res(b), type, quality));
}

/* -------------------- helpers -------------------- */
function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
}
