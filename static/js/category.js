
document.addEventListener('DOMContentLoaded', function() {
    "use strict";

    function getNounPluralForm(number, one, few, many) {
        try {
            let n = Math.abs(parseInt(number, 10)) % 100;
            let lastDigit = n % 10;
            if (n > 10 && n < 20) return many;
            if (lastDigit > 1 && lastDigit < 5) return few;
            if (lastDigit === 1) return one;
        } catch (e) { return many; }
        return many;
    }

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

    function initializeFilterUI(forceMobileOpen = false) {
        const filterContainer = document.querySelector(".filters");
        if (!filterContainer) return;
        const closeAllDropdowns = () => { 
            filterContainer.querySelectorAll(".filters__box-item.open").forEach(item => { item.classList.remove("open"); 
                const dropdown = item.querySelector(".filters__dropdown"); 
                if (dropdown) 
                    dropdown.classList.add("hidden"); 
                }
            );
        };
        filterContainer.querySelectorAll(".filters__box-item").forEach(item => { item.addEventListener("click", (e) => { 
            if (e.target.closest(".filters__dropdown")) return; 
            const wasOpen = item.classList.contains("open"); 
            closeAllDropdowns(); 
            if (!wasOpen) { 
                item.classList.add("open"); 
                const dropdown = item.querySelector(".filters__dropdown"); 
                if (dropdown) dropdown.classList.remove("hidden"); 
            } e.stopPropagation(); }); });
        document.addEventListener("click", (e) => { 
            if (!e.target.closest(".filters__box-item")) closeAllDropdowns(); 
        });
        filterContainer.querySelectorAll(".filters__search-input").forEach(searchInput => { 
            searchInput.addEventListener('input', (e) => { e.stopPropagation(); 
                const dropdown = searchInput.closest('.filters__dropdown'); 
                const labels = dropdown.querySelectorAll("label"); 
                const searchTerm = searchInput.value.toLowerCase().trim(); 
                labels.forEach(label => { 
                    const text = label.textContent.toLowerCase().trim(); 
                    label.style.display = text.includes(searchTerm) ? 'flex' : 'none'; 
                }); 
            }); 
        });
        const setupMobileView = () => { 
            const title = filterContainer.querySelector(".filters__title"); 
            const wrapper = filterContainer.querySelector(".filters__wrapper"); 
            if (!title || !wrapper) return; const TRANSITION_DURATION = 400; 
            if (window.innerWidth <= 692) { 
                if (!title.classList.contains('filters__title--mobile')) { 
                    title.classList.add('filters__title--mobile');
                } title.onclick = null; 
                if (forceMobileOpen) { 
                    filterContainer.classList.add("is-open");
                    wrapper.style.maxHeight = wrapper.scrollHeight + "px"; setTimeout(() => { 
                        wrapper.style.overflow = "visible"; 
                    }, TRANSITION_DURATION); 
                } else { 
                    wrapper.style.overflow = "hidden";
                    wrapper.style.maxHeight = "0px"; 
                    filterContainer.classList.remove("is-open"); 
                } title.onclick = () => { 
                    const isOpen = filterContainer.classList.contains("is-open"); 
                    if (isOpen) { wrapper.style.overflow = "hidden"; 
                        wrapper.style.maxHeight = "0px"; 
                        filterContainer.classList.remove("is-open"); 
                    } else { 
                        wrapper.style.maxHeight = wrapper.scrollHeight + "px"; 
                        filterContainer.classList.add("is-open"); 
                        setTimeout(() => { 
                            wrapper.style.overflow = "visible"; 
                        }, TRANSITION_DURATION); } }; 
                    } else { 
                        wrapper.style.maxHeight = ""; 
                        wrapper.style.overflow = ""; 
                        filterContainer.classList.remove("is-open"); 
                        title.classList.remove('filters__title--mobile'); 
                        title.onclick = null; 
                    } };
        setupMobileView();
        let resizeTimer;
        window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setupMobileView, 150); });
    }

    const mainContainer = document.getElementById('ajax-category-container');
    if (!mainContainer) return;
    const baseApiUrl = mainContainer.dataset.apiUrl;
    if (!baseApiUrl) { console.error('CRITICAL: data-api-url is missing on #ajax-category-container.'); return; }
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

    async function fetchAndUpdatePage(url, openFilterId = null, isMobileAccordionOpen = false) {
        mainContainer.classList.add('loading');
        try {
            const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (productListContainer && data.html_products !== undefined) 
                productListContainer.innerHTML = data.html_products;
            if (filtersContainer && data.html_filters !== undefined) 
                filtersContainer.innerHTML = data.html_filters;
            if (activeFiltersContainer && data.html_active_filters !== undefined) 
                activeFiltersContainer.innerHTML = data.html_active_filters;
            if (paginationContainer && data.html_pagination !== undefined) 
                paginationContainer.innerHTML = data.html_pagination;

            const h1Element = document.getElementById('page-h1-title');
            const h1BaseTitleElement = document.getElementById('h1-base-title');
            if (h1Element && h1BaseTitleElement && data.h1_title) {
                h1BaseTitleElement.textContent = data.h1_title;
                let h1FilialPart = document.getElementById('h1-filial-part');
                const filialName = h1Element.dataset.filialName;
                if (filialName && !h1FilialPart) {
                    h1FilialPart = document.createElement('span');
                    h1FilialPart.id = 'h1-filial-part';
                    h1Element.appendChild(h1FilialPart);
                }
                if (h1FilialPart) {
                    h1FilialPart.textContent = ` в ${filialName}`;
                }
            }
            document.title = (data.h1_title || document.title) + (h1Element.dataset.filialName ? ` в ${h1Element.dataset.filialName}` : '');

            const countDisplayElement = document.getElementById('product-count-display');
            if (countDisplayElement && data.product_count !== undefined) {
                const count = data.product_count;
                const pluralWord = getNounPluralForm(count, 'наименование', 'наименования', 'наименований');
                countDisplayElement.innerHTML = `Товаров: <span>${count} ${pluralWord}</span>`;
            }

            if (window.history.pushState && data.new_url) { 
                history.pushState({ path: data.new_url }, '', data.new_url); 
            }
            initializeFilterUI(isMobileAccordionOpen);

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

    async function loadMoreProducts(button) {
        const nextPage = button.dataset.nextPage;
        if (!nextPage) return;

        button.textContent = 'Загрузка...';
        button.disabled = true;

        const filterSegment = buildFilterUrlSegment();
        const apiUrl = `${baseApiUrl}${filterSegment}?page=${nextPage}`;
        
        try {
            const response = await fetch(apiUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
            const data = await response.json();
            
            const tempContainer = document.createElement('div');
            if (data.html_products) {
                tempContainer.innerHTML = data.html_products;
            }

            const newProductCards = tempContainer.querySelectorAll('.subcategory__products-list > .subcategory__product');
            const targetProductList = document.querySelector('.subcategory__products-list');
            if (targetProductList && newProductCards.length > 0) {
                newProductCards.forEach(card => targetProductList.appendChild(card));
            }

            const newProductCountDiv = tempContainer.querySelector('#product-count-display');
            const existingProductCountDiv = document.getElementById('product-count-display');
            if (existingProductCountDiv && newProductCountDiv) {
                existingProductCountDiv.innerHTML = newProductCountDiv.innerHTML;
            }

            const h1Element = document.getElementById('page-h1-title');
            if (h1Element && data.h1_title) {
                const baseTitleSpan = h1Element.querySelector('#h1-base-title');
                const filialPartSpan = h1Element.querySelector('#h1-filial-part');
                if (baseTitleSpan) {
                    baseTitleSpan.textContent = data.h1_title;
                } else {
                    h1Element.textContent = data.h1_title;
                }
                if (filialPartSpan) {
                    h1Element.appendChild(document.createTextNode(' '));
                    h1Element.appendChild(filialPartSpan);
                }
            }
            
            if (paginationContainer && data.html_pagination) {
                paginationContainer.innerHTML = data.html_pagination;
            }

            if (window.history.pushState && data.new_url) {
                history.pushState({}, '', data.new_url);
            }
        } catch (error) {
            console.error("Error loading more products:", error);
            const currentButton = paginationContainer.querySelector('.subcategory__showmore-button');
            if (currentButton) {
                currentButton.textContent = 'Ошибка. Попробовать еще?';
                currentButton.disabled = false;
            }
        }
    }
    
    mainContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('disabled-filter-overlay')) {
            event.preventDefault();
            event.stopPropagation();
            showDisabledFilterTooltip(event);
            return;
        }
        
        const paginationLink = event.target.closest('.pagination a');
        if (paginationLink) {
            event.preventDefault();
            const pageUrl = new URL(paginationLink.href);
            const pageQueryString = pageUrl.search;
            const filterSegment = buildFilterUrlSegment();
            fetchAndUpdatePage(`${baseApiUrl}${filterSegment}${pageQueryString}`);
        }
        
        const loadMoreBtn = event.target.closest('.subcategory__showmore-button');
        if (loadMoreBtn) {
            event.preventDefault();
            loadMoreProducts(loadMoreBtn);
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
                let hasChanged = false;
                form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    cb.checked = false;
                    hasChanged = true;
                });
                if (hasChanged) {
                    const filtersContainerElem = document.querySelector('.filters');
                    const isMobile = window.innerWidth <= 692;
                    const wasAccordionOpen = isMobile && filtersContainerElem && filtersContainerElem.classList.contains('is-open');
                    const filterSegment = buildFilterUrlSegment();
                    const finalUrl = `${baseApiUrl}${filterSegment}`;
                    fetchAndUpdatePage(finalUrl, null, wasAccordionOpen);
                }
            }
        }
    });

    mainContainer.addEventListener('change', function(event) {
        if (event.target.matches('#filters-form input[type="checkbox"]')) {
            const changedCheckbox = event.target;
            const openFilterBox = changedCheckbox.closest('.filters__box-item.open');
            const openFilterId = openFilterBox ? openFilterBox.dataset.filter : null;
            const filtersContainerElem = document.querySelector('.filters');
            const isMobile = window.innerWidth <= 692;
            const wasAccordionOpen = isMobile && filtersContainerElem && filtersContainerElem.classList.contains('is-open');
            const filterSegment = buildFilterUrlSegment();
            const finalUrl = `${baseApiUrl}${filterSegment}`;
            fetchAndUpdatePage(finalUrl, openFilterId, wasAccordionOpen);
        }
    });

    initializeFilterUI();
});