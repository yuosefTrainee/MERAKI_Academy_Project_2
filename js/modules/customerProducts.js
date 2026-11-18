// =====================================
// SHOPORA - CUSTOMER PRODUCTS
// =====================================

import { getProducts } from "./products.js";
import { getImage } from "./database.js";
import { showPage } from "./navigation.js";
import { isFavorite } from "./favorites.js";
import { addToCart } from "./cart.js";

import { renderProductReviews } from "./reviews.js";


// Store Object URLs to clean them later
let objectUrls = [];

let currentProductId = null;
let currentProductName = "";


// =====================================
// Escape HTML
// =====================================

function escapeHTML(value = "") {

    return String(value).replace(/[&<>"']/g, function (character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];

    });

}


// =====================================
// Format Price
// =====================================

function formatPrice(price) {

    return `$${Number(price).toFixed(2)}`;

}


// =====================================
// Get Product Image
// =====================================

async function getProductImage(imageId) {

    if (!imageId) return null;

    try {

        const imageBlob = await getImage(imageId);

        if (!imageBlob) return null;

        const imageUrl = URL.createObjectURL(imageBlob);

        objectUrls.push(imageUrl);

        return imageUrl;

    } catch (error) {

        console.error("Could not load product image:", error);

        return null;

    }

}


// =====================================
// Clean Old Object URLs
// =====================================

function cleanObjectUrls() {

    objectUrls.forEach(url => {

        URL.revokeObjectURL(url);

    });

    objectUrls = [];

}


// =====================================
// Product Card
// =====================================

async function createProductCard(product) {

    const imageUrl = await getProductImage(product.imageId);

    const imageContent = imageUrl
        ? `<img src="${imageUrl}" alt="${escapeHTML(product.name)}">`
        : `<div class="product-image-placeholder">
                <i class="fa-solid fa-image"></i>
           </div>`;

    const stock = Number(product.stock) || 0;

    let stockText = "In Stock";
    let stockClass = "in-stock";

    if (stock === 0) {

        stockText = "Sold Out";
        stockClass = "sold-out";

    } else if (stock <= 5) {

        stockText = "Low Stock";
        stockClass = "low-stock";

    }

    const favoriteActive = isFavorite(product.id);

    return `

        <div class="customer-product-card">

            <div class="customer-product-image">

                ${imageContent}

                <span class="product-stock ${stockClass}">
                    ${stockText}
                </span>

                <button
                    class="favorite-toggle-btn ${favoriteActive ? "active" : ""}"
                    type="button"
                    data-favorite-id="${escapeHTML(product.id)}"
                    aria-label="Toggle Favorite">

                    <i class="fa-solid fa-heart"></i>

                </button>

            </div>

            <div class="customer-product-info">

                <span class="product-category">
                    ${escapeHTML(product.category)}
                </span>

                <h3>
                    ${escapeHTML(product.name)}
                </h3>

                <p class="product-brand">
                    ${escapeHTML(product.brand)}
                </p>

                <div class="customer-product-bottom">

                    <strong class="product-price">
                        ${formatPrice(product.price)}
                    </strong>

                    <button
                        class="view-product-btn"
                        data-product-id="${escapeHTML(product.id)}"
                        type="button">

                        View Details

                    </button>

                </div>

                <button
                    class="add-to-cart-btn"
                    type="button"
                    data-add-to-cart="${escapeHTML(product.id)}"
                    ${stock === 0 ? "disabled" : ""}>

                    <i class="fa-solid fa-cart-shopping"></i>

                    ${stock === 0 ? "Sold Out" : "Add to Cart"}

                </button>

            </div>

        </div>

    `;

}


// =====================================
// Render Product Cards
// =====================================

async function renderProductCards(container, products) {

    cleanObjectUrls();

    container.empty();

    if (!products.length) {

        container.html(`

            <div class="customer-empty-state">

                <i class="fa-solid fa-box-open"></i>

                <h3>No Products Found</h3>

                <p>Try searching for another product.</p>

            </div>

        `);

        return;

    }

    container.html(`

        <div class="products-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>Loading products...</p>

        </div>

    `);

    try {

        const cards = await Promise.all(

            products.map(product => createProductCard(product))

        );

        container.html(cards.join(""));

    } catch (error) {

        console.error("Error rendering products:", error);

        container.html(`

            <p class="customer-empty-state">
                Something went wrong while loading products.
            </p>

        `);

    }

}


// =====================================
// Render Featured Products
// =====================================

export async function renderFeaturedProducts() {

    const container = $("#featuredProductsContainer");

    if (!container.length) return;

    const products = getProducts();

    const featuredProducts = [...products]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4);

    await renderProductCards(container, featuredProducts);

}


// =====================================
// Get Filtered Products
// =====================================

function getFilteredProducts() {

    let products = [...getProducts()];

    const searchValue = $("#searchInput").val()
        ?.trim()
        .toLowerCase() || "";

    const categoryValue = $("#categoryFilter").val() || "all";

    const sortValue = $("#sortProducts").val() || "default";


    if (searchValue) {

        products = products.filter(product => {

            return (

                product.name?.toLowerCase().includes(searchValue) ||

                product.brand?.toLowerCase().includes(searchValue) ||

                product.category?.toLowerCase().includes(searchValue)

            );

        });

    }


    if (categoryValue !== "all") {

        products = products.filter(product => {

            return product.category === categoryValue;

        });

    }


    if (sortValue === "low-high") {

        products.sort((a, b) => Number(a.price) - Number(b.price));

    }

    else if (sortValue === "high-low") {

        products.sort((a, b) => Number(b.price) - Number(a.price));

    }


    return products;

}


// =====================================
// Render All Products
// =====================================

export async function renderCustomerProducts() {

    const container = $("#productsContainer");

    if (!container.length) return;

    const products = getFilteredProducts();

    await renderProductCards(container, products);

}


// =====================================
// Initialize Product Filters
// =====================================

export function initializeCustomerProductFilters() {

    $("#searchInput, #categoryFilter, #sortProducts")
        .on("input change", function () {

            renderCustomerProducts();

        });

}


// =====================================
// Product Details
// =====================================

export async function showProductDetails(productId) {

    const product = getProducts().find(

        item => String(item.id) === String(productId)

    );


    if (!product) {

        Swal.fire({

            icon: "error",
            title: "Product Not Found",
            text: "This product is no longer available."

        });

        return;

    }


    currentProductId = product.id;
    currentProductName = product.name;


    const imageUrl = await getProductImage(product.imageId);

    const imageContent = imageUrl
        ? `<img src="${imageUrl}" alt="${escapeHTML(product.name)}">`
        : `<div class="product-image-placeholder">
                <i class="fa-solid fa-image"></i>
           </div>`;

    const stock = Number(product.stock) || 0;

    const container = $("#productDetailsContainer");


    container.html(`

        <div class="product-details-card">

            <div class="product-details-image">

                ${imageContent}

            </div>


            <div class="product-details-info">

                <span class="product-category">
                    ${escapeHTML(product.category)}
                </span>

                <h2>
                    ${escapeHTML(product.name)}
                </h2>

                <p class="product-brand">

                    <i class="fa-solid fa-tag"></i>

                    Brand: ${escapeHTML(product.brand)}

                </p>

                <h3 class="product-details-price">

                    ${formatPrice(product.price)}

                </h3>

                <p class="product-description">

                    ${escapeHTML(
                        product.description ||
                        "No description available for this product."
                    )}

                </p>

                <p class="product-quantity">

                    <i class="fa-solid fa-box"></i>

                    Available Quantity:

                    <strong>${stock}</strong>

                </p>


                <!-- Quantity Selector -->

                <div class="product-purchase-row">

                    <div class="quantity-selector">

                        <span class="quantity-label">
                            Quantity
                        </span>

                        <div class="quantity-control">

                            <button
                                type="button"
                                class="quantity-btn"
                                data-quantity-action="decrease"
                                ${stock === 0 ? "disabled" : ""}>

                                <i class="fa-solid fa-minus"></i>

                            </button>

                            <input
                                type="number"
                                id="productQuantity"
                                value="1"
                                min="1"
                                max="${stock}"
                                ${stock === 0 ? "disabled" : ""}
                                readonly>

                            <button
                                type="button"
                                class="quantity-btn"
                                data-quantity-action="increase"
                                ${stock === 0 ? "disabled" : ""}>

                                <i class="fa-solid fa-plus"></i>

                            </button>

                        </div>

                    </div>


                    <span class="stock-status ${stock > 0 ? "in-stock" : "sold-out"}">

                        ${stock > 0 ? "In Stock" : "Sold Out"}

                    </span>

                </div>


                <!-- Product Actions -->

                <div class="product-details-actions">

                    <button
                        class="add-to-cart-btn product-details-add-btn"
                        type="button"
                        data-details-add-to-cart="${escapeHTML(product.id)}"
                        ${stock === 0 ? "disabled" : ""}>

                        <i class="fa-solid fa-cart-shopping"></i>

                        ${stock === 0 ? "Sold Out" : "Add to Cart"}

                    </button>


                    <button
                        class="favorite-toggle-btn product-details-favorite-btn ${isFavorite(product.id) ? "active" : ""}"
                        type="button"
                        data-favorite-id="${escapeHTML(product.id)}">

                        <i class="fa-solid fa-heart"></i>

                        Favorite

                    </button>

                </div>


                <!-- Back Button -->

                <button
                    class="btn-secondary product-details-back-btn"
                    type="button"
                    data-page="products">

                    <i class="fa-solid fa-arrow-left"></i>

                    Back to Products

                </button>

            </div>

        </div>


        <!-- CUSTOMER REVIEWS -->

        <div id="productReviews"></div>

    `);


    showPage("productDetails");


    // Display Reviews Below Product Details

    renderProductReviews(product.id, product.name);

}


// =====================================
// Product Details Events
// =====================================

export function initializeProductDetails() {


    // Open Product Details

    $(document).on("click", ".view-product-btn", function () {

        const productId = $(this).attr("data-product-id");

        showProductDetails(productId);

    });


    // Increase / Decrease Quantity

    $(document).on("click", "[data-quantity-action]", function () {

        const quantityInput = $("#productQuantity");

        if (!quantityInput.length) return;


        const productId = $("[data-details-add-to-cart]")
            .attr("data-details-add-to-cart");


        const product = getProducts().find(item =>

            String(item.id) === String(productId)

        );

        if (!product) return;


        const maxStock = Number(product.stock) || 0;

        let quantity = Number(quantityInput.val()) || 1;


        if ($(this).attr("data-quantity-action") === "increase") {

            quantity = Math.min(quantity + 1, maxStock);

        } else {

            quantity = Math.max(quantity - 1, 1);

        }


        quantityInput.val(quantity);

    });


    // Add Selected Quantity To Cart

    $(document).on("click", "[data-details-add-to-cart]", function () {

        const productId = $(this).attr("data-details-add-to-cart");

        const quantity = Number($("#productQuantity").val()) || 1;


        addToCart(productId, quantity);

    });

}


// =====================================
// Refresh Reviews When Language Changes
// =====================================

window.addEventListener("shopora:language-changed", function () {

    if (!currentProductId) return;

    const reviewsContainer = document.getElementById("productReviews");

    if (!reviewsContainer) return;

    renderProductReviews(currentProductId, currentProductName);

});