// C:\laragon\www\TenRusl-Droid-IconLab\assets\js\modules\generator\zip.js
// ESM — kemas entri menjadi ZIP dan simpan (JSZip + FileSaver, vendor lokal)

/// <reference path="../../vendor/jszip.min.js" />
/// <reference path="../../vendor/FileSaver.min.js" />

/**
 * @typedef {{ path:string, blob?:Blob, text?:string }} ZipEntry
 */

/**
 * Buat ZIP dari daftar entri & simpan ke user.
 * Memerlukan window.JSZip dan window.saveAs (disediakan oleh vendor lokal).
 * @param {ZipEntry[]} entries
 * @param {string} [zipName] - default 'AndroidAppIcons.zip'
 */
export async function saveZip(entries, zipName = "AndroidAppIcons.zip") {
    const JSZip = /** @type {any} */ (window).JSZip;
    const saveAs = /** @type {any} */ (window).saveAs;

    if (!JSZip)
        throw new Error("JSZip belum dimuat. Pastikan assets/js/vendor/jszip.min.js terpasang sebelum pemanggilan.");
    if (!saveAs)
        throw new Error(
            "FileSaver belum dimuat. Pastikan assets/js/vendor/FileSaver.min.js terpasang sebelum pemanggilan."
        );

    const zip = new JSZip();
    for (const e of entries) {
        if (e.blob) {
            zip.file(e.path, e.blob);
        } else if (e.text != null) {
            zip.file(e.path, e.text);
        }
    }

    const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });

    saveAs(blob, zipName);
}
