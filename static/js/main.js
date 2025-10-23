(() => {
    "use strict";

    // --- LOGIQUE MODALES & OVERLAY ---
    function setupModal(modalSelector, closeSelector, openSelector = null) {
        const modal = document.querySelector(modalSelector);
        const closeBtn = document.querySelector(closeSelector);
        const overlay = document.querySelector(".overlay");
        const body = document.body;

        if (!modal || !closeBtn || !overlay) return;

        function closeModal() {
            modal.classList.remove("show");
            overlay.classList.remove("show");
            body.classList.remove("no-scroll");
        }

        closeBtn.addEventListener("click", closeModal);
        if (openSelector) {
            const openBtn = document.querySelector(openSelector);
            if (openBtn) {
                openBtn.addEventListener("click", function () {
                    modal.classList.add("show");
                    overlay.classList.add("show");
                    body.classList.add("no-scroll");
                });
            }
        }
        overlay.addEventListener("click", closeModal);
        modal.addEventListener("click", function (e) {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        // Initialisation des modales
        setupModal(".modal_city", ".modal__close-city", '[data-open="city"]');
        setupModal(".modal_recall", ".modal__close-recall", '[data-open="recall"]');
        setupModal(".modal_recall", ".modal__close-recall", '[data-open="recall_m"]');

        // --- LOGIQUE "LIRE LA SUITE" POUR LE SEO TEXT ---
        const seoShowMore = document.querySelector(".seotext__showmore");
        const seoHiddenPart = document.querySelector(".seo__hidden-part");
        if (seoShowMore && seoHiddenPart) {
            seoShowMore.addEventListener("click", () => {
                const isHidden = seoHiddenPart.classList.toggle("hidden");
                seoShowMore.textContent = isHidden ? "Читать полностью..." : "Скрыть";
            });
        }
        
        // --- RECHERCHE DANS LA MODALE DES VILLES ---
        const citySearchInput = document.getElementById("citySearch");
        if (citySearchInput) {
            const cityModal = citySearchInput.closest(".modal_city");
            const cityList = document.getElementById("cityList");
            const cityHeading = cityModal.querySelector(".city__heading");
            const cityClearBtn = document.getElementById("cityClear");
            const noResultsMessage = cityModal.querySelector(".city__no-results");

            if (cityList && noResultsMessage) {
                const allCityLinks = Array.from(cityList.querySelectorAll("a[data-city], span[data-city]"));
                let searchTimeout;

                function normalizeText(text) {
                    return (text || "")
                        .toLowerCase()
                        .replace(/ё/g, "е")
                        .normalize("NFD")
                        .replace(/\p{Diacritic}/gu, "")
                        .trim();
                }

                function filterCities() {
                    const query = normalizeText(citySearchInput.value);

                    if (cityClearBtn) cityClearBtn.style.visibility = query ? "visible" : "hidden";

                    let foundResults = false;
                    allCityLinks.forEach((link) => {
                        const cityName = normalizeText(link.dataset.city || link.textContent);
                        const isVisible = !query || cityName.includes(query);
                        link.style.display = isVisible ? "" : "none";
                        if (isVisible) foundResults = true;
                    });

                    noResultsMessage.style.display = foundResults || !query ? "none" : "block";
                }

                citySearchInput.addEventListener("input", () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(filterCities, 250);
                });

                if (cityClearBtn) {
                    cityClearBtn.addEventListener("click", () => {
                        citySearchInput.value = "";
                        citySearchInput.focus();
                        filterCities();
                    });
                }

                if (cityClearBtn) cityClearBtn.style.visibility = "hidden";
            }
        }

        // --- GESTION DU CONSENTEMENT POUR ACTIVER LES BOUTONS SUBMIT ---
        document.querySelectorAll("form").forEach((form) => {
            const consentCheckbox = form.querySelector('.js-consent, input[name="agreement"]');
            const submitButton = form.querySelector(".form__submit");
            if (!consentCheckbox || !submitButton) return;
            const toggleSubmitButton = () => {
                submitButton.disabled = !consentCheckbox.checked;
            };
            consentCheckbox.addEventListener("input", toggleSubmitButton);
            toggleSubmitButton();
        });

        // --- LOGIQUE D'UI POUR LE MENU DESKTOP (SURVOL) ---
        const catalogBtn = document.querySelector(".catalog__btn");
        const catMenu = document.querySelector(".cat_menu");
        if (catalogBtn && catMenu) {
            const closeMenu = () => {
                catalogBtn.classList.remove("opened");
                catMenu.classList.remove("opened");
            };
            catalogBtn.addEventListener("mouseenter", () => {
                catalogBtn.classList.add("opened");
                catMenu.classList.add("opened");
            });
            catMenu.addEventListener("mouseleave", closeMenu);
            catalogBtn.addEventListener("mouseleave", (e) => {
                if (!catMenu.contains(e.relatedTarget)) closeMenu();
            });
        }

        // --- GESTION DES ONGLETS (TABS) ---
        const tabLinks = document.querySelectorAll(".tablink");
        if(tabLinks) {
            tabLinks.forEach(link => {
                link.addEventListener("click", (e) => {
                    const tabButton = e.currentTarget;
                    const tabsContainer = tabButton.closest("[data-tabs]");
                    if (!tabsContainer) return;
                    
                    tabsContainer.querySelectorAll(".tablink").forEach(t => t.classList.remove("active"));
                    tabsContainer.querySelectorAll(".tabcontent").forEach(c => c.classList.remove("active"));
                    
                    const targetId = tabButton.dataset.target;
                    const targetContent = tabsContainer.querySelector(`#${CSS.escape(targetId)}`);
                    
                    if (targetContent) targetContent.classList.add("active");
                    tabButton.classList.add("active");
                });
            });
        }
        
        // --- GESTION DES COMPTEURS +/- SUR LES CARTES PRODUITS ---
        document.querySelectorAll(".subcategory__product-counter").forEach((counter) => {
            const amountInput = counter.querySelector(".amount");
            const minusBtn = counter.querySelector(".minus");
            const plusBtn = counter.querySelector(".plus");
            if (amountInput && minusBtn && plusBtn) {
                minusBtn.addEventListener("click", () => {
                    let value = parseInt(amountInput.value);
                    if (value > 1) amountInput.value = value - 1;
                });
                plusBtn.addEventListener("click", () => {
                    amountInput.value = parseInt(amountInput.value) + 1;
                });
            }
        });

        // --- GESTION DU SURVOL DES ICÔNES/IMAGES ---
        document.querySelectorAll(".popular__item, .service__card").forEach((item) => {
            const images = item.querySelectorAll("img");
            if (images.length < 2) return;
            item.addEventListener("mouseenter", () => {
                images[0].classList.add("hidden");
                images[1].classList.remove("hidden");
            });
            item.addEventListener("mouseleave", () => {
                images[0].classList.remove("hidden");
                images[1].classList.add("hidden");
            });
        });
    });
})();