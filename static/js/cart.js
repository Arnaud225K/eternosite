// (() => {
//     "use strict";

//     // --- Fonctions Utilitaires ---
//     const getCsrfToken = () => document.querySelector('[name=csrfmiddlewaretoken]').value;

//     window.updateHeaderCartCounter = function(count) {
//         const counterElement = document.getElementById('header-cart-count');
//         if (!counterElement) return;
//         const countNum = parseInt(count, 10) || 0;
//         counterElement.textContent = countNum;
//         counterElement.style.display = countNum > 0 ? 'flex' : 'none';
//     };

//     function getTovarPlural(count) {
//         try {
//             count = Math.abs(parseInt(count, 10)) % 100;
//             const lastDigit = count % 10;
//             if (count > 10 && count < 20) return "ов";
//             if (lastDigit > 1 && lastDigit < 5) return "а";
//             if (lastDigit === 1) return "";
//         } catch (e) { return "ов"; }
//         return "ов";
//     }

//     // --- Fonction AJAX Générique ---
//     async function sendCartUpdateRequest(url, body = null) {
//         const headers = { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': getCsrfToken() };
//         const options = { method: 'POST', headers };
//         if (body) {
//             options.body = JSON.stringify(body);
//             headers['Content-Type'] = 'application/json';
//         }
        
//         try {
//             const response = await fetch(url, options);
//             if (!response.ok) throw new Error(`Network error: ${response.status}`);
//             const data = await response.json();
            
//             if (data.success) {
//                 updateCartUI(data); // Met à jour la page panier
//                 if (typeof window.updateHeaderCartCounter === 'function') {
//                     window.updateHeaderCartCounter(data.cart_unique_items_count);
//                 }
//             } else {
//                 console.error("API Error:", data.error);
//             }
//         } catch (error) {
//             console.error("Failed to update cart:", error);
//         }
//     }

//     // --- Fonction de Mise à Jour de l'UI ---
//     function updateCartUI(data) {
//         const itemsWrapper = document.getElementById('cart-items-wrapper');
//         if (itemsWrapper && data.html_cart_items !== undefined) {
//             itemsWrapper.innerHTML = data.html_cart_items;
//         }

//         const totalPriceElement = document.getElementById('cart-total-price');
//         if (totalPriceElement && data.cart_total_price_display !== undefined) {
//             totalPriceElement.textContent = data.cart_total_price_display;
//         }

//         const emptyMessage = document.getElementById('cart-empty-message');
//         const contentWrapper = document.getElementById('cart-content-wrapper');
//         const uniqueItemsCount = data.cart_unique_items_count !== undefined ? parseInt(data.cart_unique_items_count, 10) : 0;
//         if (emptyMessage && contentWrapper) {
//             const isCartEmpty = uniqueItemsCount === 0;
//             emptyMessage.style.display = isCartEmpty ? 'block' : 'none';
//             contentWrapper.style.display = isCartEmpty ? 'none' : 'block';
//             if (isCartEmpty) {
//                 // Optionnel: si vous voulez recharger la page quand le panier devient vide
//                 // window.location.reload(); 
//             }
//         }
//     }

//     // --- ÉVÉNEMENTS ---

//     // 1. Ajout au panier depuis n'importe où sur le site
//     document.body.addEventListener('click', async function(event) {
//         const addButton = event.target.closest('.addtocart');
//         if (!addButton) return;
//         event.preventDefault();

//         const productCard = addButton.closest('.subcategory__product');
//         const productId = productCard.dataset.productId;
//         const quantityInput = productCard.querySelector('.amount');
//         const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

//         addButton.disabled = true;

//         await sendCartUpdateRequest(`/checkout/cart/add/${productId}/`, { quantity: quantity });
        
//         // Mettre à jour l'état du bouton après l'appel
//         document.querySelectorAll(`.subcategory__product[data-product-id="${productId}"] .addtocart`).forEach(btn => {
//             btn.innerHTML = 'В корзине';
//             btn.classList.add('in-cart');
//             btn.disabled = false;
//         });
//     });

//     // 2. Logique spécifique à la page panier
//     const cartPageContainer = document.querySelector('.cart'); // On cible le conteneur principal du panier
//     if (!cartPageContainer) return;

//     // Délégation des clics pour +/-/supprimer
//     cartPageContainer.addEventListener('click', function(event) {
//         const cartItem = event.target.closest('.cart__item');
//         if (!cartItem) return;

//         const productId = cartItem.dataset.productId;
//         const quantityInput = cartItem.querySelector(".amount");
//         let currentQty = parseInt(quantityInput.value, 10);

//         if (event.target.matches('.plus')) {
//             sendCartUpdateRequest(`/checkout/api/cart/update/${productId}/`, { quantity: currentQty + 1 });
//         } else if (event.target.matches('.minus')) {
//             if (currentQty > 0) {
//                 sendCartUpdateRequest(`/checkout/api/cart/update/${productId}/`, { quantity: currentQty - 1 });
//             }
//         } else if (event.target.closest('.cart__item-del')) {
//             sendCartUpdateRequest(`/checkout/api/cart/remove/${productId}/`);
//         }
//     });

//     // Délégation des changements manuels dans l'input
//     cartPageContainer.addEventListener('change', function(event) {
//         if (event.target.matches('.amount')) {
//             const cartItem = event.target.closest('.cart__item');
//             const productId = cartItem.dataset.productId;
//             let newQty = parseInt(event.target.value, 10);
//             if (isNaN(newQty) || newQty < 0) newQty = 0;
//             sendCartUpdateRequest(`/checkout/api/cart/update/${productId}/`, { quantity: newQty });
//         }
//     });

//     // Logique du formulaire de commande (validation, etc.)
//     const checkoutForm = document.getElementById('checkout-form');
//     if (checkoutForm) {
//         // ... (collez ici votre logique de validation de formulaire de l'ancien projet)
//         // C'est une bonne pratique de la garder séparée de la logique AJAX du panier.
//     }

// })();