const form = document.querySelector("#programme form.selection");

if (form) {
    const prices = JSON.parse(form.dataset.prices);
    const output = form.querySelector("output");
    const button = form.querySelector('button[type="submit"]');
    const registration = document.querySelector("#registration");
    const iframe = registration.querySelector("iframe");
    const prompt = registration.querySelector(".prompt");
    const embeddedForm = window.matchMedia("(min-width: 42rem)");

    const selectedRoles = () => [...form.querySelectorAll('.roles input[type="radio"]:checked')]
        .filter(({ value }) => value !== "Not attending");

    const updateSummary = () => {
        const count = selectedRoles().length;

        if (count) {
            const selection = document.createElement("span");
            const total = document.createElement("strong");

            selection.textContent = `${count} workshop${count === 1 ? "" : "s"} selected`;
            total.textContent = `€${prices[count]} to pay on the day`;
            output.replaceChildren(selection, total);
        } else {
            output.textContent = "Choose at least one workshop.";
        }

        button.disabled = count === 0;

        if (!iframe.hidden) {
            prompt.textContent = "Your selection above has changed. Continue again to update the registration form.";
        }
    };

    form.addEventListener("change", updateSummary);
    form.addEventListener("submit", (event) => {
        if (!embeddedForm.matches) return;

        event.preventDefault();

        const url = new URL(iframe.dataset.src);

        for (const [name, value] of new FormData(form)) url.searchParams.set(name, value);

        iframe.src = url;
        iframe.hidden = false;
        prompt.textContent = "Your selection is prefilled below. You can still adjust it in Google Forms.";
        registration.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    updateSummary();
}
