if (location.pathname !== "/links/") {
    const measurementId = "G-4EZ01891D3";
    const storageKey = "conexao-cookie-preferences";
    const dialog = document.querySelector("#cookie-preferences");
    const settings = document.querySelector('footer button[aria-controls="cookie-preferences"]');
    const analytics = dialog.querySelector('input[name="analytics"]');
    const youtube = dialog.querySelector('input[name="youtube"]');
    const player = document.querySelector("#video-player");
    const preview = player?.querySelector("img");
    const playButton = player?.querySelector("button");
    let analyticsLoaded = false;
    let videoRequested = false;
    let preferences;

    try {
        preferences = JSON.parse(localStorage.getItem(storageKey));
    } catch {
        preferences = null;
    }

    if (!preferences || preferences.expires <= Date.now()) {
        preferences = { analytics: false, youtube: false, expires: 0 };
    }

    const openPreferences = () => {
        analytics.checked = preferences.analytics;
        youtube.checked = preferences.youtube;
        dialog.querySelector("details").open = true;
        dialog.returnValue = "";
        dialog.showModal();
    };

    const applyPreferences = () => {
        if (player) {
            document.querySelector("#youtube-notice").hidden = preferences.youtube;
            if (preferences.youtube && !player.querySelector("iframe")) {
                player.replaceChildren(document.querySelector("#youtube-player").content.cloneNode(true));
            } else if (!preferences.youtube && player.querySelector("iframe")) {
                player.replaceChildren(preview, playButton);
            }
        }

        if (preferences.analytics && !analyticsLoaded && location.hostname === "conexao.be") {
            analyticsLoaded = true;
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { window.dataLayer.push(arguments); };
            window.gtag("consent", "default", {
                analytics_storage: "denied",
                ad_storage: "denied",
                ad_user_data: "denied",
                ad_personalization: "denied",
            });
            window.gtag("consent", "update", { analytics_storage: "granted" });
            window.gtag("js", new Date());
            window.gtag("config", measurementId, {
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
            });

            const script = document.createElement("script");
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
            document.head.append(script);
        } else if (!preferences.analytics && analyticsLoaded) {
            window[`ga-disable-${measurementId}`] = true;

            for (const cookie of document.cookie.split(";")) {
                const name = cookie.trim().split("=")[0];
                if (name !== "_ga" && !name.startsWith("_ga_")) continue;

                for (const domain of ["", "; domain=conexao.be"]) {
                    document.cookie = `${name}=; max-age=0; path=/${domain}`;
                }
            }

            location.reload();
        }
    };

    settings.hidden = false;
    settings.addEventListener("click", openPreferences);

    if (playButton) {
        playButton.hidden = false;
        playButton.addEventListener("click", () => {
            videoRequested = true;
            openPreferences();
            youtube.focus();
        });
    }

    dialog.addEventListener("close", () => {
        if (videoRequested) {
            (player.querySelector("iframe") || playButton).focus();
            videoRequested = false;
        }
    });

    dialog.addEventListener("submit", (event) => {
        const action = event.submitter.value;
        preferences = {
            analytics: action === "all" || (action === "selection" && analytics.checked),
            youtube: action === "all" || (action === "selection" && youtube.checked),
            expires: Date.now() + 180 * 24 * 60 * 60 * 1000,
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify(preferences));
        } catch {
            // The choice still applies to this page if storage is unavailable.
        }

        applyPreferences();
    });

    if (preferences.expires > Date.now()) {
        applyPreferences();
    } else if (location.pathname !== "/legal/") {
        dialog.showModal();
    }
}
