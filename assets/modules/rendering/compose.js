// C:\laragon\www\TenRusl-Droid-IconLab\assets\js\modules\rendering\compose.js
// ESM — compose 1 ikon: background, mask, auto-fit logo, safe-area overlay, watermark

import { pathMask } from "./mask.js";
import { createCanvas, linearGradient, drawSafeArea, fitContain } from "../utils/canvas.js";

const REF = 432; // referensi skala (juga dipakai di UI)

/**
 * Render satu ikon ke canvas.
 * @param {Object} opt
 * @param {HTMLImageElement|ImageBitmap} opt.img
 * @param {number} [opt.size=108]
 * @param {number} [opt.padPct=12]
 * @param {'squircle'|'circle'|'rounded'} [opt.shape='squircle']
 * @param {{mode:'solid'|'gradient', a:string, b?:string}} [opt.bg]
 * @param {{
 *   text?: string,
 *   opacity?: number,               // 0..1
 *   font?: string,                  // CSS font-family
 *   fontSizeRef?: number,           // px @ 432; diskalakan → size
 *   pos?: 'top-left'|'top-right'|'bottom-left'|'bottom-right'|'center'|'custom',
 *   coordPx?: { x?: number, y?: number }, // koordinat absolut @ 432
 *   coord?: { x?: number, y?: number, xPct?: number, yPct?: number } // fallback lama (persen)
 * }} [opt.watermark]
 * @param {boolean} [opt.showSafeArea=false]
 * @returns {HTMLCanvasElement}
 */
export function renderIcon(opt) {
    const {
        img,
        size = 108,
        padPct = 12,
        shape = "squircle",
        bg = { mode: "solid", a: "#6d28d9", b: "#ec4899" },
        watermark = { text: "", opacity: 0.2, pos: "bottom-right" },
        showSafeArea = false,
    } = opt;

    const { canvas, ctx } = createCanvas(size, size);

    // 1) Background + mask
    const mask = pathMask(shape, size);
    ctx.save();
    ctx.clip(mask);

    if (bg.mode === "gradient") {
        ctx.fillStyle = linearGradient(ctx, size, size, bg.a, bg.b || bg.a);
    } else {
        ctx.fillStyle = bg.a; // bisa 'transparent' untuk foreground anydpi
    }
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    // 2) Foreground (logo) auto-fit dengan padding
    const pad = (Math.max(0, Math.min(50, padPct)) / 100) * size;
    const boxW = size - pad * 2;
    const boxH = size - pad * 2;
    const sw = /** @type {*} */ (img).naturalWidth || /** @type {*} */ (img).width;
    const sh = /** @type {*} */ (img).naturalHeight || /** @type {*} */ (img).height;
    const { w, h } = fitContain(sw, sh, boxW, boxH);
    const ix = Math.round((size - w) / 2);
    const iy = Math.round((size - h) / 2);

    ctx.save();
    ctx.clip(mask);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(/** @type {CanvasImageSource} */ (img), ix, iy, w, h);
    ctx.restore();

    // 3) Safe-area overlay (preview only)
    if (showSafeArea) {
        drawSafeArea(ctx, size);
    }

    // 4) Watermark
    if (watermark && watermark.text && (watermark.opacity ?? 0) > 0) {
        const wm = watermark;

        // Font size skala
        const fontPx = Math.max(
            8,
            Math.round(
                wm.fontSizeRef && Number.isFinite(wm.fontSizeRef) ? (Number(wm.fontSizeRef) * size) / REF : size * 0.12
            )
        );
        const fontFam = wm.font || "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

        // Hitung posisi
        let x, y;
        let align = "center";
        let baseline = "middle";

        // a) prioritas: koordinat px @ 432
        if (wm.coordPx && (Number.isFinite(wm.coordPx.x) || Number.isFinite(wm.coordPx.y))) {
            const rx = Number.isFinite(wm.coordPx.x) ? Number(wm.coordPx.x) : REF / 2;
            const ry = Number.isFinite(wm.coordPx.y) ? Number(wm.coordPx.y) : REF / 2;
            x = (rx / REF) * size;
            y = (ry / REF) * size;
            align = "center";
            baseline = "middle";
        }
        // b) fallback lama: koordinat persen (0..100)
        else if (wm.coord && (Number.isFinite(wm.coord.x) || Number.isFinite(wm.coord.xPct))) {
            const rx = wm.coord?.x ?? wm.coord?.xPct ?? 50;
            const ry = wm.coord?.y ?? wm.coord?.yPct ?? 50;
            x = clamp01(rx / 100) * size;
            y = clamp01(ry / 100) * size;
            align = "center";
            baseline = "middle";
        }
        // c) fallback anchor
        else {
            const left = pad + fontPx * 0.6;
            const right = size - pad - fontPx * 0.6;
            const top = pad + fontPx * 0.8;
            const bottom = size - pad - fontPx * 0.8;
            const cx = size / 2;
            const cy = size / 2;
            const pos = (wm.pos || "bottom-right").toLowerCase();
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

        // Gambar text
        ctx.save();
        ctx.clip(mask);

        ctx.globalAlpha = Math.max(0, Math.min(1, wm.opacity ?? 0.2));
        ctx.fillStyle = "#ffffff";
        ctx.font = `${fontPx}px ${fontFam}`;
        ctx.textAlign = /** @type {'left'|'center'|'right'} */ (align);
        ctx.textBaseline = /** @type {'alphabetic'|'middle'|'ideographic'} */ (baseline);

        // shadow tipis agar kebaca
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = Math.max(2, Math.round(fontPx * 0.18));

        ctx.fillText(wm.text, x, y);
        ctx.restore();
    }

    return canvas;
}

/* ---------- utils lokal ---------- */
function clamp01(n) {
    if (!Number.isFinite(n)) return 0;
    return n < 0 ? 0 : n > 1 ? 1 : n;
}
