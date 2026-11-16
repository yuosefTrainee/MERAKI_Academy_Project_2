
// =====================================
// SHOPORA - CUSTOMER FAVORITES
// =====================================

import { getData, saveData } from "./storage.js";
import { getCurrentUser } from "./auth.js";
import { getProducts } from "./products.js";
import { getImage } from "./database.js";
import { addToCart } from "./cart.js";


// =====================================
// HELPER FUNCTIONS
// =====================================

function getUserKey() {

    const user = getCurrentUser();

    if (!user) return null;

    return `favorites_${user.id || user.email}`;

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


// =====================================
// GET FAVORITES
// =====================================

export function getFavorites() {

    const key = getUserKey();

    if (!key) return [];

    return getData(key, []);

}


// =====================================
// CHECK FAVORITE
// =====================================

export function isFavorite(productId) {

    return getFavorites().some(id =>
        String(id) === String(productId)
    );

}


// =====================================
// TOGGLE FAVORITE
// =====================================

export function toggleFavorite(productId) {

    const user = getCurrentUser();

    if (!user) {

        Swal.fire({
            icon: "warning",
            title: "Login Required",
            text: "Please login to use favorites."
        });

        return false;

    }

    const key = getUserKey();

    const favorites = getFavorites();

    const exists = favorites.some(id =>
        String(id) === String(productId)
    );

    let updatedFavorites;

    if (exists) {

        updatedFavorites = favorites.filter(id =>
            String(id) !== String(productId)
        );

    } else {

        updatedFavorites = [...favorites, productId];

    }

    saveData(key, updatedFavorites);

    return !exists;

}


// =====================================
// RENDER FAVORITES
// =====================================

export async function renderFavorites() {

    const container = document.getElementById("favoritesContainer");

    if (!container) return;

    const user = getCurrentUser();

    if (!user) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-lock"></i>

                <h3>Login Required</h3>

                <p>Please login to view your favorites.</p>

            </div>

        `;

        return;

    }


    const favoriteIds = getFavorites();

    const products = getProducts();

    const favoriteProducts = products.filter(product =>
        favoriteIds.some(id =>
            String(id) === String(product.id)
        )
    );


    // Empty Favorites

    if (favoriteProducts.length === 0) {

        container.innerHTML = `

            <div class="favorites-empty">

                <div class="favorites-empty-icon">

                    <i class="fa-regular fa-heart"></i>

                </div>

                <h3>Your Favorites Are Empty</h3>

                <p>
                    Save products you love and find them here anytime.
                </p>

                <button
                    class="btn-primary"
                    type="button"
                    data-page="products">

                    <i class="fa-solid fa-bag-shopping"></i>

                    Explore Products

                </button>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="favorites-grid">

            ${favoriteProducts.map(product => {

                const stock = Number(product.stock) || 0;

                return `

                    <div class="favorite-product-card">

                        <div class="favorite-product-image">

                            <div class="favorite-image-placeholder">

                                <i class="fa-solid fa-image"></i>

                            </div>

                            <button
                                class="favorite-remove-btn"
                                type="button"
                                data-favorite-id="${escapeHTML(product.id)}"
                                title="Remove from Favorites">

                                <i class="fa-solid fa-heart"></i>

                            </button>

                            <span class="favorite-stock-badge ${
                                stock > 0 ? "in-stock" : "sold-out"
                            }">

                                ${stock > 0 ? "In Stock" : "Sold Out"}

                            </span>

                        </div>

                        <div class="favorite-product-info">

                            <span class="product-category">

                                ${escapeHTML(product.category)}

                            </span>

                            <h3>

                                ${escapeHTML(product.name)}

                            </h3>

                            <p class="product-brand">

                                ${escapeHTML(product.brand)}

                            </p>

                            <div class="favorite-product-price">

                                ${formatPrice(product.price)}

                            </div>

                            <div class="favorite-product-actions">

                                <button
                                    class="favorite-view-btn view-product-btn"
                                    type="button"
                                    data-product-id="${escapeHTML(product.id)}">

                                    <i class="fa-solid fa-eye"></i>

                                    View Details

                                </button>

                                <button
                                    class="favorite-cart-btn"
                                    type="button"
                                    data-add-to-cart="${escapeHTML(product.id)}"
                                    ${stock <= 0 ? "disabled" : ""}>

                                    <i class="fa-solid fa-cart-shopping"></i>

                                    Add to Cart

                                </button>

                            </div>

                        </div>

                    </div>

                `;

            }).join("")}

        </div>

    `;


    // Load Product Images

    const imageElements = container.querySelectorAll(
        ".favorite-product-card"
    );

    for (const card of imageElements) {

        const productId = card
            .querySelector("[data-product-id]")
            ?.dataset.productId ||
            card.querySelector("[data-add-to-cart]")
                ?.dataset.addToCart;

        const product = favoriteProducts.find(item =>
            String(item.id) === String(productId)
        );

        if (!product || !product.imageId) continue;

        try {

            const imageBlob = await getImage(product.imageId);

            if (!imageBlob) continue;

            const imageURL = URL.createObjectURL(imageBlob);

            const placeholder = card.querySelector(
                ".favorite-image-placeholder"
            );

            if (!placeholder) {

                URL.revokeObjectURL(imageURL);

                continue;

            }

            const image = document.createElement("img");

            image.src = imageURL;

            image.alt = product.name;

            image.className = "favorite-product-img";

            image.onload = () => {

                URL.revokeObjectURL(imageURL);

            };

            image.onerror = () => {

                URL.revokeObjectURL(imageURL);

            };

            placeholder.replaceWith(image);

        } catch (error) {

            console.error(
                "Could not load favorite image:",
                error
            );

        }

    }

}


// =====================================
// INITIALIZE FAVORITES
// =====================================

export function initializeFavorites() {

    document.addEventListener("click", function (event) {

        const button = event.target.closest("[data-favorite-id]");

        if (!button) return;

        const productId = button.dataset.favoriteId;

        const user = getCurrentUser();

        if (!user) {

            toggleFavorite(productId);

            return;

        }

        const wasFavorite = isFavorite(productId);

        toggleFavorite(productId);

        if (wasFavorite) {

            Swal.fire({

                icon: "success",

                title: "Removed from Favorites",

                timer: 1200,

                showConfirmButton: false

            });

        } else {

            Swal.fire({

                icon: "success",

                title: "Added to Favorites",

                timer: 1200,

                showConfirmButton: false

            });

        }

        renderFavorites();

    });

}
