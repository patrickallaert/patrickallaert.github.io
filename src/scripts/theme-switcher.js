(() => {
    const activeThemes = ["gonzaga", "zabumba", "sanfona", "baiao", "roots", "abraco", "mandacaru", "triangulo"];
    const themes = activeThemes;
    const fonts = ["theme", "chewy", "architects-daughter"];
    const fontScopes = ["headings", "all"];
    const defaultTheme = "roots";
    const defaultFont = "theme";
    const defaultFontScope = "headings";
    const labels = { gonzaga: "Gonzaga", zabumba: "Zabumba", sanfona: "Sanfona", baiao: "Baião", roots: "Roots", abraco: "Abraço", mandacaru: "Mandacaru", triangulo: "Triângulo" };
    const fontLabels = { theme: "Theme", chewy: "Chewy", "architects-daughter": "Architects Daughter" };
    const fontScopeLabels = { headings: "Headings", all: "All text" };
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
    const assetVersion = "20260725";
    const isSelectableTheme = (theme) => themes.includes(theme);
    const isSelectableFont = (font) => fonts.includes(font);
    const isSelectableFontScope = (scope) => fontScopes.includes(scope);
    let activeTheme = isSelectableTheme(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : defaultTheme;
    let activeFont = isSelectableFont(document.documentElement.dataset.font) ? document.documentElement.dataset.font : defaultFont;
    let activeFontScope = isSelectableFontScope(document.documentElement.dataset.fontScope) ? document.documentElement.dataset.fontScope : defaultFontScope;
    let themeButtons = [];
    let fontButtons = [];
    let fontScopeButtons = [];
    let fontScopeGroup = null;
    const link = document.getElementById("theme-stylesheet");

    const storePreference = (key, value) => {
        try {
            sessionStorage.setItem(key, value);
        } catch {
            // Preferences still apply when storage is unavailable.
        }
    };

    const updateButtons = (buttons, activeValue) => {
        buttons.forEach((button) => {
            button.setAttribute("aria-pressed", button.dataset.value === activeValue ? "true" : "false");
        });
    };

    const applyTheme = (theme) => {
        activeTheme = isSelectableTheme(theme) ? theme : defaultTheme;
        document.documentElement.dataset.theme = activeTheme;
        link.href = `/assets/theme-${activeTheme}.css?v=${assetVersion}`;
        storePreference("conexao-theme", activeTheme);

        const logo = document.querySelector(".wordmark img");

        if (logo) {
            logo.src = `${logos[activeTheme]}?v=${assetVersion}`;
        }

        updateButtons(themeButtons, activeTheme);
    };

    const applyFont = (font) => {
        activeFont = isSelectableFont(font) ? font : defaultFont;
        document.documentElement.dataset.font = activeFont;
        storePreference("conexao-font", activeFont);
        updateButtons(fontButtons, activeFont);

        const scopeDisabled = activeFont === defaultFont;

        if (fontScopeGroup) {
            fontScopeGroup.setAttribute("aria-disabled", scopeDisabled ? "true" : "false");
        }

        fontScopeButtons.forEach((button) => {
            button.disabled = scopeDisabled;
        });
    };

    const applyFontScope = (scope) => {
        activeFontScope = isSelectableFontScope(scope) ? scope : defaultFontScope;
        document.documentElement.dataset.fontScope = activeFontScope;
        storePreference("conexao-font-scope", activeFontScope);
        updateButtons(fontScopeButtons, activeFontScope);
    };

    const createPreferenceGroup = (label, values, valueLabels, onSelect) => {
        const wrapper = document.createElement("div");
        wrapper.className = "preference-group";
        const labelElement = document.createElement("p");
        labelElement.className = "preference-label";
        labelElement.id = `preference-${label.toLowerCase().replaceAll(" ", "-")}`;
        labelElement.textContent = label;
        const group = document.createElement("div");
        group.className = "theme-switch-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-labelledby", labelElement.id);
        const preferenceButtons = values.map((value) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "theme-switch";
            button.dataset.value = value;
            button.textContent = valueLabels[value];
            button.addEventListener("click", () => onSelect(value));
            group.append(button);
            return button;
        });
        wrapper.append(labelElement, group);

        return { wrapper, group, buttons: preferenceButtons };
    };

    const mountSwitcher = () => {
        const footer = document.querySelector("footer");

        if (!footer || themeButtons.length) return;

        const switchPanel = document.createElement("div");
        switchPanel.className = "theme-switch-panel";
        const themePreference = createPreferenceGroup("Theme", themes, labels, applyTheme);
        const fontPreference = createPreferenceGroup("Font", fonts, fontLabels, applyFont);
        const fontScopePreference = createPreferenceGroup("Apply to", fontScopes, fontScopeLabels, applyFontScope);
        themeButtons = themePreference.buttons;
        fontButtons = fontPreference.buttons;
        fontScopeButtons = fontScopePreference.buttons;
        fontScopeGroup = fontScopePreference.group;
        switchPanel.append(themePreference.wrapper, fontPreference.wrapper, fontScopePreference.wrapper);
        footer.after(switchPanel);
        applyTheme(activeTheme);
        applyFontScope(activeFontScope);
        applyFont(activeFont);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountSwitcher);
    } else {
        mountSwitcher();
    }
})();
