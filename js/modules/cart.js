// =====================================
// SHOPORA - CUSTOMER CART
// =====================================

import { getData, saveData } from "./storage.js";
import { getCurrentUser } from "./auth.js";
import { getProducts } from "./products.js";
import { getImage } from "./database.js";

let cartImageURLs = [];


// =====================================
// HELPER FUNCTIONS
// =====================================

function getCartKey() {

    const user = getCurrentUser();

    if (!user) return null;

    return `cart_${user.id || user.email}`;

}


function escapeHTML(value = "") {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

}


function formatPrice(price) {

    return `${Number(price || 0).toFixed(2)} JD`;

}


function showMessage(icon, title, text = "") {

    if (typeof Swal !== "undefined") {

        Swal.fire({
            icon,
            title,
            text,
            timer: 1600,
            showConfirmButton: false
        });

    } else {

        alert(`${title} ${text}`);

    }

}


function cleanCartImageURLs() {

    cartImageURLs.forEach(url => {
        URL.revokeObjectURL(url);
    });

    cartImageURLs = [];

}


// =====================================
// GET CART
// =====================================

export function getCart() {

    const key = getCartKey();

    if (!key) return [];

    return getData(key, []);

}


// =====================================
// SAVE CART
// =====================================

function saveCart(cart) {

    const key = getCartKey();

    if (!key) return false;

    return saveData(key, cart);

}


// =====================================
// ADD TO CART
// =====================================

export function addToCart(productId, quantity = 1) {

    const user = getCurrentUser();

    if (!user) {

        showMessage(
            "warning",
            "Login Required",
            "Please login before adding products to your cart."
        );

        return false;

    }

    const product = getProducts().find(item =>
        String(item.id) === String(productId)
    );

    if (!product) {

        showMessage("error", "Product Not Found");

        return false;

    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {

        showMessage("warning", "Invalid Quantity");

        return false;

    }

    const stock = Number(product.stock) || 0;

    if (stock <= 0) {

        showMessage("warning", "Sold Out");

        return false;

    }

    const cart = getCart();

    const existingItem = cart.find(item =>
        String(item.productId) === String(productId)
    );

    const currentQuantity = existingItem
        ? Number(existingItem.quantity)
        : 0;

    if (currentQuantity + requestedQuantity > stock) {

        showMessage(
            "warning",
            "Not Enough Stock",
            `Only ${stock} item(s) are available.`
        );

        return false;

    }

    if (existingItem) {

        existingItem.quantity += requestedQuantity;

    } else {

        cart.push({
            productId: product.id,
            quantity: requestedQuantity
        });

    }

    saveCart(cart);

    updateCartCount();

    showMessage(
        "success",
        "Added to Cart",
        `${product.name} was added successfully.`
    );

    return true;

}


// =====================================
// REMOVE FROM CART
// =====================================

export function removeFromCart(productId) {

    const cart = getCart();

    const updatedCart = cart.filter(item =>
        String(item.productId) !== String(productId)
    );

    saveCart(updatedCart);

    updateCartCount();

    renderCart();

}


// =====================================
// UPDATE QUANTITY
// =====================================

export function updateCartQuantity(productId, quantity) {

    const newQuantity = Number(quantity);

    if (!Number.isInteger(newQuantity) || newQuantity < 1) {
        return false;
    }

    const cart = getCart();

    const item = cart.find(item =>
        String(item.productId) === String(productId)
    );

    if (!item) return false;

    const product = getProducts().find(product =>
        String(product.id) === String(productId)
    );

    if (!product) return false;

    const stock = Number(product.stock) || 0;

    if (newQuantity > stock) {

        showMessage(
            "warning",
            "Not Enough Stock",
            `Only ${stock} item(s) are available.`
        );

        return false;

    }

    item.quantity = newQuantity;

    saveCart(cart);

    updateCartCount();

    renderCart();

    return true;

}


// =====================================
// CART TOTAL
// =====================================

export function getCartTotal() {

    const cart = getCart();

    const products = getProducts();

    return cart.reduce((total, item) => {

        const product = products.find(product =>
            String(product.id) === String(item.productId)
        );

        if (!product) return total;

        return total +
            Number(product.price) * Number(item.quantity);

    }, 0);

}


// =====================================
// UPDATE CART COUNT
// =====================================

export function updateCartCount() {

    const cartCount = document.getElementById("cartCount");

    if (!cartCount) return;

    const totalQuantity = getCart().reduce(
        (total, item) => total + Number(item.quantity),
        0
    );

    cartCount.textContent = totalQuantity;

}


// =====================================
// GET PRODUCT IMAGE
// =====================================

async function getCartProductImage(product) {

    if (!product.imageId) {

        return `
            <div class="cart-image-placeholder">
                <i class="fa-solid fa-image"></i>
            </div>
        `;

    }

    try {

        const imageBlob = await getImage(product.imageId);

        if (!imageBlob) {

            return `
                <div class="cart-image-placeholder">
                    <i class="fa-solid fa-image"></i>
                </div>
            `;

        }

        const imageURL = URL.createObjectURL(imageBlob);

        cartImageURLs.push(imageURL);

        return `
            <img
                src="${imageURL}"
                alt="${escapeHTML(product.name)}"
                class="cart-product-image"
            >
        `;

    } catch (error) {

        console.error("Could not load cart image:", error);

        return `
            <div class="cart-image-placeholder">
                <i class="fa-solid fa-image"></i>
            </div>
        `;

    }

}


// =====================================
// EMPTY CART
// =====================================

function renderEmptyCart(container, summary) {

    container.innerHTML = `

        <div class="cart-empty-state">

            <div class="cart-empty-icon">
                <i class="fa-solid fa-cart-shopping"></i>
            </div>

            <h3>Your Cart Is Empty</h3>

            <p>
                You haven't added any products to your cart yet.
            </p>

            <button
                type="button"
                class="btn-primary"
                data-page="products">

                Continue Shopping
                <i class="fa-solid fa-arrow-right"></i>

            </button>

        </div>

    `;

    if (summary) {
        summary.innerHTML = "";
    }

    updateCartCount();

}


// =====================================
// RENDER CART
// =====================================

export async function renderCart() {

    const container = document.getElementById("cartContainer");

    const summary = document.getElementById("cartSummary");

    if (!container) return;

    // Remove the old checkout button from HTML
    // The new button will be rendered inside the summary.

    const oldCheckoutButton = document.querySelector(
        "#cart > #checkoutBtn"
    );

    if (oldCheckoutButton) {
        oldCheckoutButton.remove();
    }

    cleanCartImageURLs();

    const user = getCurrentUser();

    if (!user) {

        container.innerHTML = `

            <div class="cart-empty-state">

                <div class="cart-empty-icon">
                    <i class="fa-solid fa-lock"></i>
                </div>

                <h3>Login Required</h3>

                <p>
                    Please login to view your shopping cart.
                </p>

                <button
                    type="button"
                    class="btn-primary"
                    data-page="login">

                    Login Now

                </button>

            </div>

        `;

        if (summary) summary.innerHTML = "";

        return;

    }

    const cart = getCart();

    const products = getProducts();

    const validItems = cart.filter(item =>
        products.some(product =>
            String(product.id) === String(item.productId)
        )
    );

    if (validItems.length !== cart.length) {

        saveCart(validItems);

    }

    if (validItems.length === 0) {

        renderEmptyCart(container, summary);

        return;

    }

    const itemsHTML = [];

    for (const item of validItems) {

        const product = products.find(product =>
            String(product.id) === String(item.productId)
        );

        if (!product) continue;

        const quantity = Number(item.quantity);

        const subtotal = Number(product.price) * quantity;

        const stock = Number(product.stock) || 0;

        const imageHTML = await getCartProductImage(product);

        itemsHTML.push(`

            <article class="cart-item">

                <div class="cart-item-image">
                    ${imageHTML}
                </div>

                <div class="cart-item-info">

                    <span class="cart-item-category">
                        ${escapeHTML(product.category || "Product")}
                    </span>

                    <h3>
                        ${escapeHTML(product.name)}
                    </h3>

                    <p class="cart-item-brand">
                        ${escapeHTML(product.brand || "")}
                    </p>

                    <span class="cart-item-unit-price">
                        ${formatPrice(product.price)} / item
                    </span>

                </div>

                <div class="cart-item-quantity">

                    <span class="cart-label">Quantity</span>

                    <div class="quantity-control">

                        <button
                            type="button"
                            data-cart-action="decrease"
                            data-product-id="${escapeHTML(product.id)}"
                            aria-label="Decrease quantity">

                            <i class="fa-solid fa-minus"></i>

                        </button>

                        <span class="quantity-value">
                            ${quantity}
                        </span>

                        <button
                            type="button"
                            data-cart-action="increase"
                            data-product-id="${escapeHTML(product.id)}"
                            aria-label="Increase quantity"
                            ${quantity >= stock ? "disabled" : ""}>

                            <i class="fa-solid fa-plus"></i>

                        </button>

                    </div>

                </div>

                <div class="cart-item-total">

                    <span class="cart-label">Subtotal</span>

                    <strong>
                        ${formatPrice(subtotal)}
                    </strong>

                    <button
                        type="button"
                        class="remove-cart-btn"
                        data-remove-cart="${escapeHTML(product.id)}">

                        <i class="fa-solid fa-trash"></i>
                        Remove

                    </button>

                </div>

            </article>

        `);

    }

    container.innerHTML = `

        <div class="cart-items-list">

            ${itemsHTML.join("")}

        </div>

    `;

    // Calculate summary

    const totalItems = validItems.reduce(
        (total, item) => total + Number(item.quantity),
        0
    );

    const totalPrice = getCartTotal();

    if (summary) {

        summary.innerHTML = `

            <div class="cart-summary-content">

                <div class="cart-summary-heading">

                    <h3>Order Summary</h3>

                    <span>
                        ${totalItems} ${totalItems === 1 ? "item" : "items"}
                    </span>

                </div>

                <div class="cart-summary-row">

                    <span>Subtotal</span>

                    <strong>
                        ${formatPrice(totalPrice)}
                    </strong>

                </div>

                <div class="cart-summary-row">

                    <span>Shipping</span>

                    <strong>Free</strong>

                </div>

                <div class="cart-summary-divider"></div>

                <div class="cart-summary-row cart-summary-total">

                    <strong>Total</strong>

                    <strong>
                        ${formatPrice(totalPrice)}
                    </strong>

                </div>

                <button
                    type="button"
                    class="btn-primary cart-checkout-btn"
                    id="checkoutBtn">

                    Proceed to Checkout
                    <i class="fa-solid fa-arrow-right"></i>

                </button>

                <p class="cart-secure-note">
                    <i class="fa-solid fa-shield-halved"></i>
                    Secure checkout
                </p>

            </div>

        `;

    }

    updateCartCount();

}


// =====================================
// INITIALIZE CART
// =====================================

export function initializeCart() {

    document.addEventListener("click", function (event) {

        // Add To Cart

        const addButton = event.target.closest("[data-add-to-cart]");

        if (addButton) {

            addToCart(addButton.dataset.addToCart);

            return;

        }


        // Remove From Cart

        const removeButton = event.target.closest("[data-remove-cart]");

        if (removeButton) {

            removeFromCart(removeButton.dataset.removeCart);

            return;

        }


        // Increase / Decrease Quantity

        const quantityButton = event.target.closest("[data-cart-action]");

        if (quantityButton) {

            const productId = quantityButton.dataset.productId;

            const action = quantityButton.dataset.cartAction;

            const item = getCart().find(item =>
                String(item.productId) === String(productId)
            );

            if (!item) return;

            const newQuantity = action === "increase"
                ? Number(item.quantity) + 1
                : Number(item.quantity) - 1;

            if (newQuantity < 1) {

                removeFromCart(productId);

            } else {

                updateCartQuantity(productId, newQuantity);

            }

        }

    });

}