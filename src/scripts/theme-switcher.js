(() => {
    let activeTheme = sessionStorage.getItem("conexao-theme") === "alpha" ? "alpha" : "beta";
    let button = null;
    const link = document.createElement("link");
    link.id = "theme-stylesheet";
    link.rel = "stylesheet";
    document.head.append(link);

    const applyTheme = (theme) => {
        activeTheme = theme === "alpha" ? "alpha" : "beta";
        document.documentElement.dataset.theme = activeTheme;
        link.href = `assets/theme-${activeTheme}.css`;
        sessionStorage.setItem("conexao-theme", activeTheme);

        if (button) {
            button.textContent = activeTheme === "alpha" ? "Use beta theme" : "Use alpha theme";
            button.setAttribute("aria-label", `${activeTheme === "alpha" ? "Alpha" : "Beta"} theme active. Switch theme.`);
        }
    };

    const mountSwitcher = () => {
        const footer = document.querySelector("footer");

        if (!footer || button) return;

        button = document.createElement("button");
        button.type = "button";
        button.className = "theme-switch";
        button.addEventListener("click", () => {
            applyTheme(activeTheme === "alpha" ? "beta" : "alpha");
        });

        const switchPanel = document.createElement("div");
        switchPanel.className = "theme-switch-panel";
        switchPanel.append(button);
        footer.after(switchPanel);
        applyTheme(activeTheme);
    };

    applyTheme(activeTheme);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountSwitcher);
    } else {
        mountSwitcher();
    }
})();
