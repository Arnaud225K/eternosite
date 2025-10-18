// document.addEventListener('DOMContentLoaded', function() {
//     "use strict";

//     // =========================================================================
//     // SECTION 1 : LOGIQUE D'INTERFACE UTILISATEUR (Votre code 'category.js')
//     // J'ai légèrement réorganisé votre code en une fonction pour pouvoir 
//     // le ré-appeler après une mise à jour AJAX.
//     // =========================================================================
//     function initializeFilterUI() {
//         const filterContainer = document.querySelector(".filters");
//         if (!filterContainer) return;

//         // Logique pour fermer tous les dropdowns
//         const closeAllDropdowns = () => {
//             filterContainer.querySelectorAll(".filters__box-item.open").forEach(item => {
//                 item.classList.remove("open");
//                 item.querySelector(".filters__dropdown")?.classList.add("hidden");
//             });
//         };
        
//         // Logique d'ouverture/fermeture des dropdowns
//         filterContainer.querySelectorAll(".filters__box-item").forEach(item => {
//             // Clic sur le titre pour ouvrir/fermer
//             item.addEventListener("click", (e) => {
//                 if (e.target.closest(".filters__dropdown")) return;
//                 const wasOpen = item.classList.contains("open");
//                 closeAllDropdowns();
//                 if (!wasOpen) {
//                     item.classList.add("open");
//                     item.querySelector(".filters__dropdown")?.classList.remove("hidden");
//                 }
//                 e.stopPropagation();
//             });
//         });

//         // Clic en dehors pour fermer
//         document.addEventListener("click", (e) => {
//             if (!e.target.closest(".filters__box-item")) {
//                 closeAllDropdowns();
//             }
//         });

//         // Logique de recherche à l'intérieur de chaque dropdown
//         filterContainer.querySelectorAll(".filters__search-input").forEach(searchInput => {
//             const dropdown = searchInput.closest('.filters__dropdown');
//             const labels = dropdown.querySelectorAll("label");
            
//             searchInput.addEventListener('input', () => {
//                 const searchTerm = searchInput.value.toLowerCase().trim();
//                 labels.forEach(label => {
//                     const text = label.textContent.toLowerCase().trim();
//                     const isVisible = text.includes(searchTerm);
//                     label.style.display = isVisible ? '' : 'none';
//                 });
//             });
//         });

//         // Logique pour la version mobile (accordéon)
//         if (window.innerWidth <= 692) {
//             const title = filterContainer.querySelector(".filters__title");
//             const wrapper = filterContainer.querySelector(".filters__wrapper");
//             if (title && wrapper) {
//                 wrapper.style.maxHeight = "0px";
//                 wrapper.style.overflow = "hidden";
//                 title.addEventListener("click", () => {
//                     if (wrapper.style.maxHeight !== "0px") {
//                         wrapper.style.maxHeight = "0px";
//                     } else {
//                         wrapper.style.maxHeight = wrapper.scrollHeight + "px";
//                     }
//                 });
//             }
//         }
//     }


//     // =========================================================================
//     // SECTION 2 : LOGIQUE AJAX (Mon code 'custom.js')
//     // Ce code est adapté pour fonctionner avec la section 1.
//     // =========================================================================
//     const mainContainer = document.getElementById('ajax-category-container');
//     if (!mainContainer) return;

//     const baseApiUrl = mainContainer.dataset.apiUrl;
//     const productListContainer = document.getElementById('product-list-container');
//     const filtersContainer = document.getElementById('filters-container');
//     const activeFiltersContainer = document.getElementById('active-filters-container');
//     const paginationContainer = document.getElementById('pagination-container');

//     function buildFilterUrlSegment() {
//         const form = document.getElementById('filters-form');
//         if (!form) return '';
//         const activeFilters = {};
//         form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
//             if (!activeFilters[cb.name]) activeFilters[cb.name] = [];
//             activeFilters[cb.name].push(cb.value);
//         });
//         const sortedKeys = Object.keys(activeFilters).sort();
//         if (sortedKeys.length === 0) return '';
//         const parts = sortedKeys.map(key => `${key}=${activeFilters[key].sort().join(',')}`);
//         return `f/${parts.join('/')}/`;
//     }

//     async function fetchAndUpdatePage(url) {
//         mainContainer.classList.add('loading');
//         try {
//             const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
//             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//             const data = await response.json();

//             if (productListContainer && data.html_products) productListContainer.innerHTML = data.html_products;
//             if (filtersContainer && data.html_filters) filtersContainer.innerHTML = data.html_filters;
//             if (activeFiltersContainer && data.html_active_filters) activeFiltersContainer.innerHTML = data.html_active_filters;
//             if (paginationContainer && data.html_pagination) paginationContainer.innerHTML = data.html_pagination;

//             const h1 = document.getElementById('page-h1-title');
//             if (h1 && data.h1_title) {
//                 h1.textContent = data.h1_title;
//                 document.title = data.h1_title;
//             }

//             if (window.history.pushState && data.new_url) {
//                 history.pushState({ path: data.new_url }, '', data.new_url);
//             }
            
//             // C'est la ligne la plus importante : on ré-applique le JS de l'UI
//             // sur le nouveau bloc de filtres qui vient d'être chargé.
//             initializeFilterUI();

//         } catch (error) {
//             console.error("Error during AJAX update:", error);
//         } finally {
//             mainContainer.classList.remove('loading');
//             window.scrollTo({ top: mainContainer.offsetTop, behavior: 'smooth' });
//         }
//     }

//     // --- DÉLÉGATION DES ÉVÉNEMENTS ---
//     mainContainer.addEventListener('click', function(event) {
//         const paginationLink = event.target.closest('#pagination-container a');
//         if (paginationLink) {
//             event.preventDefault();
//             const pageUrl = new URL(paginationLink.href);
//             const pageQueryString = pageUrl.search;
//             const filterSegment = buildFilterUrlSegment();
//             fetchAndUpdatePage(`${baseApiUrl}${filterSegment}${pageQueryString}`);
//         }

//         const removeFilterBtn = event.target.closest('.js-remove-filter-btn');
//         if (removeFilterBtn) {
//             event.preventDefault();
//             const checkbox = document.querySelector(`#filters-form input[name="${removeFilterBtn.dataset.groupSlug}"][value="${removeFilterBtn.dataset.valueSlug}"]`);
//             if (checkbox) {
//                 checkbox.checked = false;
//                 checkbox.dispatchEvent(new Event('change', { bubbles: true }));
//             }
//         }
//     });

//     // Écouteur pour les changements dans les filtres
//     mainContainer.addEventListener('change', function(event) {
//         if (event.target.matches('#filters-form input[type="checkbox"]')) {
//             const filterSegment = buildFilterUrlSegment();
//             fetchAndUpdatePage(`${baseApiUrl}${filterSegment}`);
//         }
//     });

//     // Gère le bouton "Réinitialiser" qui est dans le formulaire
//     mainContainer.addEventListener('click', function(event) {
//         if (event.target.closest('.filters__box-reset') || event.target.closest('.js-reset-filters-btn')) {
//             event.preventDefault();
//             const form = document.getElementById('filters-form');
//             if (form) {
//                 form.reset();
//                 form.dispatchEvent(new Event('change', { bubbles: true }));
//             }
//         }
//     });
    
//     // Initialisation au premier chargement de la page
//     initializeFilterUI();
// });




// document.addEventListener('DOMContentLoaded', function() {
//     "use strict";

//     // =========================================================================
//     // SECTION 1 : LOGIQUE D'INTERFACE UTILISATEUR (Votre code 'category.js')
//     // Cette fonction initialise les interactions visuelles des filtres.
//     // Elle est conçue pour être appelée au chargement initial et après chaque mise à jour AJAX.
//     // =========================================================================
//     function initializeFilterUI() {
//         const filterContainer = document.querySelector(".filters");
//         if (!filterContainer) 
//             return;

//         // Fonction utilitaire pour fermer tous les dropdowns ouverts
//         const closeAllDropdowns = () => {
//             filterContainer.querySelectorAll(".filters__box-item.open").forEach(item => {
//                 item.classList.remove("open");
//                 item.querySelector(".filters__dropdown")?.classList.add("hidden");
//             });
//         };
        
//         // Gère l'ouverture/fermeture des dropdowns de filtres
//         filterContainer.querySelectorAll(".filters__box-item").forEach(item => {
//             item.addEventListener("click", (e) => {
//                 if (e.target.closest(".filters__dropdown")) 
//                     return;
                
//                 const wasOpen = item.classList.contains("open");
//                 closeAllDropdowns(); // On ferme d'abord tous les autres
                
//                 if (!wasOpen) {
//                     item.classList.add("open");
//                     item.querySelector(".filters__dropdown")?.classList.remove("hidden");
//                 }
//                 e.stopPropagation();
//             });
//         });

//         // Gère la fermeture des dropdowns si on clique n'importe où ailleurs sur la page
//         document.addEventListener("click", (e) => {
//             if (!e.target.closest(".filters__box-item")) {
//                 closeAllDropdowns();
//             }
//         });

//         // Gère la recherche en temps réel dans chaque dropdown
//         filterContainer.querySelectorAll(".filters__search-input").forEach(searchInput => {
//             const dropdown = searchInput.closest('.filters__dropdown');
//             const labels = dropdown.querySelectorAll("label");
            
//             searchInput.addEventListener('input', () => {
//                 const searchTerm = searchInput.value.toLowerCase().trim();
//                 labels.forEach(label => {
//                     const text = label.textContent.toLowerCase().trim();
//                     const isVisible = text.includes(searchTerm);
//                     label.style.display = isVisible ? '' : 'none';
//                 });
//             });
//         });

//         // Gère l'affichage en mode "accordéon" pour les petits écrans (mobile)
//         if (window.innerWidth <= 692) {
//             const title = filterContainer.querySelector(".filters__title");
//             const wrapper = filterContainer.querySelector(".filters__wrapper");
//             if (title && wrapper) {
//                 // Initialement fermé
//                 wrapper.style.maxHeight = "0px";
//                 wrapper.style.overflow = "hidden";
                
//                 title.addEventListener("click", () => {
//                     if (wrapper.style.maxHeight !== "0px") {
//                         wrapper.style.maxHeight = "0px";
//                     } else {
//                         wrapper.style.maxHeight = wrapper.scrollHeight + "px";
//                     }
//                 });
//             }
//         }
//     }


//     // =========================================================================
//     // SECTION 2 : LOGIQUE AJAX & GESTION D'ÉTAT
//     // =========================================================================
//     const mainContainer = document.getElementById('ajax-category-container');
//     if (!mainContainer) {
//         // Si on n'est pas sur une page de listing, on arrête le script.
//         return;
//     }

//     const baseApiUrl = mainContainer.dataset.apiUrl;
//     if (!baseApiUrl) {
//         console.error('CRITICAL: data-api-url is missing on #ajax-category-container.');
//         return;
//     }

//     // Ciblage des conteneurs HTML qui seront mis à jour par l'AJAX
//     const productListContainer = document.getElementById('product-list-container');
//     const filtersContainer = document.getElementById('filters-container');
//     const activeFiltersContainer = document.getElementById('active-filters-container');
//     const paginationContainer = document.getElementById('pagination-container');

//     /**
//      * Lit l'état du formulaire de filtres et construit le segment d'URL (ex: /f/cat=val1/)
//      * @returns {string} Le segment d'URL des filtres.
//      */
//     function buildFilterUrlSegment() {
//         const form = document.getElementById('filters-form');
//         if (!form) return '';
//         const activeFilters = {};
//         form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
//             if (!activeFilters[cb.name]) activeFilters[cb.name] = [];
//             activeFilters[cb.name].push(cb.value);
//         });

//         const sortedKeys = Object.keys(activeFilters).sort();
//         if (sortedKeys.length === 0) return '';
//         const parts = sortedKeys.map(key => `${key}=${activeFilters[key].sort().join(',')}`);
//         return `f/${parts.join('/')}/`;
//     }

//     /**
//      * Fonction principale : appelle l'API, remplace les blocs HTML et met à jour l'état de la page.
//      * @param {string} url - L'URL de l'API à appeler.
//      * @param {string|null} openFilterId - L'ID du filtre à garder ouvert après la mise à jour.
//      */
//     async function fetchAndUpdatePage(url, openFilterId = null) {
//         mainContainer.classList.add('loading'); // Ajoute un style visuel de chargement
//         try {
//             const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
//             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//             const data = await response.json();

//             // Remplacement du contenu des conteneurs avec les nouveaux partiels HTML
//             if (productListContainer && data.html_products !== undefined) productListContainer.innerHTML = data.html_products;
//             if (filtersContainer && data.html_filters !== undefined) filtersContainer.innerHTML = data.html_filters;
//             if (activeFiltersContainer && data.html_active_filters !== undefined) activeFiltersContainer.innerHTML = data.html_active_filters;
//             if (paginationContainer && data.html_pagination !== undefined) paginationContainer.innerHTML = data.html_pagination;

//             // Mise à jour du titre H1 et du titre de la page (important pour le SEO et l'UX)
//             const h1 = document.getElementById('page-h1-title');
//             if (h1 && data.h1_title) {
//                 h1.textContent = data.h1_title;
//                 document.title = data.h1_title;
//             }

//             // Mise à jour de l'URL dans la barre d'adresse sans recharger la page
//             if (window.history.pushState && data.new_url) {
//                 history.pushState({ path: data.new_url }, '', data.new_url);
//             }
            
//             // On recrée les écouteurs d'événements pour l'UI sur le nouveau HTML des filtres
//             initializeFilterUI();

//             // Logique pour rouvrir le dropdown qui était actif
//             if (openFilterId && filtersContainer) {
//                 const filterToReopen = filtersContainer.querySelector(`.filters__box-item[data-filter="${openFilterId}"]`);
//                 if (filterToReopen) {
//                     filterToReopen.classList.add('open');
//                     const dropdown = filterToReopen.querySelector('.filters__dropdown');
//                     if (dropdown) {
//                         dropdown.classList.remove('hidden');
//                     }
//                 }
//             }

//         } catch (error) {
//             console.error("Error during AJAX update:", error);
//             // On pourrait afficher un message d'erreur à l'utilisateur ici
//         } finally {
//             mainContainer.classList.remove('loading'); // Retire le style de chargement
//         }
//     }

//     // --- DÉLÉGATION DES ÉVÉNEMENTS ---

//     // Un seul écouteur sur le conteneur principal pour gérer tous les clics
//     mainContainer.addEventListener('click', function(event) {
        
//         // Gère les clics sur la pagination
//         const paginationLink = event.target.closest('#pagination-container a');
//         if (paginationLink) {
//             event.preventDefault();
//             const pageUrl = new URL(paginationLink.href);
//             const pageQueryString = pageUrl.search; // ex: "?page=2"
//             const filterSegment = buildFilterUrlSegment();
//             fetchAndUpdatePage(`${baseApiUrl}${filterSegment}${pageQueryString}`);
//         }

//         // Gère les clics pour supprimer un tag de filtre actif
//         const removeFilterBtn = event.target.closest('.js-remove-filter-btn');
//         if (removeFilterBtn) {
//             event.preventDefault();
//             const checkbox = document.querySelector(`#filters-form input[name="${removeFilterBtn.dataset.groupSlug}"][value="${removeFilterBtn.dataset.valueSlug}"]`);
//             if (checkbox) {
//                 checkbox.checked = false;
//                 // On déclenche manuellement un événement 'change' pour que notre autre écouteur réagisse
//                 checkbox.dispatchEvent(new Event('change', { bubbles: true }));
//             }
//         }

//         // Gère le bouton "Réinitialiser"
//         const resetBtn = event.target.closest('.filters__box-reset');
//         if (resetBtn) {
//             event.preventDefault();
//             const form = document.getElementById('filters-form');
//             if (form) {
//                 form.reset(); // Vide toutes les checkboxes
//                 form.dispatchEvent(new Event('change', { bubbles: true }));
//             }
//         }
//     });

//     // Un seul écouteur pour tous les changements dans le formulaire de filtres
//     mainContainer.addEventListener('change', function(event) {
//         // Si on coche ou décoche une case
//         if (event.target.matches('#filters-form input[type="checkbox"]')) {
//             // On mémorise quel dropdown est actuellement ouvert
//             const changedCheckbox = event.target;
//             const openFilterBox = changedCheckbox.closest('.filters__box-item.open');
//             const openFilterId = openFilterBox ? openFilterBox.dataset.filter : null;

//             const filterSegment = buildFilterUrlSegment();
//             const finalUrl = `${baseApiUrl}${filterSegment}`;
            
//             // On passe l'ID du filtre ouvert à la fonction de mise à jour
//             fetchAndUpdatePage(finalUrl, openFilterId);
//         }
//     });
    
//     // Initialisation de l'interface au premier chargement de la page
//     initializeFilterUI();
// });



// static/js/product-filters.js

document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    /**
     * Affiche une petite notification temporaire à côté du curseur.
     * @param {MouseEvent} event - L'événement de clic pour positionner la notification.
     */
    function showDisabledFilterTooltip(event) {
        const existingTooltip = document.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        const tooltip = document.createElement('div');
        tooltip.className = 'filter-tooltip';
        tooltip.textContent = 'Опция недоступна при текущем выборе';
        tooltip.style.top = `${event.pageY + 15}px`;
        tooltip.style.left = `${event.pageX}px`;
        document.body.appendChild(tooltip);
        setTimeout(() => tooltip.classList.add('show'), 10);
        setTimeout(() => {
            tooltip.classList.remove('show');
            tooltip.addEventListener('transitionend', () => tooltip.remove());
        }, 2500);
    }

    function initializeFilterUI() {
        const filterContainer = document.querySelector(".filters");
        if (!filterContainer) return;
        const closeAllDropdowns = () => {
            filterContainer.querySelectorAll(".filters__box-item.open").forEach(item => {
                item.classList.remove("open");
                item.querySelector(".filters__dropdown")?.classList.add("hidden");
            });
        };
        filterContainer.querySelectorAll(".filters__box-item").forEach(item => {
            item.addEventListener("click", (e) => {
                if (e.target.closest(".filters__dropdown")) return;
                const wasOpen = item.classList.contains("open");
                closeAllDropdowns();
                if (!wasOpen) {
                    item.classList.add("open");
                    item.querySelector(".filters__dropdown")?.classList.remove("hidden");
                }
                e.stopPropagation();
            });
        });
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".filters__box-item")) {
                closeAllDropdowns();
            }
        });
        filterContainer.querySelectorAll(".filters__search-input").forEach(searchInput => {
            const dropdown = searchInput.closest('.filters__dropdown');
            const labels = dropdown.querySelectorAll("label");
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                labels.forEach(label => {
                    const text = label.textContent.toLowerCase().trim();
                    const isVisible = text.includes(searchTerm);
                    label.style.display = isVisible ? '' : 'none';
                });
            });
        });
        if (window.innerWidth <= 692) {
            const title = filterContainer.querySelector(".filters__title");
            const wrapper = filterContainer.querySelector(".filters__wrapper");
            if (title && wrapper) {
                wrapper.style.maxHeight = "0px";
                wrapper.style.overflow = "hidden";
                title.addEventListener("click", () => {
                    if (wrapper.style.maxHeight !== "0px") {
                        wrapper.style.maxHeight = "0px";
                    } else {
                        wrapper.style.maxHeight = wrapper.scrollHeight + "px";
                    }
                });
            }
        }
    }

    const mainContainer = document.getElementById('ajax-category-container');
    if (!mainContainer) return;

    const baseApiUrl = mainContainer.dataset.apiUrl;
    if (!baseApiUrl) {
        console.error('CRITICAL: data-api-url is missing on #ajax-category-container.');
        return;
    }

    const productListContainer = document.getElementById('product-list-container');
    const filtersContainer = document.getElementById('filters-container');
    const activeFiltersContainer = document.getElementById('active-filters-container');
    const paginationContainer = document.getElementById('pagination-container');

    function buildFilterUrlSegment() {
        const form = document.getElementById('filters-form');
        if (!form) return '';
        const activeFilters = {};
        form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            if (!activeFilters[cb.name]) activeFilters[cb.name] = [];
            activeFilters[cb.name].push(cb.value);
        });
        const sortedKeys = Object.keys(activeFilters).sort();
        if (sortedKeys.length === 0) return '';
        const parts = sortedKeys.map(key => `${key}=${activeFilters[key].sort().join(',')}`);
        return `f/${parts.join('/')}/`;
    }

    async function fetchAndUpdatePage(url, openFilterId = null) {
        mainContainer.classList.add('loading');
        try {
            const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (productListContainer && data.html_products !== undefined) productListContainer.innerHTML = data.html_products;
            if (filtersContainer && data.html_filters !== undefined) filtersContainer.innerHTML = data.html_filters;
            if (activeFiltersContainer && data.html_active_filters !== undefined) activeFiltersContainer.innerHTML = data.html_active_filters;
            if (paginationContainer && data.html_pagination !== undefined) paginationContainer.innerHTML = data.html_pagination;

            const h1 = document.getElementById('page-h1-title');
            if (h1 && data.h1_title) {
                h1.textContent = data.h1_title;
                document.title = data.h1_title;
            }
            if (window.history.pushState && data.new_url) {
                history.pushState({ path: data.new_url }, '', data.new_url);
            }
            initializeFilterUI();
            if (openFilterId && filtersContainer) {
                const filterToReopen = filtersContainer.querySelector(`.filters__box-item[data-filter="${openFilterId}"]`);
                if (filterToReopen) {
                    filterToReopen.classList.add('open');
                    const dropdown = filterToReopen.querySelector('.filters__dropdown');
                    if (dropdown) dropdown.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error("Error during AJAX update:", error);
        } finally {
            mainContainer.classList.remove('loading');
        }
    }

    mainContainer.addEventListener('click', function(event) {
        const disabledLabel = event.target.closest('label.disabled');
        if (disabledLabel) {
            event.preventDefault();
            showDisabledFilterTooltip(event);
            return;
        }

        const paginationLink = event.target.closest('#pagination-container a');
        if (paginationLink) {
            event.preventDefault();
            const pageUrl = new URL(paginationLink.href);
            const pageQueryString = pageUrl.search;
            const filterSegment = buildFilterUrlSegment();
            fetchAndUpdatePage(`${baseApiUrl}${filterSegment}${pageQueryString}`);
        }

        const removeFilterBtn = event.target.closest('.js-remove-filter-btn');
        if (removeFilterBtn) {
            event.preventDefault();
            const checkbox = document.querySelector(`#filters-form input[name="${removeFilterBtn.dataset.groupSlug}"][value="${removeFilterBtn.dataset.valueSlug}"]`);
            if (checkbox) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        const resetBtn = event.target.closest('.filters__box-reset');
        if (resetBtn) {
            event.preventDefault();
            const form = document.getElementById('filters-form');
            if (form) {
                form.reset();
                form.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });

    mainContainer.addEventListener('change', function(event) {
        if (event.target.matches('#filters-form input[type="checkbox"]')) {
            const changedCheckbox = event.target;
            const openFilterBox = changedCheckbox.closest('.filters__box-item.open');
            const openFilterId = openFilterBox ? openFilterBox.dataset.filter : null;
            const filterSegment = buildFilterUrlSegment();
            const finalUrl = `${baseApiUrl}${filterSegment}`;
            fetchAndUpdatePage(finalUrl, openFilterId);
        }
    });

    initializeFilterUI();
});