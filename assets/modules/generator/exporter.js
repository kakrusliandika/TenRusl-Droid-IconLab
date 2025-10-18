// C:\laragon\www\TenRusl-Droid-IconLab\assets\js\modules\generator\exporter.js
// ESM — orkestrasi render batch (legacy/round/anydpi), preview sheet, README

import { renderIcon } from "../rendering/compose.js";
import { createCanvas, linearGradient, toBlobPromise } from "../utils/canvas.js";
import { LEGACY, LEGACY_ROUND, ANYDPI_V26, buildReadme, adaptiveXml } from "./densities.js";

/**
 * Hasil akhir berupa daftar entri untuk ZIP.
 * @typedef {{ path:string, blob?:Blob, text?:string }} ZipEntry
 */

/**
 * Generate semua keluaran sesuai opsi.
 * @param {{
 *   img: HTMLImageElement|ImageBitmap,
 *   padPct: number,
 *   shape: 'squircle'|'circle'|'rounded',
 *   bg: {mode:'solid'|'gradient', a:string, b?:string},
 *   watermark: {text?:string, opacity?:number, pos?:'top-left'|'top-right'|'bottom-left'|'bottom-right'},
 *   withRound: boolean,
 *   withAnyDpi: boolean,
 *   withPreview: boolean
 * }} o
 * @returns {Promise<ZipEntry[]>}
 */
export async function generateAll(o) {
    /** @type {ZipEntry[]} */
    const entries = [];

    // -- Legacy base icons ------------------------------------------------------
    for (const d of LEGACY) {
        const c = renderIcon({
            img: o.img,
            size: d.size,
            padPct: o.padPct,
            shape: o.shape,
            bg: o.bg,
            watermark: o.watermark,
            showSafeArea: false,
        });
        entries.push({ path: `${d.folder}/${d.name}`, blob: await toBlobPromise(c, "image/png") });
    }

    // -- Legacy round (opsional) -----------------------------------------------
    if (o.withRound) {
        for (const d of LEGACY_ROUND) {
            const c = renderIcon({
                img: o.img,
                size: d.size,
                padPct: o.padPct,
                shape: "circle",
                bg: o.bg,
                watermark: o.watermark,
                showSafeArea: false,
            });
            entries.push({ path: `${d.folder}/${d.name}`, blob: await toBlobPromise(c, "image/png") });
        }
    }

    // -- Adaptive anydpi-v26 (opsional) ----------------------------------------
    if (o.withAnyDpi) {
        // Foreground: logo dengan background TRANSPARAN (solid transparan).
        const fg = renderIcon({
            img: o.img,
            size: ANYDPI_V26.sizePx,
            padPct: o.padPct,
            shape: o.shape,
            bg: { mode: "solid", a: "rgba(0,0,0,0)" },
            watermark: { ...o.watermark, opacity: 0 },
            showSafeArea: false,
        });

        // Background: solid/gradient lapang 432x432
        const { canvas: bgC, ctx: bgCtx } = createCanvas(ANYDPI_V26.sizePx, ANYDPI_V26.sizePx);
        if (o.bg.mode === "gradient") {
            bgCtx.fillStyle = linearGradient(bgCtx, bgC.width, bgC.height, o.bg.a, o.bg.b || o.bg.a);
        } else {
            bgCtx.fillStyle = o.bg.a;
        }
        bgCtx.fillRect(0, 0, bgC.width, bgC.height);

        entries.push({ path: `${ANYDPI_V26.folder}/${ANYDPI_V26.foreground}`, blob: await toBlobPromise(fg) });
        entries.push({ path: `${ANYDPI_V26.folder}/${ANYDPI_V26.background}`, blob: await toBlobPromise(bgC) });
        entries.push({ path: `${ANYDPI_V26.folder}/${ANYDPI_V26.xml}`, text: adaptiveXml() });
    }

    // -- Preview sheet (opsional) ----------------------------------------------
    if (o.withPreview) {
        const sheet = await buildPreviewSheet(o);
        entries.push({ path: `preview/preview-sheet.png`, blob: await toBlobPromise(sheet) });
    }

    // -- README ----------------------------------------------------------------
    entries.push({ path: "README.txt", text: buildReadme({ withRound: o.withRound, withAnyDpi: o.withAnyDpi }) });

    return entries;
}

/**
 * Buat preview sheet grid (48,72,96,144,192,432).
 * @param {*} o - opsi yang sama seperti generateAll
 * @returns {Promise<HTMLCanvasElement>}
 */
async function buildPreviewSheet(o) {
    const sizes = [48, 72, 96, 144, 192, 432];
    const cols = 3;
    const cell = 220;
    const w = cell * cols;
    const h = Math.ceil(sizes.length / cols) * cell;

    const { canvas, ctx } = createCanvas(w, h);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "14px system-ui, sans-serif";

    sizes.forEach((s, i) => {
        const x = (i % cols) * cell;
        const y = Math.floor(i / cols) * cell;
        ctx.fillText(`${s}px`, x + 10, y + 22);

        const c = renderIcon({
            img: o.img,
            size: s,
            padPct: o.padPct,
            shape: o.shape,
            bg: o.bg,
            watermark: o.watermark,
            showSafeArea: true,
        });
        // center the icon canvas in a 200x200 area
        const offX = x + 10;
        const offY = y + 30;
        ctx.drawImage(c, offX, offY);
    });

    return canvas;
}
