(() => {
    const activeThemes = ["gonzaga", "zabumba", "sanfona", "baiao", "roots", "abraco", "mandacaru", "triangulo"];
    const themes = activeThemes;
    const defaultTheme = "roots";
    const labels = { gonzaga: "Gonzaga", zabumba: "Zabumba", sanfona: "Sanfona", baiao: "Baião", roots: "Roots", abraco: "Abraço", mandacaru: "Mandacaru", triangulo: "Triângulo" };
    const logos = {
        gonzaga: "/assets/logos/logo-full-black.svg",
        zabumba: "/assets/logos/logo-full-blue.svg",
        sanfona: "/assets/logos/logo-full-green.svg",
        baiao: "/assets/logos/logo-full-white.svg",
        roots: "/assets/logos/logo-full-blue.svg",
        abraco: "/assets/logos/logo-full-white.svg",
        mandacaru: "/assets/logos/logo-full-yellow.svg",
        triangulo: "/assets/logos/logo-full-yellow.svg",
    };
    const assetVersion = "20260723";
    const isSelectableTheme = (theme) => themes.includes(theme);
    let activeTheme = isSelectableTheme(sessionStorage.getItem("conexao-theme")) ? sessionStorage.getItem("conexao-theme") : defaultTheme;
    let buttons = [];
    const link = document.createElement("link");
    link.id = "theme-stylesheet";
    link.rel = "stylesheet";
    document.head.append(link);

    const applyTheme = (theme) => {
        activeTheme = isSelectableTheme(theme) ? theme : defaultTheme;
        document.documentElement.dataset.theme = activeTheme;
        link.href = `/assets/theme-${activeTheme}.css?v=${assetVersion}`;
        sessionStorage.setItem("conexao-theme", activeTheme);

        const logo = document.querySelector(".wordmark img");

        if (logo) {
            logo.src = `${logos[activeTheme]}?v=${assetVersion}`;
        }

        if (buttons.length) {
            buttons.forEach((button) => {
                const themeName = button.dataset.theme;
                const isActive = themeName === activeTheme;
                button.setAttribute("aria-pressed", isActive ? "true" : "false");
                button.setAttribute("aria-label", `${labels[themeName]} theme${isActive ? " active" : ""}`);
            });
        }
    };

    const mountSwitcher = () => {
        const footer = document.querySelector("footer");

        if (!footer || buttons.length) return;

        const switchPanel = document.createElement("div");
        switchPanel.className = "theme-switch-panel";
        const group = document.createElement("div");
        group.className = "theme-switch-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "Theme selection");
        buttons = themes.map((themeName) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "theme-switch";
            button.dataset.theme = themeName;
            button.textContent = labels[themeName];
            button.addEventListener("click", () => applyTheme(themeName));
            group.append(button);
            return button;
        });
        switchPanel.append(group);
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
