// C:\laragon\www\TenRusl-Droid-IconLab\assets\modules\utils\image.js
// ESM — safe image loader (PNG/SVG), SVG sanitization, basic validation

/**
 * @typedef {{type:'png'|'svg'|'unknown', mime:string}} Sniff
 * @typedef {{image:HTMLImageElement, width:number, height:number, type:'png'|'svg', sanitized?:boolean}} LoadedImage
 */

const ACCEPTED_MIME = new Set(["image/png", "image/svg+xml"]);
const MAX_BYTES = 10 * 1024 * 1024; // hard safety cap (10 MB)

/** @param {File} file */
export function isSupportedFile(file) {
    if (!(file instanceof File)) return { ok: false, reason: "Bukan file." };
    if (file.size <= 0) return { ok: false, reason: "File kosong." };
    if (file.size > MAX_BYTES) return { ok: false, reason: "File terlalu besar." };
    if (!ACCEPTED_MIME.has(file.type)) {
        // allow by extension fallback
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!["png", "svg"].includes(ext)) return { ok: false, reason: "Tipe file tidak didukung (hanya PNG/SVG)." };
    }
    return { ok: true };
}

/** @param {File} file @returns {Promise<LoadedImage>} */
export async function loadImageFromFile(file) {
    const sup = isSupportedFile(file);
    if (!sup.ok) throw new Error(sup.reason);

    const sniff = sniffType(file);
    if (sniff.type === "svg") {
        const text = await file.text();
        const sanitized = sanitizeSVG(text);
        const blob = new Blob([sanitized], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const img = await _urlToImage(url);
        URL.revokeObjectURL(url);
        return {
            image: img,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            type: "svg",
            sanitized: true,
        };
    } else if (sniff.type === "png") {
        const url = URL.createObjectURL(file);
        const img = await _urlToImage(url);
        URL.revokeObjectURL(url);
        return {
            image: img,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            type: "png",
        };
    } else {
        throw new Error("Tipe file tidak dikenali.");
    }
}

/** @param {File} file @returns {Sniff} */
export function sniffType(file) {
    const mime = file.type || "";
    if (mime === "image/svg+xml") return { type: "svg", mime };
    if (mime === "image/png") return { type: "png", mime };
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext === "svg") return { type: "svg", mime: mime || "image/svg+xml" };
    if (ext === "png") return { type: "png", mime: mime || "image/png" };
    return { type: "unknown", mime };
}

/** Aman: hilangkan <script>, on* events, foreignObject; cegah external href */
export function sanitizeSVG(svgText) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const svg = doc.documentElement;

        // remove scripts
        doc.querySelectorAll("script").forEach((n) => n.remove());
        // remove event handler attributes (onload, onclick, etc.)
        const walk = (node) => {
            if (node.attributes) {
                [...node.attributes].forEach((attr) => {
                    const name = attr.name.toLowerCase();
                    if (name.startsWith("on")) node.removeAttribute(attr.name);
                    if ((name === "href" || name === "xlink:href") && /^https?:/i.test(attr.value)) {
                        // disallow remote refs; allow data: and internal refs (#id)
                        if (!attr.value.startsWith("#") && !attr.value.startsWith("data:"))
                            node.removeAttribute(attr.name);
                    }
                });
            }
            node.childNodes && [...node.childNodes].forEach(walk);
        };
        walk(svg);

        // foreignObject → g (drop HTML)
        doc.querySelectorAll("foreignObject").forEach((n) => {
            const g = doc.createElementNS("http://www.w3.org/2000/svg", "g");
            while (n.firstChild) g.appendChild(n.firstChild);
            n.replaceWith(g);
        });

        // ensure width/height/viewBox exist (fallback)
        if (!svg.getAttribute("viewBox")) {
            const w = svg.getAttribute("width") || "512";
            const h = svg.getAttribute("height") || "512";
            svg.setAttribute("viewBox", `0 0 ${parseInt(w) || 512} ${parseInt(h) || 512}`);
        }

        const ser = new XMLSerializer();
        return ser.serializeToString(svg);
    } catch {
        // fallback: strip dangerous tags by regex (best-effort)
        return svgText
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
            .replace(/\son[a-z]+="[^"]*"/gi, "");
    }
}

/** @param {string} url */
async function _urlToImage(url) {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
    });
}

/** @param {LoadedImage} li @param {number} minPx */
export function ensureMinResolution(li, minPx = 256) {
    const ok = li.width >= minPx && li.height >= minPx;
    return { ok, message: ok ? "OK" : `Resolusi terlalu kecil (< ${minPx}px)` };
}
