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
        const cityClearBtn = document.getElementById("cityClear");
        const cityList = document.getElementById("cityList");
        if (citySearchInput && cityList) {
            const cityLinks = Array.from(cityList.querySelectorAll("a[data-city]"));
            function normalizeText(text) {
                return (text || "").toLowerCase().replace(/ё/g, "е").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
            }
            function filterCities() {
                const query = normalizeText(citySearchInput.value);
                if (cityClearBtn) cityClearBtn.style.visibility = query ? "visible" : "hidden";
                cityLinks.forEach(link => {
                    const cityName = normalizeText(link.dataset.city || link.textContent);
                    link.style.display = cityName.includes(query) ? "" : "none";
                });
            }
            citySearchInput.addEventListener("input", filterCities);
            if (cityClearBtn) {
                cityClearBtn.addEventListener("click", () => {
                    citySearchInput.value = "";
                    citySearchInput.focus();
                    filterCities();
                });
            }
            filterCities();
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
        
        // // --- LOGIQUE D'UI POUR LE MENU MOBILE COULISSANT ---
        // const mobileMenu = document.querySelector("[data-menu]");
        // if(mobileMenu) {
        //     const overlay = mobileMenu.querySelector("[data-menu-overlay]");
        //     const panels = [...mobileMenu.querySelectorAll(".menu-panel")];
        //     const rootPanel = mobileMenu.querySelector('.menu-panel[is="root"]');
        //     const panelStack = [];

        //     const setActivePanel = (panel) => {
        //         panels.forEach(p => {
        //             const isActive = p === panel;
        //             p.classList.toggle("is-active", isActive);
        //             p.setAttribute("aria-hidden", !isActive);
        //         });
        //     };

        //     const openMobileMenu = () => {
        //         mobileMenu.classList.add("is-open");
        //         document.body.classList.add("no-scroll");
        //         setActivePanel(rootPanel);
        //     };
        //     const closeMobileMenu = () => {
        //         mobileMenu.classList.remove("is-open");
        //         document.body.classList.remove("no-scroll");
        //         panelStack.length = 0; // Vider l'historique de navigation
        //         setActivePanel(rootPanel); // Revenir au panneau racine

        //         // Réinitialiser tous les accordéons à l'état fermé
        //         mobileMenu.querySelectorAll('.menu-accordion.is-open').forEach(accordion => {
        //             accordion.classList.remove('is-open');
        //             const toggle = accordion.querySelector('[data-acc-toggle]');
        //             const content = accordion.querySelector('.menu-accordion__content');
        //             if (toggle) toggle.setAttribute('aria-expanded', 'false');
        //             if (content) {
        //                 content.setAttribute('aria-hidden', 'true');
        //                 content.style.maxHeight = '0px';
        //             }
        //         });
        //     };


        //     overlay.addEventListener("click", closeMobileMenu);
            
        //     mobileMenu.addEventListener("click", (e) => {
        //         const mobileMenu = document.querySelector("[data-menu]");
        //         if (mobileMenu) {
        //             const overlay = mobileMenu.querySelector("[data-menu-overlay]");
        //             const panels = [...mobileMenu.querySelectorAll(".menu-panel")];
        //             const rootPanel = mobileMenu.querySelector('.menu-panel[is="root"]');
        //             const panelStack = []; // Pour garder en mémoire le chemin de navigation

        //             // Fonction pour afficher le bon panneau
        //             const setActivePanel = (panel) => {
        //                 if (!panel) return;
        //                 panels.forEach(p => {
        //                     const isActive = p === panel;
        //                     p.classList.toggle("is-active", isActive);
        //                     p.setAttribute("aria-hidden", String(!isActive));
        //                 });
        //             };

        //             // Fonction pour ouvrir le menu
        //             const openMobileMenu = () => {
        //                 mobileMenu.classList.add("is-open");
        //                 document.body.classList.add("no-scroll");
        //                 setActivePanel(rootPanel);
        //             };

        //             // Fonction pour fermer complètement le menu
        //             const closeMobileMenu = () => {
        //                 mobileMenu.classList.remove("is-open");
        //                 document.body.classList.remove("no-scroll");
        //                 panelStack.length = 0; // Vider l'historique de navigation
        //                 setActivePanel(rootPanel); // Revenir au panneau racine pour la prochaine ouverture
        //             };

        //             // Écouteurs pour ouvrir/fermer
        //             overlay.addEventListener("click", closeMobileMenu);
        //             document.querySelectorAll("[data-open-menu]").forEach(btn => btn.addEventListener("click", openMobileMenu));
        //             document.addEventListener("keydown", (e) => {
        //                 if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        //                     closeMobileMenu();
        //                 }
        //             });

        //             // Écouteur principal pour toutes les actions à l'intérieur du menu
        //             mobileMenu.addEventListener("click", (e) => {
        //                 const target = e.target;

        //                 // Clic sur un bouton d'accordéon (ex: "Каталог")
        //                 const accToggle = target.closest("[data-acc-toggle]");
        //                 if (accToggle) {
        //                     const accordion = accToggle.closest(".menu-accordion");
        //                     const content = accordion.querySelector(".menu-accordion__content");
        //                     const isOpen = accordion.classList.toggle("is-open");
                            
        //                     accToggle.setAttribute("aria-expanded", String(isOpen));
        //                     content.setAttribute("aria-hidden", String(!isOpen));
                            
        //                     const maxHeight = Math.min(content.scrollHeight, Math.floor(0.56 * window.innerHeight), 520);
        //                     content.style.maxHeight = isOpen ? `${maxHeight}px` : "0px";
        //                     return;
        //                 }

        //                 // Clic sur le bouton de fermeture principal
        //                 if (target.closest("[data-menu-close]")) {
        //                     closeMobileMenu();
        //                     return;
        //                 }

        //                 // Clic sur le bouton "Retour"
        //                 if (target.closest("[data-menu-back]")) {
        //                     if (panelStack.length === 0) {
        //                         setActivePanel(rootPanel);
        //                     } else {
        //                         panelStack.pop();
        //                         setActivePanel(panelStack[panelStack.length - 1] || rootPanel);
        //                     }
        //                     return;
        //                 }

        //                 // Clic pour ouvrir un sous-menu
        //                 const submenuTrigger = target.closest("[data-submenu]");
        //                 if (submenuTrigger) {
        //                     const panelId = submenuTrigger.dataset.submenu;
        //                     const targetPanel = mobileMenu.querySelector(`.menu-panel[data-panel="${panelId}"]`);
        //                     if (targetPanel) {
        //                         panelStack.push(targetPanel);
        //                         setActivePanel(targetPanel);
        //                     }
        //                 }
        //             });
        //         }
        //     });

        //     document.querySelectorAll("[data-open-menu]").forEach(btn => {
        //         btn.addEventListener("click", openMobileMenu);
        //     });
        //     document.addEventListener("keydown", (e) => {
        //         if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        //             closeMobileMenu();
        //         }
        //     });
        // }
        // --- LOGIQUE D'UI POUR LE MENU MOBILE COULISSANT (FINALE ET CORRIGÉE) ---
        const mobileMenu = document.querySelector("[data-menu]");
        if (mobileMenu) {
            const overlay = mobileMenu.querySelector("[data-menu-overlay]");
            const panels = [...mobileMenu.querySelectorAll(".menu-panel")];
            const rootPanel = mobileMenu.querySelector('.menu-panel[is="root"]');
            const closeButton = mobileMenu.querySelector('[data-menu-close]');
            
            // `panelStack` est défini UNE SEULE FOIS pour conserver l'historique
            const panelStack = []; 
            let menuTriggerElement = null;

            // Fonction pour afficher le bon panneau
            const setActivePanel = (panel) => {
                if (!panel) return;
                panels.forEach(p => {
                    const isActive = p === panel;
                    p.classList.toggle("is-active", isActive);
                    p.setAttribute("aria-hidden", String(!isActive));
                });
            };
            
            // Fonction pour ouvrir le menu
            const openMobileMenu = (triggerElement) => {
                menuTriggerElement = triggerElement;
                mobileMenu.classList.add("is-open");
                mobileMenu.setAttribute('aria-hidden', 'false');
                document.body.classList.add("no-scroll");
                setActivePanel(rootPanel);
                if(closeButton) setTimeout(() => closeButton.focus(), 100); 
            };

            // Fonction pour fermer complètement le menu
            const closeMobileMenu = () => {
                mobileMenu.classList.remove("is-open");
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.classList.remove("no-scroll");
                panelStack.length = 0; // On vide l'historique
                setActivePanel(rootPanel);
                if(menuTriggerElement) menuTriggerElement.focus(); 

                // Réinitialiser les accordéons (votre code est bon)
                mobileMenu.querySelectorAll('.menu-accordion.is-open').forEach(accordion => {
                    accordion.classList.remove('is-open');
                    const toggle = accordion.querySelector('[data-acc-toggle]');
                    const content = accordion.querySelector('.menu-accordion__content');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                    if (content) {
                        content.setAttribute('aria-hidden', 'true');
                        content.style.maxHeight = '0px';
                    }
                });
            };

            // Écouteurs pour ouvrir/fermer le menu
            overlay.addEventListener("click", closeMobileMenu);
            document.querySelectorAll("[data-open-menu]").forEach(btn => {
                btn.addEventListener("click", () => openMobileMenu(btn));
            });
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
                    closeMobileMenu();
                }
            });

            // Écouteur principal UNIQUE pour toutes les actions à l'intérieur du menu
            mobileMenu.addEventListener("click", (e) => {
                const target = e.target;

                // Clic sur un bouton d'accordéon
                const accToggle = target.closest("[data-acc-toggle]");
                if (accToggle) {
                    const accordion = accToggle.closest(".menu-accordion");
                    const content = accordion.querySelector(".menu-accordion__content");
                    const isOpen = accordion.classList.toggle("is-open");
                    
                    accToggle.setAttribute("aria-expanded", String(isOpen));
                    content.setAttribute("aria-hidden", String(!isOpen));
                    
                    const maxHeight = content.scrollHeight;
                    content.style.maxHeight = isOpen ? `${maxHeight}px` : "0px";
                    return;
                }

                // Clic sur le bouton de fermeture
                if (target.closest("[data-menu-close]")) {
                    closeMobileMenu();
                    return;
                }

                // Clic sur le bouton "Retour"
                if (target.closest("[data-menu-back]")) {
                    panelStack.pop(); // On retire le panneau actuel de l'historique
                    // On affiche le panneau précédent, ou le panneau racine s'il n'y a plus rien
                    setActivePanel(panelStack[panelStack.length - 1] || rootPanel); 
                    return;
                }

                // Clic pour ouvrir un sous-menu
                const submenuTrigger = target.closest("[data-submenu]");
                if (submenuTrigger) {
                    const panelId = submenuTrigger.dataset.submenu;
                    const targetPanel = mobileMenu.querySelector(`.menu-panel[data-panel="${panelId}"]`);
                    if (targetPanel) {
                        panelStack.push(targetPanel); // On ajoute le nouveau panneau à l'historique
                        setActivePanel(targetPanel);
                    }
                }
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