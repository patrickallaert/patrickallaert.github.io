(() => {
    const storageKey = "conexao-theme";
    const link = document.querySelector("#theme-stylesheet") || document.querySelector('link[rel="stylesheet"]');
    const footer = document.querySelector("footer");

    if (!link || !footer) return;

    let activeTheme = sessionStorage.getItem(storageKey) === "alpha" ? "alpha" : "beta";

    const applyTheme = (theme) => {
        const label = {
            alpha: "Alpha theme",
            beta: "Beta theme",
        };

        activeTheme = theme === "alpha" ? "alpha" : "beta";
        document.documentElement.dataset.theme = activeTheme;
        link.href = {
            alpha: "assets/theme-alpha.css",
            beta: "assets/theme-beta.css",
        }[activeTheme];
        sessionStorage.setItem(storageKey, activeTheme);

        button.textContent = activeTheme === "alpha" ? "Use beta theme" : "Use alpha theme";
        button.setAttribute("aria-label", `${label[activeTheme]} active. Switch theme.`);
    };

    const button = document.createElement("button");
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
})();
