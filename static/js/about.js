document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".about__regions, .about__nums, .about__time").forEach((e) => {
        if (!e.querySelector(".about__flip")) return;
        e.setAttribute("role", "button"), (e.tabIndex = 0), e.setAttribute("aria-expanded", "false");
        const t = () => {
            const t = e.classList.toggle("is-open");
            e.setAttribute("aria-expanded", String(t));
        };
        e.addEventListener("click", (e) => {
            e.target.closest("a") || t();
        }),
            e.addEventListener("keydown", (e) => {
                ("Enter" !== e.key && " " !== e.key) || (e.preventDefault(), t());
            });
    });
});
