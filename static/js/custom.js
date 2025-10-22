(() => {
    "use strict";

    // SECTION 1 : FONCTIONS UTILITAIRES ET GLOBALES
    const getCsrfToken = () => {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!csrfInput) {
            console.error("CSRF token not found. Make sure {% csrf_token %} is present in your template.");
            return null;
        }
        return csrfInput.value;
    };

    function displayValidationError(input, message) {
        const formGroup = input.closest('.form-group, .form-block__agreement > label');
        if (!formGroup) return;
        let errorContainer = formGroup.parentElement.querySelector('.form-error');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'form-error';
            formGroup.insertAdjacentElement('afterend', errorContainer);
        }
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        input.classList.add('invalid');
    }

    function clearValidationError(input) {
        const formGroup = input.closest('.form-group, .form-block__agreement > label');
        if (!formGroup) return;
        const errorContainer = formGroup.parentElement.querySelector('.form-error');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }


    function displayValidationErrorModal(input, message, errorClass) {
        const form = input.closest('form');
        if (!form) return;
        const errorContainer = form.querySelector(errorClass);
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }
        input.classList.add('invalid');
    }
    function clearValidationErrorModal(input, errorClass) {
        const form = input.closest('form');
        if (!form) return;
        const errorContainer = form.querySelector(errorClass);
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        input.classList.remove('invalid');
    }


    function validatePhoneNumber(form) {
        const phoneInput = form.querySelector('input[name="phone"]');
        if (!phoneInput) return true;
        const cleanedPhone = phoneInput.value.replace(/\D/g, '');
        if (phoneInput.required && cleanedPhone.length < 11) {
            displayValidationErrorModal(phoneInput, 'Неверный формат номера телефона.', '.phone-error');
            return false;
        }
        clearValidationErrorModal(phoneInput, '.phone-error');
        return true;
    }
    function validateEmail(form) {
        const emailInput = form.querySelector('input[name="email"]');
        if (!emailInput) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            displayValidationErrorModal(emailInput, 'Неверный адрес электронной почты.', '.email-error');
            return false;
        }
        clearValidationErrorModal(emailInput, '.email-error');
        return true;
    }

    function validateAgreement(form) {
        const agreementCheckbox = form.querySelector('input[name="agreement"]');
        if (!agreementCheckbox) {
            return true;
        }

        const errorContainer = form.querySelector('.agreement-error');
        
        if (!agreementCheckbox.checked) {
            if (errorContainer) {
                errorContainer.textContent = 'Необходимо согласиться на обработку данных.';
                errorContainer.style.display = 'block';
            }
            return false;
        }
        
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        return true;
    }


    window.updateHeaderCartCounter = function(count) {
        const counterElements = document.querySelectorAll('.cart-counter');
        if (counterElements.length === 0) {
            return;
        }
        const countNum = parseInt(count, 10) || 0;
        counterElements.forEach(counter => {
            counter.textContent = countNum;
            if (countNum > 0) {
                counter.classList.remove('hidden');
            } else {
                counter.classList.add('hidden');
            }
        });
    };

    async function sendCartRequest(url, body = null) {
        const csrf = getCsrfToken();
        if (!csrf) return null;

        try {
            const headers = { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': csrf };
            const options = { method: 'POST', headers };
            if (body) {
                options.body = JSON.stringify(body);
                headers['Content-Type'] = 'application/json';
            }
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Cart AJAX Error:", error);
            return null;
        }
    }


    function updateCartUI(data) {
        const itemsWrapper = document.querySelector('.cart__products'); 
        const emptyMessage = document.querySelector('.cart__empty');
        const contentWrapper = document.querySelector('.cart_list__section');

        if (!itemsWrapper || !emptyMessage || !contentWrapper) return;

        const uniqueItemsCount = data && data.cart_unique_items_count !== undefined ? parseInt(data.cart_unique_items_count, 10) : 0;
        const isCartEmpty = uniqueItemsCount === 0;

        emptyMessage.style.display = isCartEmpty ? 'block' : 'none';
        contentWrapper.style.display = isCartEmpty ? 'none' : 'block';

        if (!isCartEmpty && data && data.html_cart_items !== undefined) {
            itemsWrapper.innerHTML = data.html_cart_items;
        }
    }

    // SECTION 2 : GESTION DES ÉVÉNEMENTS

    document.addEventListener("DOMContentLoaded", () => {
            
        document.body.addEventListener('click', async function(event) {
            const addButton = event.target.closest('.addtocart');
            if (!addButton) return;
            event.preventDefault();

            const productContainer = addButton.closest('.subcategory__product, section.product, section.service_page');
            if (!productContainer) {
                console.error("Could not find product container for the add to cart button.");
                return;
            }

            if (productContainer.classList.contains('purchased') || addButton.classList.contains('purchased')) {
                window.location.href = '/checkout/';
                return;
            }

            const productId = productContainer.dataset.productId;
            if (!productId) {
                console.error("Product ID not found on container.", productContainer);
                return;
            }

            const quantityInput = productContainer.querySelector('.amount');
            const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

            addButton.disabled = true;

            const data = await sendCartRequest(`/checkout/cart/add/${productId}/`, { quantity: quantity });

            if (data && data.success) {
                // Fonction pour mettre à jour l'état visuel d'un conteneur
                const setPurchasedState = (container) => {
                    container.classList.add('purchased');
                    const btn = container.querySelector('.addtocart');
                    if (btn) {
                        btn.classList.add('purchased');
                        const btnSpan = btn.querySelector('span');
                        if (btnSpan) btnSpan.textContent = 'В корзине';
                    }
                };

                // Mettre à jour tous les conteneurs correspondants sur la page
                document.querySelectorAll(
                    `.subcategory__product[data-product-id="${productId}"], 
                    section.product[data-product-id="${productId}"], 
                    section.service_page[data-product-id="${productId}"]`
                ).forEach(setPurchasedState);
                
                window.updateHeaderCartCounter(data.cart_unique_items_count);
            }

            addButton.disabled = false;
        });

        // --- Logique pour les boutons +/- sur les cartes produits (Inchangée) ---
        document.body.addEventListener('click', function(event) {
            const quantityButton = event.target.closest('.subcategory__product .plus, .subcategory__product .minus');
            if (quantityButton) {
                const productCard = quantityButton.closest('.subcategory__product');
                const quantityInput = productCard.querySelector('.amount');
                if (quantityInput) {
                    let currentValue = parseInt(quantityInput.value, 10) || 1;
                    if (quantityButton.matches('.plus')) {
                        quantityInput.value = currentValue + 1;
                    } else if (quantityButton.matches('.minus') && currentValue > 1) {
                        quantityInput.value = currentValue - 1;
                    }
                }
            }
        });
        const cartPageContainer = document.querySelector('section.cart');
        if (!cartPageContainer) return;

        async function handleCartAction(productId, quantity) {
            const url = (quantity > 0) ? `/checkout/cart/update/${productId}/` : `/checkout/cart/remove/${productId}/`;
            const body = (quantity > 0) ? { quantity: quantity } : null;
            const data = await sendCartRequest(url, body);
            if (data && data.success) {
                updateCartUI(data);
                window.updateHeaderCartCounter(data.cart_unique_items_count);
            }
        }

        cartPageContainer.addEventListener('click', function(event) {
            const cartItem = event.target.closest('.cart__item');
            if (!cartItem) return;

            const productId = cartItem.dataset.productId;
            const quantityInput = cartItem.querySelector(".amount");
            let currentQty = parseInt(quantityInput.value, 10);

            if (event.target.matches('.plus')) {
                handleCartAction(productId, currentQty + 1);
            } else if (event.target.matches('.minus')) {
                if (currentQty > 0) {
                    handleCartAction(productId, currentQty - 1);
                }
            } else if (event.target.closest('.cart__item-del')) {
                handleCartAction(productId, 0);
            }
        });

        cartPageContainer.addEventListener('change', function(event) {
            if (event.target.matches('.amount')) {
                const cartItem = event.target.closest('.cart__item');
                const productId = cartItem.dataset.productId;
                let newQty = parseInt(event.target.value, 10);
                if (isNaN(newQty) || newQty < 0) newQty = 0;
                handleCartAction(productId, newQty);
            }
        });
        
        
        
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            const fileInput = checkoutForm.querySelector('input[name="file"]');
            const fileNameDisplay = document.getElementById('file-name-display');
            if (fileInput && fileNameDisplay) {
                fileInput.addEventListener('change', function() {
                    fileNameDisplay.textContent = this.files.length > 0 ? this.files[0].name : 'Прикрепить файл';
                });
            }
            
            const agreementVisual = document.getElementById('agreement_visual_checkbox');
            const agreementHidden = checkoutForm.querySelector('input[name="agreement"]');
            if (agreementVisual && agreementHidden) {
                agreementVisual.addEventListener('change', function() {
                    agreementHidden.checked = this.checked;
                    if (this.checked) {
                        clearValidationError(this);
                    }
                });
            }

            checkoutForm.addEventListener('submit', function(event) {
                let isFormValid = true;

                const phoneInput = checkoutForm.querySelector('input[name="phone"]');
                if (phoneInput) {
                    const cleanedPhone = phoneInput.value.replace(/\D/g, '');
                    if (cleanedPhone.length < 11) {
                        displayValidationError(phoneInput, "Пожалуйста, введите полный номер телефона.");
                        isFormValid = false;
                    } else {
                        clearValidationError(phoneInput);
                    }
                }

                if (agreementVisual && !agreementVisual.checked) {
                    displayValidationError(agreementVisual, "Необходимо согласиться на обработку данных.");
                    isFormValid = false;
                } else if (agreementVisual) {
                    clearValidationError(agreementVisual);
                }

                if (!isFormValid) {
                    event.preventDefault();
                    // console.warn("Client-side form validation failed");
                }
            });
        }
    });

    // SECTION 3 : GESTION FORM SOUMISSION
    async function handleFormSubmit(form) {
        const submitButton = form.querySelector('.form__submit, .btn[type="submit"]');
        const errorContainer = form.querySelector('.js-error');
        const url = form.getAttribute('action');
        const formData = new FormData(form);

        if (submitButton) submitButton.disabled = true;
        if (errorContainer) errorContainer.style.display = 'none';

        try {
            const response = await fetch(url, { method: 'POST', body: formData, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            const data = await response.json();
            if (response.ok && data.success) {
                if (data.thank_you_url) window.location.href = data.thank_you_url;
            } else {
                const errorMessage = data.error || "Пожалуйста, исправьте ошибки.";
                if (errorContainer) {
                    errorContainer.textContent = errorMessage;
                    errorContainer.style.display = 'block';
                }
            }
        } catch (error) {
            console.error("AJAX form submission error:", error);
            if (errorContainer) {
                errorContainer.textContent = "Произошла ошибка сети. Попробуйте снова.";
                errorContainer.style.display = 'block';
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    }

    // Appliquer le masque de téléphone
    document.querySelectorAll('input[data-phone]').forEach(input => {
        function mask(event) {
            let keyCode; event.keyCode && (keyCode = event.keyCode);
            let pos = this.selectionStart;
            if (pos < 3) event.preventDefault();
            let matrix = "+7 (___) ___-__-__", i = 0, def = matrix.replace(/\D/g, ""), val = this.value.replace(/\D/g, ""),
            new_value = matrix.replace(/[_\d]/g, a => (i < val.length ? val.charAt(i++) || def.charAt(i) : a));
            i = new_value.indexOf("_");
            if (i != -1) { i < 5 && (i = 3); new_value = new_value.slice(0, i) }
            let reg = matrix.substr(0, this.value.length).replace(/_+/g, a => "\\d{1," + a.length + "}").replace(/[+()]/g, "\\$&");
            reg = new RegExp("^" + reg + "$");
            if (!reg.test(this.value) || this.value.length < 5 || keyCode > 47 && keyCode < 58) this.value = new_value;
            if (event.type == "blur" && this.value.length < 5) this.value = "";
        }
        input.addEventListener("input", mask, false);
        input.addEventListener("focus", mask, false);
        input.addEventListener("blur", mask, false);
        input.addEventListener("keydown", mask, false);
    });

    // VAlidation avant soummission
    document.querySelectorAll('.modal__form').forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const isPhoneValid = validatePhoneNumber(this);
            const isEmailValid = validateEmail(this);
            const isAgreementValid = validateAgreement(this);

            if (isPhoneValid && isEmailValid && isAgreementValid) {
                handleFormSubmit(this);
            }
        });
    });

    //ARTICLE
    document.addEventListener('DOMContentLoaded', function() {
        "use strict";

        const articlesSection = document.getElementById('articles-section-container');
        if (!articlesSection) return;

        const tabsContainer = articlesSection.querySelector('.articles__tabs');
        const articlesWrapper = document.getElementById('articles-wrapper');
        const paginationWrapper = document.getElementById('articles-pagination');
        
        const baseApiUrl = articlesSection.dataset.apiUrl;
        if (!baseApiUrl) {
            console.error("CRITICAL: data-api-url is missing on #articles-section-container.");
            return;
        }

        async function fetchAndUpdateArticles(url, append = false, button = null) {
            articlesSection.classList.add('loading');
            if (button) { button.disabled = true; button.textContent = 'Загрузка...'; }
            
            try {
                const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                if (!response.ok) throw new Error(`Network error: ${response.status}`);
                const data = await response.json();
                
                if (append) {
                    if (articlesWrapper && data.html_articles) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = data.html_articles;
                        Array.from(tempDiv.children).forEach(child => articlesWrapper.appendChild(child));
                    }
                } else {
                    if (articlesWrapper) {
                        articlesWrapper.innerHTML = data.html_articles || '<p style="text-align:center; padding: 20px;">Статьи не найдены.</p>';
                    }
                }
                
                if (paginationWrapper) {
                    paginationWrapper.innerHTML = data.html_pagination || '';
                }

                if (window.history.pushState) {
                    const params = new URLSearchParams(url.split('?')[1] || '');
                    const categorySlug = params.get('category_slug');
                    const pageNum = params.get('page');

                    let newPageUrl = '/articles/';

                    if (categorySlug) {
                        newPageUrl = `/articles/category/${categorySlug}/`;
                    }

                    if (pageNum && parseInt(pageNum, 10) > 1) {
                        newPageUrl += `?page=${pageNum}`;
                    }

                    history.pushState({ path: newPageUrl }, '', newPageUrl);
                }
            } catch (error) {
                console.error("Error updating articles:", error);
                if(button) button.textContent = 'Ошибка';
            } finally {
                articlesSection.classList.remove('loading');
            }
        }

        if (tabsContainer) {
            tabsContainer.addEventListener('click', function(event) {
                const tabLink = event.target.closest('.articles__tabs-item');
                if (!tabLink) return;
                event.preventDefault();
                tabsContainer.querySelectorAll('.articles__tabs-item').forEach(tab => tab.classList.remove('active'));
                tabLink.classList.add('active');
                
                const url = new URL(tabLink.href);
                const pathParts = url.pathname.split('/');
                let categorySlug = null;
                if (pathParts.includes('category')) {
                    categorySlug = pathParts[pathParts.indexOf('category') + 1];
                }
                
                let apiUrl = `${baseApiUrl}?page=1`;
                if (categorySlug) {
                    apiUrl += `&category_slug=${categorySlug}`;
                }
                fetchAndUpdateArticles(apiUrl);
            });
        }

        articlesSection.addEventListener('click', function(event) {
            const target = event.target;
            
            let currentCategorySlug = null;
            const activeTab = tabsContainer.querySelector('.articles__tabs-item.active');
            if (activeTab) {
                const url = new URL(activeTab.href);
                const pathParts = url.pathname.split('/');
                if (pathParts.includes('category')) {
                    currentCategorySlug = pathParts[pathParts.indexOf('category') + 1];
                }
            }

            const paginationLink = target.closest('.pagination a');
            if (paginationLink) {
                event.preventDefault();
                const pageQueryString = new URL(paginationLink.href).search;
                let apiUrl = `${baseApiUrl}${pageQueryString}`;
                if (currentCategorySlug) {
                    apiUrl += `&category_slug=${currentCategorySlug}`;
                }
                fetchAndUpdateArticles(apiUrl);
            }

            const loadMoreBtn = target.closest('.articles__showmore-button');
            if (loadMoreBtn) {
                event.preventDefault();
                const nextPage = loadMoreBtn.dataset.nextPage;
                if (!nextPage) return;
                let apiUrl = `${baseApiUrl}?page=${nextPage}`;
                if (currentCategorySlug) {
                    apiUrl += `&category_slug=${currentCategorySlug}`;
                }
                fetchAndUpdateArticles(apiUrl, true, loadMoreBtn);
            }
        });
    });

    // //MEGA MENU HEADER
    function initializeMobileMenuUI() {
        const mobileMenu = document.querySelector("[data-menu]");
        if (!mobileMenu || mobileMenu.dataset.uiInitialized === "true") return;
        const overlay = mobileMenu.querySelector("[data-menu-overlay]");
        const openMenuButton = document.querySelector("[data-open-menu]");
        const panels = [...mobileMenu.querySelectorAll(".menu-panel")];
        const rootPanel = mobileMenu.querySelector('.menu-panel[is="root"]');
        const panelStack = [];
        const setActivePanel = (panel) => {
            if (!panel) return;
            panels.forEach((p) => {
                const isActive = p === panel;
                p.classList.toggle("is-active", isActive);
                p.setAttribute("aria-hidden", String(!isActive));
                if (!isActive && p.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
            });
            setTimeout(() => {
                const firstFocusable = panel.querySelector("a[href], button:not([disabled])");
                if (firstFocusable) firstFocusable.focus();
            }, 150);
        };
        const openMobileMenu = () => {
            mobileMenu.classList.add("is-open");
            mobileMenu.setAttribute("aria-hidden", "false");
            document.body.classList.add("no-scroll");
            setActivePanel(rootPanel);
        };
        const closeMobileMenu = () => {
            mobileMenu.classList.remove("is-open");
            mobileMenu.setAttribute("aria-hidden", "true");
            document.body.classList.remove("no-scroll");
            if (mobileMenu.contains(document.activeElement)) {
                document.activeElement.blur();
            }
            panelStack.length = 0;
            if (openMenuButton) openMenuButton.focus();
            mobileMenu.querySelectorAll(".menu-accordion.is-open").forEach((accordion) => {
                accordion.classList.remove("is-open");
                const toggle = accordion.querySelector("[data-acc-toggle]");
                const content = accordion.querySelector(".menu-accordion__content");
                if (toggle) toggle.setAttribute("aria-expanded", "false");
                if (content) {
                    content.setAttribute("aria-hidden", "true");
                    content.style.maxHeight = "0px";
                }
            });
        };
        overlay.addEventListener("click", closeMobileMenu);
        if (openMenuButton && !openMenuButton.dataset.listenerAttached) {
            openMenuButton.addEventListener("click", openMobileMenu);
            openMenuButton.dataset.listenerAttached = "true";
        }
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMobileMenu();
        });
        mobileMenu.addEventListener("click", (e) => {
            const target = e.target;
            const accToggle = target.closest("[data-acc-toggle]");
            if (accToggle) {
                const accordion = accToggle.closest(".menu-accordion");
                const content = accordion.querySelector(".menu-accordion__content");
                const isOpen = accordion.classList.toggle("is-open");
                accToggle.setAttribute("aria-expanded", String(isOpen));
                content.setAttribute("aria-hidden", String(!isOpen));
                content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : "0px";
                return;
            }
            if (target.closest("[data-menu-close]")) {
                closeMobileMenu();
                return;
            }
            if (target.closest("[data-menu-back]")) {
                const lastTrigger = panelStack.pop();
                setActivePanel(panelStack[panelStack.length - 1] || rootPanel);
                if (lastTrigger) lastTrigger.focus();
                return;
            }
            const submenuTrigger = target.closest("[data-submenu]");
            if (submenuTrigger) {
                const panelId = submenuTrigger.dataset.submenu;
                const targetPanel = mobileMenu.querySelector(`.menu-panel[data-panel="${panelId}"]`);
                if (targetPanel) {
                    panelStack.push(submenuTrigger);
                    setActivePanel(targetPanel);
                }
            }
        });
        mobileMenu.dataset.uiInitialized = "true";
    }

    function initializeDesktopMenuUI() {
        const desktopMenuContainer = document.querySelector(".cat_menu");
        const catalogBtn = document.querySelector(".catalog__btn");
        if (!desktopMenuContainer || !catalogBtn) return;
        const menuWrapper = desktopMenuContainer.querySelector('[data-tabs="catalog"]');
        if (!menuWrapper) return;
        const tablinks = menuWrapper.querySelectorAll(".tablink");
        const tabcontents = menuWrapper.querySelectorAll(".tabcontent");
        tablinks.forEach((tab) => {
            tab.addEventListener("mouseenter", function () {
                tablinks.forEach((t) => t.classList.remove("active"));
                tabcontents.forEach((t) => t.classList.remove("active"));
                this.classList.add("active");
                const targetId = this.getAttribute("data-target");
                const targetElement = document.getElementById(targetId);
                if (targetElement) targetElement.classList.add("active");
            });
        });
        const closeMenu = () => {
            catalogBtn.classList.remove("opened");
            desktopMenuContainer.classList.remove("opened");
        };
        catalogBtn.addEventListener("mouseenter", () => {
            catalogBtn.classList.add("opened");
            desktopMenuContainer.classList.add("opened");
        });
        desktopMenuContainer.addEventListener("mouseleave", closeMenu);
        catalogBtn.addEventListener("mouseleave", (e) => {
            if (!desktopMenuContainer.contains(e.relatedTarget)) closeMenu();
        });
    }

    async function loadMenuContent() {
        const desktopMenuContainer = document.querySelector(".cat_menu");
        const mobileMenuTrack = document.querySelector(".aside-menu__track");
        if (!desktopMenuContainer || desktopMenuContainer.dataset.menuLoaded === "true") return;
        desktopMenuContainer.classList.add("loading");
        try {
            const response = await fetch("/ajax/get-mega-menu/", { headers: { "X-Requested-With": "XMLHttpRequest" } });
            if (!response.ok) throw new Error("Failed to fetch menu");
            const data = await response.json();
            if (data.html_desktop) desktopMenuContainer.innerHTML = data.html_desktop;
            if (data.html_mobile) mobileMenuTrack.innerHTML = data.html_mobile;
            desktopMenuContainer.dataset.menuLoaded = "true";
            initializeDesktopMenuUI();
            initializeMobileMenuUI();
        } catch (error) {
            console.error("Error loading menu:", error);
        } finally {
            desktopMenuContainer.classList.remove("loading");
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const catalogBtn = document.querySelector(".catalog__btn");
        const mobileMenuTrigger = document.querySelector("[data-open-menu]");
        if (catalogBtn) {
            catalogBtn.addEventListener("mouseenter", loadMenuContent, { once: true });
        }
        if (mobileMenuTrigger) {
            mobileMenuTrigger.addEventListener("click", loadMenuContent, { once: true });
            mobileMenuTrigger.addEventListener("click", () => {
                const mobileMenu = document.querySelector("[data-menu]");
                if (mobileMenu && mobileMenu.dataset.uiInitialized === "true") {
                    mobileMenu.classList.add("is-open");
                    document.body.classList.add("no-scroll");
                }
            });
        }
    });

})();
