document.addEventListener("DOMContentLoaded", () => {
    let e,
        t = document.querySelectorAll(".delivery__descr-caption");
    for (e = 0; e < t.length; e++)
        t[e].addEventListener("click", function () {
            this.classList.toggle("active");
            let e = this.nextElementSibling;
            e.style.maxHeight
                ? (e.style.maxHeight = null)
                : ((e.style.display = "block"), (e.style.maxHeight = e.scrollHeight + "px"));
        });
});
