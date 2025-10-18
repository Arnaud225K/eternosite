
document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    function showDisabledFilterTooltip(event) {
        const existingTooltip = document.querySelector('.filter-tooltip');
        if (existingTooltip) existingTooltip.remove();
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

    // function initializeFilterUI() {
    //     const filterContainer = document.querySelector(".filters");
    //     if (!filterContainer) return;
    //     const closeAllDropdowns = () => {
    //         filterContainer.querySelectorAll(".filters__box-item.open").forEach(item => {
    //             item.classList.remove("open");
    //             item.querySelector(".filters__dropdown")?.classList.add("hidden");
    //         });
    //     };
    //     filterContainer.querySelectorAll(".filters__box-item").forEach(item => {
    //         item.addEventListener("click", (e) => {
    //             if (e.target.closest(".filters__dropdown")) return;
    //             const wasOpen = item.classList.contains("open");
    //             closeAllDropdowns();
    //             if (!wasOpen) {
    //                 item.classList.add("open");
    //                 item.querySelector(".filters__dropdown")?.classList.remove("hidden");
    //             }
    //             e.stopPropagation();
    //         });
    //     });
    //     document.addEventListener("click", (e) => {
    //         if (!e.target.closest(".filters__box-item")) closeAllDropdowns();
    //     });
    //     filterContainer.querySelectorAll(".filters__search-input").forEach(searchInput => {
    //         const dropdown = searchInput.closest('.filters__dropdown');
    //         const labels = dropdown.querySelectorAll("label");
    //         searchInput.addEventListener('input', () => {
    //             const searchTerm = searchInput.value.toLowerCase().trim();
    //             labels.forEach(label => {
    //                 const text = label.textContent.toLowerCase().trim();
    //                 const isVisible = text.includes(searchTerm);
    //                 label.style.display = isVisible ? '' : 'none';
    //             });
    //         });
    //     });
    //     if (window.innerWidth <= 692) {
    //         const title = filterContainer.querySelector(".filters__title");
    //         const wrapper = filterContainer.querySelector(".filters__wrapper");
    //         if (title && wrapper) {
    //             wrapper.style.maxHeight = "0px";
    //             wrapper.style.overflow = "hidden";
    //             title.addEventListener("click", () => {
    //                 wrapper.style.maxHeight = (wrapper.style.maxHeight !== "0px") ? "0px" : wrapper.scrollHeight + "px";
    //             });
    //         }
    //     }
    // }

// function initializeFilterUI() {
//     const filterContainer = document.querySelector(".filters");
//     if (!filterContainer) return;

//     // Fermer tous les dropdowns
//     const closeAllDropdowns = () => {
//         filterContainer.querySelectorAll(".filters__box-item.open").forEach(item => {
//             item.classList.remove("open");
//             const dropdown = item.querySelector(".filters__dropdown");
//             if (dropdown) {
//                 dropdown.classList.add("hidden");
//             }
//         });
//     };

//     // Gestion des clics sur les items de filtre
//     filterContainer.querySelectorAll(".filters__box-item").forEach(item => {
//         item.addEventListener("click", (e) => {
//             // Ne pas fermer si clic dans le dropdown
//             if (e.target.closest(".filters__dropdown")) return;
            
//             const wasOpen = item.classList.contains("open");
//             closeAllDropdowns();
            
//             if (!wasOpen) {
//                 item.classList.add("open");
//                 const dropdown = item.querySelector(".filters__dropdown");
//                 if (dropdown) {
//                     dropdown.classList.remove("hidden");
//                 }
//             }
//             e.stopPropagation();
//         });
//     });

//     // Fermer les dropdowns en cliquant ailleurs
//     document.addEventListener("click", (e) => {
//         if (!e.target.closest(".filters__box-item")) {
//             closeAllDropdowns();
//         }
//     });

//     // Recherche dans les dropdowns
//     filterContainer.querySelectorAll(".filters__search-input").forEach(searchInput => {
//         searchInput.addEventListener('input', (e) => {
//             e.stopPropagation();
//             const dropdown = searchInput.closest('.filters__dropdown');
//             const labels = dropdown.querySelectorAll("label");
//             const searchTerm = searchInput.value.toLowerCase().trim();
            
//             labels.forEach(label => {
//                 const text = label.textContent.toLowerCase().trim();
//                 label.style.display = text.includes(searchTerm) ? 'flex' : 'none';
//             });
//         });
//     });

//     // Gestion du bouton reset
//     const resetButton = filterContainer.querySelector(".filters__box-reset");
//     if (resetButton) {
//         resetButton.addEventListener("click", () => {
//             // Réinitialiser toutes les checkboxes
//             filterContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
//                 checkbox.checked = false;
//             });
            
//             // Réinitialiser les recherches
//             filterContainer.querySelectorAll(".filters__search-input").forEach(input => {
//                 input.value = "";
//                 const dropdown = input.closest('.filters__dropdown');
//                 const labels = dropdown.querySelectorAll("label");
//                 labels.forEach(label => {
//                     label.style.display = 'flex';
//                 });
//             });
            
//             console.log("Tous les filtres ont été réinitialisés");
//         });
//     }

//     // Gestion responsive pour mobile
//     const setupMobileView = () => {
//         const title = filterContainer.querySelector(".filters__title");
//         const wrapper = filterContainer.querySelector(".filters__wrapper");
        
//         if (!title || !wrapper) return;

//         if (window.innerWidth <= 692) {
//             // Mode mobile
//             let isOpen = false;
            
//             // S'assurer que le wrapper est fermé au départ
//             wrapper.style.maxHeight = "0px";
//             wrapper.style.overflow = "hidden";
//             wrapper.style.transition = "max-height 0.4s ease";
            
//             // Nettoyer les écouteurs existants
//             title.onclick = null;
            
//             title.onclick = () => {
//                 isOpen = !isOpen;
                
//                 if (isOpen) {
//                     // Ouvrir - calculer la hauteur exacte
//                     filterContainer.classList.add("is-open");
                    
//                     // Fermer d'abord tous les dropdowns ouverts
//                     closeAllDropdowns();
                    
//                     // Obtenir la hauteur réelle du contenu
//                     const contentHeight = wrapper.scrollHeight;
                    
//                     // Appliquer la transition
//                     wrapper.style.maxHeight = contentHeight + "px";
                    
//                     // S'assurer que tout le contenu est visible
//                     setTimeout(() => {
//                         wrapper.style.overflow = "visible";
//                     }, 400);
                    
//                 } else {
//                     // Fermer
//                     wrapper.style.maxHeight = "0px";
//                     wrapper.style.overflow = "hidden";
//                     setTimeout(() => {
//                         filterContainer.classList.remove("is-open");
//                     }, 400);
//                 }
//             };
            
//         } else {
//             // Mode desktop - reset des styles
//             const title = filterContainer.querySelector(".filters__title");
//             const wrapper = filterContainer.querySelector(".filters__wrapper");
            
//             if (title && wrapper) {
//                 wrapper.style.maxHeight = "";
//                 wrapper.style.overflow = "";
//                 wrapper.style.transition = "";
//                 filterContainer.classList.remove("is-open");
//                 title.onclick = null;
//             }
//         }
//     };

//     // Gestion du redimensionnement
//     const handleResize = () => {
//         setupMobileView();
//     };

//     // Initialisation
//     setupMobileView();
    
//     // Écouteur de redimensionnement avec debounce
//     let resizeTimer;
//     window.addEventListener('resize', () => {
//         clearTimeout(resizeTimer);
//         resizeTimer = setTimeout(handleResize, 150);
//     });

//     // Réinitialiser au chargement
//     window.addEventListener('load', setupMobileView);
// }

    function initializeFilterUI() {
        const filterContainer = document.querySelector(".filters");
        if (!filterContainer) return;

        // Fermer tous les dropdowns
        const closeAllDropdowns = () => {
            filterContainer.querySelectorAll(".filters__box-item.open").forEach(item => {
                item.classList.remove("open");
                const dropdown = item.querySelector(".filters__dropdown");
                if (dropdown) {
                    dropdown.classList.add("hidden");
                }
            });
        };

        // Gestion des clics sur les items de filtre
        filterContainer.querySelectorAll(".filters__box-item").forEach(item => {
            item.addEventListener("click", (e) => {
                // Ne pas fermer si clic dans le dropdown
                if (e.target.closest(".filters__dropdown")) return;
                
                const wasOpen = item.classList.contains("open");
                closeAllDropdowns();
                
                if (!wasOpen) {
                    item.classList.add("open");
                    const dropdown = item.querySelector(".filters__dropdown");
                    if (dropdown) {
                        dropdown.classList.remove("hidden");
                    }
                }
                e.stopPropagation();
            });
        });

        // Fermer les dropdowns en cliquant ailleurs
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".filters__box-item")) {
                closeAllDropdowns();
            }
        });

        // Recherche dans les dropdowns
        filterContainer.querySelectorAll(".filters__search-input").forEach(searchInput => {
            searchInput.addEventListener('input', (e) => {
                e.stopPropagation();
                const dropdown = searchInput.closest('.filters__dropdown');
                const labels = dropdown.querySelectorAll("label");
                const searchTerm = searchInput.value.toLowerCase().trim();
                
                labels.forEach(label => {
                    const text = label.textContent.toLowerCase().trim();
                    label.style.display = text.includes(searchTerm) ? 'flex' : 'none';
                });
            });
        });

        // Gestion du bouton reset
        const resetButton = filterContainer.querySelector(".filters__box-reset");
        if (resetButton) {
            resetButton.addEventListener("click", () => {
                // Réinitialiser toutes les checkboxes
                filterContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                // Réinitialiser les recherches
                filterContainer.querySelectorAll(".filters__search-input").forEach(input => {
                    input.value = "";
                    const dropdown = input.closest('.filters__dropdown');
                    const labels = dropdown.querySelectorAll("label");
                    labels.forEach(label => {
                        label.style.display = 'flex';
                    });
                });
                
                console.log("Tous les filtres ont été réinitialisés");
            });
        }

        // Gestion responsive pour mobile avec flèche
        const setupMobileView = () => {
            const title = filterContainer.querySelector(".filters__title");
            const wrapper = filterContainer.querySelector(".filters__wrapper");
            
            if (!title || !wrapper) return;

            if (window.innerWidth <= 692) {
                // Mode mobile
                let isOpen = false;
                
                // S'assurer que le wrapper est fermé au départ
                wrapper.style.maxHeight = "0px";
                wrapper.style.overflow = "hidden";
                wrapper.style.transition = "max-height 0.4s ease";
                
                // Ajouter la classe pour la flèche si elle n'existe pas déjà
                if (!title.classList.contains('filters__title--mobile')) {
                    title.classList.add('filters__title--mobile');
                }
                
                // Nettoyer les écouteurs existants
                title.onclick = null;
                
                title.onclick = () => {
                    isOpen = !isOpen;
                    
                    if (isOpen) {
                        // Ouvrir - calculer la hauteur exacte
                        filterContainer.classList.add("is-open");
                        
                        // Fermer d'abord tous les dropdowns ouverts
                        closeAllDropdowns();
                        
                        // Obtenir la hauteur réelle du contenu
                        const contentHeight = wrapper.scrollHeight;
                        
                        // Appliquer la transition
                        wrapper.style.maxHeight = contentHeight + "px";
                        
                        // S'assurer que tout le contenu est visible
                        setTimeout(() => {
                            wrapper.style.overflow = "visible";
                        }, 400);
                        
                    } else {
                        // Fermer
                        wrapper.style.maxHeight = "0px";
                        wrapper.style.overflow = "hidden";
                        setTimeout(() => {
                            filterContainer.classList.remove("is-open");
                        }, 400);
                    }
                };
                
            } else {
                // Mode desktop - reset des styles
                const title = filterContainer.querySelector(".filters__title");
                const wrapper = filterContainer.querySelector(".filters__wrapper");
                
                if (title && wrapper) {
                    wrapper.style.maxHeight = "";
                    wrapper.style.overflow = "";
                    wrapper.style.transition = "";
                    filterContainer.classList.remove("is-open");
                    title.classList.remove('filters__title--mobile');
                    title.onclick = null;
                }
            }
        };

        // Gestion du redimensionnement
        const handleResize = () => {
            setupMobileView();
        };

        // Initialisation
        setupMobileView();
        
        // Écouteur de redimensionnement avec debounce
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleResize, 150);
        });

        // Réinitialiser au chargement
        window.addEventListener('load', setupMobileView);
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
        // Logique pour les filtres désactivés via l'overlay
        if (event.target.classList.contains('disabled-filter-overlay')) {
            event.preventDefault();
            event.stopPropagation();
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