/* header.js — FINAL (HOME / .app-header) for TRDIL
   - Injects <header.app-header> if missing
   - Binds controls (theme & UI lang)
   - Syncs UI language badge (dengan window.TRI18N)
   - Registers Service Worker (sw.js di root)
*/
(() => {
    "use strict";

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    function t(key, fallback) {
        const tri18n = window.TRI18N && typeof window.TRI18N.t === "function" ? window.TRI18N.t : null;
        const out = tri18n ? tri18n(key) : null;
        return out ?? (fallback || key);
    }

    function injectHeader() {
        const existing = $(".app-header");
        if (existing) return existing;

        const h = document.createElement("header");
        h.className = "app-header";
        h.innerHTML = `
      <div class="brand" aria-label="TenRusl Droid IconLab">
        <img src="assets/images/icon.svg" width="28" height="28" alt="TRDIL" />
        <strong>
          <span class="brand-full">TenRusl Droid IconLab</span>
          <span class="brand-abbr">TRDIL</span>
        </strong>
        <span class="badge">PWA</span>
      </div>

      <nav class="controls" aria-label="Toolbar">
        <button
          id="btnUiLang"
          class="icon-btn"
          type="button"
          title="Toggle UI Language"
          aria-label="Toggle UI Language"
        >
          <i class="fa-solid fa-globe icon" aria-hidden="true"></i>
          <span id="uiLangBadge" class="badge-mini">EN</span>
        </button>
        <button
          id="btnTheme"
          class="icon-btn btn-theme"
          type="button"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          <i class="fa-solid fa-sun icon icon-sun" aria-hidden="true"></i>
          <i class="fa-solid fa-moon icon icon-moon" aria-hidden="true"></i>
        </button>
      </nav>
    `;
        const first = document.body.firstChild;
        if (first) document.body.insertBefore(h, first);
        else document.body.appendChild(h);
        return h;
    }

    function applyI18N(scope) {
        $$("[data-i18n]", scope).forEach((el) => {
            const key = el.getAttribute("data-i18n");
            const label = el.querySelector(".label");
            const text = t(key, label ? label.textContent : el.textContent);
            if (label) label.textContent = text;
            else el.textContent = text;
        });
        setUiBadge(scope);
    }

    function getCurrentUiLang() {
        try {
            const fromHdr = localStorage.getItem("trhc.uiLang");
            if (fromHdr) return String(fromHdr).toLowerCase();
            const fromTrdil = localStorage.getItem("trdil:lang");
            if (fromTrdil) return String(fromTrdil).toLowerCase();
        } catch {}
        const htmlLang = (document.documentElement.lang || "").toLowerCase();
        if (htmlLang === "id" || htmlLang === "en") return htmlLang;
        return "en";
    }
    function setUiBadge(scope) {
        const badge = $("#uiLangBadge", scope || document);
        if (!badge) return;
        const lang = getCurrentUiLang();
        badge.textContent = (lang || "en").toUpperCase();
    }

    function bindHeader() {
        const header = $(".app-header") || injectHeader();
        if (!header) return;

        document.documentElement.classList.remove("no-js");

        const btnTheme = $("#btnTheme", header);
        const btnUiLang = $("#btnUiLang", header);

        if (btnTheme) {
            btnTheme.addEventListener("click", () => {
                if (window.TRTheme && typeof TRTheme.toggleTheme === "function") {
                    TRTheme.toggleTheme();
                }
            });
        }
        if (btnUiLang) {
            btnUiLang.addEventListener("click", () => {
                if (window.TRI18N && typeof TRI18N.toggleUiLang === "function") {
                    TRI18N.toggleUiLang();
                } else {
                    try {
                        const cur = getCurrentUiLang();
                        const next = cur === "en" ? "id" : "en";
                        localStorage.setItem("trhc.uiLang", next);
                        localStorage.setItem("trdil:lang", next);
                    } catch {}
                    setUiBadge(header);
                    document.dispatchEvent(
                        new CustomEvent("trhc:i18nUpdated", { detail: { lang: getCurrentUiLang() } })
                    );
                }
            });
        }

        setUiBadge(header);
        applyI18N(header);

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("sw.js").catch(() => {
                /* ignore */
            });
        }
    }

    document.addEventListener("trhc:i18nUpdated", () => {
        const h = $(".app-header");
        if (h) {
            setUiBadge(h);
            applyI18N(h);
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindHeader, { once: true });
    } else {
        bindHeader();
    }

    window.TRHeader = window.TRHeader || {
        inject: injectHeader,
        bind: bindHeader,
        setBadge: setUiBadge,
    };
})();
