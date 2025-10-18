// C:\laragon\www\TenRusl-Droid-IconLab\assets\js\modules\rendering\mask.js
// ESM — path mask untuk squircle/circle/rounded

/**
 * Bangun Path2D mask sesuai shape.
 * @param {'squircle'|'circle'|'rounded'} shape
 * @param {number} size - ukuran kanvas (px)
 * @returns {Path2D}
 */
export function pathMask(shape, size) {
    const r = size / 2;
    const d = size;
    const p = new Path2D();

    if (shape === "circle") {
        p.arc(r, r, r, 0, Math.PI * 2);
        return p;
    }

    if (shape === "rounded") {
        const c = Math.max(4, Math.round(size * 0.22)); // radius pojok ≈22%
        p.moveTo(c, 0);
        p.lineTo(d - c, 0);
        p.quadraticCurveTo(d, 0, d, c);
        p.lineTo(d, d - c);
        p.quadraticCurveTo(d, d, d - c, d);
        p.lineTo(c, d);
        p.quadraticCurveTo(0, d, 0, d - c);
        p.lineTo(0, c);
        p.quadraticCurveTo(0, 0, c, 0);
        p.closePath();
        return p;
    }

    // Default: squircle (superellipse approx, n≈5, polyline)
    const n = 5; // eksponen superellipse
    const steps = 120; // jumlah segmen poligon
    const toRad = Math.PI / 180;
    let first = true;
    for (let i = 0; i <= steps; i++) {
        const deg = (i / steps) * 360;
        const t = deg * toRad;
        const x = r * Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 2 / n) + r;
        const y = r * Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 2 / n) + r;
        if (first) {
            p.moveTo(x, y);
            first = false;
        } else {
            p.lineTo(x, y);
        }
    }
    p.closePath();
    return p;
}
