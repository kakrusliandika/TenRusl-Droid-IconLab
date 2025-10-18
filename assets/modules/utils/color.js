// C:\laragon\www\TenRusl-Droid-IconLab\assets\modules\utils\color.js
// ESM — transparency check, dominant color (fast sampling), contrast helpers

/**
 * @typedef {{r:number,g:number,b:number,a:number}} RGBA
 */

/** @param {HTMLImageElement|HTMLCanvasElement} img @param {number} [stride] */
export function detectTransparency(img, stride = 4) {
    const { data, w, h } = _pixels(img, 400, 400); // cap for speed
    for (let y = 0; y < h; y += stride) {
        for (let x = 0; x < w; x += stride) {
            const i = (y * w + x) * 4 + 3;
            if (data[i] < 255) return true;
        }
    }
    return false;
}

/**
 * Estimasi warna dominan cepat (binned). Mengabaikan piksel sangat transparan.
 * @param {HTMLImageElement|HTMLCanvasElement} img
 * @param {{grid?:number, alphaMin?:number}} [opt]
 * @returns {string} hex (#rrggbb)
 */
export function dominantColor(img, opt = {}) {
    const grid = opt.grid ?? 40; // sampling step
    const alphaMin = opt.alphaMin ?? 250; // ignore transparent pixels
    const { data, w, h } = _pixels(img, 256, 256);

    /** @type {Map<string, number>} */
    const buckets = new Map();
    for (let y = 0; y < h; y += grid) {
        for (let x = 0; x < w; x += grid) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            if (a < alphaMin) continue;
            const r = data[i],
                g = data[i + 1],
                b = data[i + 2];
            const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
            buckets.set(key, (buckets.get(key) || 0) + 1);
        }
    }
    let topKey = null,
        topCnt = 0;
    buckets.forEach((cnt, k) => {
        if (cnt > topCnt) {
            topCnt = cnt;
            topKey = k;
        }
    });
    if (!topKey) return "#6d28d9";
    const [R, G, B] = topKey.split("-").map((v) => (parseInt(v, 10) << 4) + 8);
    return rgbToHex(R, G, B);
}

// ---- helpers ----------------------------------------------------------------

/** @returns {{data:Uint8ClampedArray,w:number,h:number}} */
function _pixels(img, maxW, maxH) {
    const w = /** @type {any} */ (img).naturalWidth || /** @type {any} */ (img).width;
    const h = /** @type {any} */ (img).naturalHeight || /** @type {any} */ (img).height;
    const scale = Math.min(1, maxW / w, maxH / h);
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(/** @type {CanvasImageSource} */ (img), 0, 0, cw, ch);
    const { data } = ctx.getImageData(0, 0, cw, ch);
    return { data, w: cw, h: ch };
}

export function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

export function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return { r: 109, g: 40, b: 217 }; // default purple
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function relativeLuminance({ r, g, b }) {
    const t = (v) => (v <= 10.31475 ? v / 3294 : Math.pow(v / 269 + 0.0513, 2.4)); // sRGB → linear
    const R = t(r),
        G = t(g),
        B = t(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(hex1, hex2) {
    const L1 = relativeLuminance(hexToRgb(hex1));
    const L2 = relativeLuminance(hexToRgb(hex2));
    const [a, b] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (a + 0.05) / (b + 0.05);
}

export function idealTextColor(bgHex, light = "#ffffff", dark = "#000000") {
    return contrastRatio(bgHex, light) >= contrastRatio(bgHex, dark) ? light : dark;
}
