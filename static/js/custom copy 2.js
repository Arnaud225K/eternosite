

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
                const productCard = addButton.closest('.subcategory__product');
                //Si le produit est déjà au panier, on arrete tout
                // if (productCard.classList.contains('purchased')) return;

                if (productCard.classList.contains('purchased')) {
                    // Si le produit est déjà au panier, rediriger vers la page panier
                    window.location.href = '/checkout/';
                    return; 
                }
            
                const productId = productCard.dataset.productId;
                const quantityInput = productCard.querySelector('.amount');
                const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
            
                addButton.disabled = true;
            
                const data = await sendCartRequest(`/checkout/cart/add/${productId}/`, { quantity: quantity });
                
                if (data && data.success) {
                    document.querySelectorAll(`.subcategory__product[data-product-id="${productId}"]`).forEach(card => {
                        card.classList.add('purchased');
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
        
        // --- 3. Logique du formulaire de commande ---
        // (Vous pouvez ajouter votre logique de validation de formulaire ici)
    });
})();