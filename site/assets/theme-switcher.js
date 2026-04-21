(() => {
    const storageKey = "conexao-theme";
    const link = document.querySelector("#theme-stylesheet") || document.querySelector('link[rel="stylesheet"]');
    const footer = document.querySelector("footer");

    if (!link || !footer) return;

    let activeTheme = sessionStorage.getItem(storageKey) === "classic" ? "classic" : "new";

    const applyTheme = (theme) => {
        const label = {
            classic: "Classic theme",
            new: "New theme",
        };

        activeTheme = theme === "classic" ? "classic" : "new";
        document.documentElement.dataset.theme = activeTheme;
        link.href = {
            classic: "assets/theme-classic.css",
            new: "assets/site.css",
        }[activeTheme];
        sessionStorage.setItem(storageKey, activeTheme);

        button.textContent = activeTheme === "classic" ? "Use new theme" : "Use classic theme";
        button.setAttribute("aria-label", `${label[activeTheme]} active. Switch theme.`);
    };

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-switch";
    button.addEventListener("click", () => {
        applyTheme(activeTheme === "classic" ? "new" : "classic");
    });

    const switchPanel = document.createElement("div");
    switchPanel.className = "theme-switch-panel";
    switchPanel.append(button);
    footer.after(switchPanel);
    applyTheme(activeTheme);
})();
