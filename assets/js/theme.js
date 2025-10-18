/* theme.js — Dark/Light theme tanpa Prism */
(function () {
    const LS_KEY = "trhc.theme";
    const root = document.documentElement;

    function setTheme(mode) {
        const isLight = mode === "light";
        root.classList.toggle("light", isLight); // asumsi theme.css pakai .light untuk variabel
        try {
            localStorage.setItem(LS_KEY, mode);
        } catch {}
    }

    function getTheme() {
        try {
            return localStorage.getItem(LS_KEY) || "dark";
        } catch {
            return "dark";
        }
    }

    function toggleTheme() {
        setTheme(getTheme() === "dark" ? "light" : "dark");
    }

    function init() {
        setTheme(getTheme());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

    // expose
    window.TRTheme = { setTheme, toggleTheme };
})();
