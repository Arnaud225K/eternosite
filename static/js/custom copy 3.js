

// (() => {
//     "use strict";

//     // SECTION 1 : FONCTIONS UTILITAIRES ET GLOBALES
//     const getCsrfToken = () => {
//         const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
//         if (!csrfInput) {
//             console.error("CSRF token not found. Make sure {% csrf_token %} is present in your template.");
//             return null;
//         }
//         return csrfInput.value;
//     };

//     function displayValidationError(input, message) {
//         const formGroup = input.closest('.form-group, .form-block__agreement > label');
//         if (!formGroup) return;
//         let errorContainer = formGroup.parentElement.querySelector('.form-error');
//         if (!errorContainer) {
//             errorContainer = document.createElement('div');
//             errorContainer.className = 'form-error';
//             formGroup.insertAdjacentElement('afterend', errorContainer);
//         }
//         errorContainer.textContent = message;
//         errorContainer.style.display = 'block';
//         input.classList.add('invalid');
//     }

//     function clearValidationError(input) {
//         const formGroup = input.closest('.form-group, .form-block__agreement > label');
//         if (!formGroup) return;
//         const errorContainer = formGroup.parentElement.querySelector('.form-error');
//         if (errorContainer) {
//             errorContainer.style.display = 'none';
//         }
//     }

//     window.updateHeaderCartCounter = function(count) {
//         const counterElement = document.getElementById('header-cart-count');
//         if (!counterElement) return;
//         const countNum = parseInt(count, 10) || 0;
//         counterElement.textContent = countNum;
//         counterElement.style.display = countNum > 0 ? 'flex' : 'none';
//     };

//     async function sendCartRequest(url, body = null) {
//         const csrf = getCsrfToken();
//         if (!csrf) return null;

//         try {
//             const headers = { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': csrf };
//             const options = { method: 'POST', headers };
//             if (body) {
//                 options.body = JSON.stringify(body);
//                 headers['Content-Type'] = 'application/json';
//             }
//             const response = await fetch(url, options);
//             if (!response.ok) throw new Error(`Network error: ${response.status}`);
//             return await response.json();
//         } catch (error) {
//             console.error("Cart AJAX Error:", error);
//             return null;
//         }
//     }

//     function updateCartUI(data) {
//         const itemsWrapper = document.querySelector('.cart__products'); 
//         const emptyMessage = document.querySelector('.cart__empty');
//         const contentWrapper = document.querySelector('.cart_list__section');

//         if (!itemsWrapper || !emptyMessage || !contentWrapper) return;

//         const uniqueItemsCount = data && data.cart_unique_items_count !== undefined ? parseInt(data.cart_unique_items_count, 10) : 0;
//         const isCartEmpty = uniqueItemsCount === 0;

//         emptyMessage.style.display = isCartEmpty ? 'block' : 'none';
//         contentWrapper.style.display = isCartEmpty ? 'none' : 'block';

//         if (!isCartEmpty && data && data.html_cart_items !== undefined) {
//             itemsWrapper.innerHTML = data.html_cart_items;
//         }
//     }

//     // SECTION 2 : GESTION DES ÉVÉNEMENTS

//     document.addEventListener("DOMContentLoaded", () => {

//         document.body.addEventListener('click', async function(event) {
            
//             const addButton = event.target.closest('.addtocart');
//             if (addButton) {
//                 event.preventDefault();
//                 const productCard = addButton.closest('.subcategory__product');
//                 //Si le produit est déjà au panier, on arrete tout
//                 // if (productCard.classList.contains('purchased')) return;

//                 if (productCard && productCard.classList.contains('purchased')) {
//                     // Si le produit est déjà au panier, rediriger vers la page panier
//                     window.location.href = '/checkout/';
//                     return; 
//                 }


            
//                 const productId = productCard.dataset.productId;
//                 const quantityInput = productCard.querySelector('.amount');
//                 const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
            
//                 addButton.disabled = true;
            
//                 const data = await sendCartRequest(`/checkout/cart/add/${productId}/`, { quantity: quantity });
                
//                 if (data && data.success) {
//                     document.querySelectorAll(`.subcategory__product[data-product-id="${productId}"]`).forEach(card => {
//                         card.classList.add('purchased');
//                         const btnSpan = card.querySelector('.addProduct > span');
//                         if(btnSpan) 
//                             btnSpan.textContent = 'В корзине';
//                     });
//                     window.updateHeaderCartCounter(data.cart_unique_items_count);
//                 }
//                 addButton.disabled = false;
//                 return;
//             }

//             const quantityButton = event.target.closest('.subcategory__product .plus, .subcategory__product .minus');
//             if (quantityButton) {
//                 const productCard = quantityButton.closest('.subcategory__product');
                
//                 const quantityInput = productCard.querySelector('.amount');
//                 if (quantityInput) {
//                     let currentValue = parseInt(quantityInput.value, 10) || 1;
//                     if (quantityButton.matches('.plus')) {
//                         quantityInput.value = currentValue + 1;
//                     } else if (quantityButton.matches('.minus') && currentValue > 1) {
//                         quantityInput.value = currentValue - 1;
//                     }
//                 }
//                 return;
//             }
//         });

//         const cartPageContainer = document.querySelector('section.cart');
//         if (!cartPageContainer) return;

//         async function handleCartAction(productId, quantity) {
//             const url = (quantity > 0) ? `/checkout/cart/update/${productId}/` : `/checkout/cart/remove/${productId}/`;
//             const body = (quantity > 0) ? { quantity: quantity } : null;
//             const data = await sendCartRequest(url, body);
//             if (data && data.success) {
//                 updateCartUI(data);
//                 window.updateHeaderCartCounter(data.cart_unique_items_count);
//             }
//         }

//         cartPageContainer.addEventListener('click', function(event) {
//             const cartItem = event.target.closest('.cart__item');
//             if (!cartItem) return;

//             const productId = cartItem.dataset.productId;
//             const quantityInput = cartItem.querySelector(".amount");
//             let currentQty = parseInt(quantityInput.value, 10);

//             if (event.target.matches('.plus')) {
//                 handleCartAction(productId, currentQty + 1);
//             } else if (event.target.matches('.minus')) {
//                 if (currentQty > 0) {
//                     handleCartAction(productId, currentQty - 1);
//                 }
//             } else if (event.target.closest('.cart__item-del')) {
//                 handleCartAction(productId, 0);
//             }
//         });

//         cartPageContainer.addEventListener('change', function(event) {
//             if (event.target.matches('.amount')) {
//                 const cartItem = event.target.closest('.cart__item');
//                 const productId = cartItem.dataset.productId;
//                 let newQty = parseInt(event.target.value, 10);
//                 if (isNaN(newQty) || newQty < 0) newQty = 0;
//                 handleCartAction(productId, newQty);
//             }
//         });
        
//         // --- 3. Logique du formulaire de commande ---

//         // INITIALISATION DES ÉVÉNEMENTS
        
//         // --- Gestion du formulaire de commande ---
//         const checkoutForm = document.getElementById('checkout-form');
//         if (checkoutForm) {
//             const fileInput = checkoutForm.querySelector('input[name="file"]');
//             const fileNameDisplay = document.getElementById('file-name-display');
//             if (fileInput && fileNameDisplay) {
//                 fileInput.addEventListener('change', function() {
//                     fileNameDisplay.textContent = this.files.length > 0 ? this.files[0].name : 'Прикрепить файл';
//                 });
//             }
            
//             const agreementVisual = document.getElementById('agreement_visual_checkbox');
//             const agreementHidden = checkoutForm.querySelector('input[name="agreement"]');
//             if (agreementVisual && agreementHidden) {
//                 agreementVisual.addEventListener('change', function() {
//                     agreementHidden.checked = this.checked;
//                     if (this.checked) {
//                         clearValidationError(this);
//                     }
//                 });
//             }

//             checkoutForm.addEventListener('submit', function(event) {
//                 let isFormValid = true;

//                 const phoneInput = checkoutForm.querySelector('input[name="phone"]');
//                 if (phoneInput) {
//                     const cleanedPhone = phoneInput.value.replace(/\D/g, '');
//                     if (cleanedPhone.length < 11) {
//                         displayValidationError(phoneInput, "Пожалуйста, введите полный номер телефона.");
//                         isFormValid = false;
//                     } else {
//                         clearValidationError(phoneInput);
//                     }
//                 }

//                 if (agreementVisual && !agreementVisual.checked) {
//                     displayValidationError(agreementVisual, "Необходимо согласиться на обработку данных.");
//                     isFormValid = false;
//                 } else if (agreementVisual) {
//                     clearValidationError(agreementVisual);
//                 }

//                 if (!isFormValid) {
//                     event.preventDefault();
//                     console.warn("Client-side form validation failed. Submission stopped.");
//                 }
//             });
//         }
//     });
// })();



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

    window.updateHeaderCartCounter = function(count) {
        const counterElement = document.getElementById('header-cart-count');
        if (!counterElement) return;
        const countNum = parseInt(count, 10) || 0;
        counterElement.textContent = countNum;
        counterElement.style.display = countNum > 0 ? 'flex' : 'none';
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
            if (addButton) {
                event.preventDefault();
                
                const productContainer = addButton.closest('.subcategory__product, section.product');
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
                    document.querySelectorAll(`.subcategory__product[data-product-id="${productId}"], section.product[data-product-id="${productId}"]`).forEach(container => {
                        container.classList.add('purchased');
                        const btn = container.querySelector('.addtocart');
                        if(btn) {
                            const btnSpan = btn.querySelector('span');
                            if (btnSpan) btnSpan.textContent = 'В корзине';
                            btn.classList.add('purchased');
                        }
                    });
                    window.updateHeaderCartCounter(data.cart_unique_items_count);
                }
                addButton.disabled = false;
                return;
            }

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
                return;
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
                    console.warn("Client-side form validation failed. Submission stopped.");
                }
            });
        }
    });
})();