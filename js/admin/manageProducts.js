
// ================= IMPORTS =================

import {
    getProducts,
    deleteProduct
} from "../modules/products.js";

import { isAdmin } from "../modules/auth.js";

import {
    getImage,
    deleteImage
} from "../modules/database.js";


// ================= VARIABLES =================

let productImageURLs = [];

let currentPage = 1;

const productsPerPage = 5;


// ================= FILTER PRODUCTS =================

function filterProducts(products) {

    const searchValue = ($("#adminProductSearch").val() || "")
        .toLowerCase()
        .trim();

    const categoryValue = $("#adminCategoryFilter").val() || "all";

    const stockValue = $("#adminStockFilter").val() || "all";


    return products.filter(product => {

        // Search by name or brand

        const productName = (product.name || "").toLowerCase();

        const productBrand = (product.brand || "").toLowerCase();

        const matchesSearch =
            productName.includes(searchValue) ||
            productBrand.includes(searchValue);


        // Filter by category

        const matchesCategory =
            categoryValue === "all" ||
            product.category === categoryValue;


        // Filter by stock

        let matchesStock = true;

        if (stockValue === "in-stock") {

            matchesStock = Number(product.stock) > 5;

        }

        else if (stockValue === "low-stock") {

            matchesStock =
                Number(product.stock) > 0 &&
                Number(product.stock) <= 5;

        }

        else if (stockValue === "sold-out") {

            matchesStock = Number(product.stock) === 0;

        }


        return matchesSearch && matchesCategory && matchesStock;

    });

}


// ================= SORT PRODUCTS =================

function sortProducts(products) {

    const sortValue = $("#adminSortFilter").val() || "default";

    const sortedProducts = [...products];


    switch (sortValue) {

        // Default Sorting

        case "default":

            return sortedProducts;


        // Name: A to Z

        case "name-asc":

            return sortedProducts.sort((a, b) => {

                return (a.name || "").localeCompare(
                    b.name || ""
                );

            });


        // Name: Z to A

        case "name-desc":

            return sortedProducts.sort((a, b) => {

                return (b.name || "").localeCompare(
                    a.name || ""
                );

            });


        // Price: Low to High

        case "price-asc":

            return sortedProducts.sort((a, b) => {

                return Number(a.price) - Number(b.price);

            });


        // Price: High to Low

        case "price-desc":

            return sortedProducts.sort((a, b) => {

                return Number(b.price) - Number(a.price);

            });


        // Newest First

        case "newest":

            return sortedProducts.sort((a, b) => {

                const dateA = new Date(a.createdAt || 0).getTime();

                const dateB = new Date(b.createdAt || 0).getTime();

                return dateB - dateA;

            });


        // Oldest First

        case "oldest":

            return sortedProducts.sort((a, b) => {

                const dateA = new Date(a.createdAt || 0).getTime();

                const dateB = new Date(b.createdAt || 0).getTime();

                return dateA - dateB;

            });


        default:

            return sortedProducts;

    }

}


// ================= RENDER PAGINATION =================

function renderPagination(totalPages) {

    const pagination = $("#adminPagination");

    pagination.empty();


    // Hide pagination if only one page

    if (totalPages <= 1) {

        return;

    }


    // Previous Button

    const previousButton = $(`
        <button
            type="button"
            class="pagination-btn"
            id="previousPage"
            ${currentPage === 1 ? "disabled" : ""}>

            <i class="fa-solid fa-chevron-left"></i>
            Previous

        </button>
    `);


    pagination.append(previousButton);


    // Page Numbers Container

    const numbersContainer = $(`
        <div class="pagination-numbers"></div>
    `);


    // Create Page Numbers

    for (let i = 1; i <= totalPages; i++) {

        const pageButton = $(`
            <button
                type="button"
                class="pagination-number ${currentPage === i ? "active" : ""}"
                data-pagination-page="${i}">

                ${i}

            </button>
        `);


        numbersContainer.append(pageButton);

    }


    pagination.append(numbersContainer);


    // Next Button

    const nextButton = $(`
        <button
            type="button"
            class="pagination-btn"
            id="nextPage"
            ${currentPage === totalPages ? "disabled" : ""}>

            Next
            <i class="fa-solid fa-chevron-right"></i>

        </button>
    `);


    pagination.append(nextButton);


    // Previous Event

    $("#previousPage").on("click", function () {

        if (currentPage > 1) {

            currentPage--;

            renderAdminProducts();

        }

    });


    // Next Event

    $("#nextPage").on("click", function () {

        if (currentPage < totalPages) {

            currentPage++;

            renderAdminProducts();

        }

    });


    // Page Number Events

    pagination.find(".pagination-number").on("click", function () {

        currentPage = Number(
            $(this).attr("data-pagination-page")
        );

        renderAdminProducts();

    });

}


// ================= DISPLAY PRODUCTS =================

export async function renderAdminProducts() {

    const container = $("#adminProductsContainer");
    const pagination = $("#adminPagination");

    // Only the administrator can access product management.

    if (!isAdmin()) {

        container.empty().html(`
            <div class="empty-state">

                <i class="fa-solid fa-lock"></i>

                <h3>Access Denied</h3>

                <p>Only the administrator can manage products.</p>

            </div>
        `);

        pagination.empty();

        return;

    }


    const products = getProducts();


    // Apply Filters

    const filteredProducts = filterProducts(products);


    // Apply Sorting

    const sortedProducts = sortProducts(filteredProducts);


    // Clean Previous Image URLs

    productImageURLs.forEach(url => {

        URL.revokeObjectURL(url);

    });

    productImageURLs = [];

    container.empty();

    pagination.empty();


    // No Products

    if (products.length === 0) {

        currentPage = 1;

        container.html(`
            <div class="empty-state">

                <i class="fa-solid fa-box-open"></i>

                <h3>No Products Found</h3>

                <p>Start by adding your first product.</p>

            </div>
        `);

        return;

    }


    // No Search Results

    if (sortedProducts.length === 0) {

        currentPage = 1;

        container.html(`
            <div class="empty-state">

                <i class="fa-solid fa-magnifying-glass"></i>

                <h3>No Matching Products</h3>

                <p>Try changing your search or filters.</p>

            </div>
        `);

        return;

    }


    // Calculate Total Pages

    const totalPages = Math.ceil(
        sortedProducts.length / productsPerPage
    );


    // Make Sure Current Page Is Valid

    if (currentPage > totalPages) {

        currentPage = totalPages;

    }


    // Calculate Products For Current Page

    const startIndex = (currentPage - 1) * productsPerPage;

    const endIndex = startIndex + productsPerPage;

    const currentProducts = sortedProducts.slice(
        startIndex,
        endIndex
    );


    // Create Table

    const table = $(`
        <div class="table-container">

            <table class="admin-table">

                <thead>

                    <tr>

                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Brand</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody id="productsTableBody"></tbody>

            </table>

        </div>
    `);


    const tbody = table.find("#productsTableBody");


    // Loop Through Current Page Products

    for (const product of currentProducts) {

        let stockStatus;

        let statusClass;


        // Stock Status

        if (Number(product.stock) === 0) {

            stockStatus = "Sold Out";

            statusClass = "sold-out";

        }

        else if (Number(product.stock) <= 5) {

            stockStatus = "Low Stock";

            statusClass = "low-stock";

        }

        else {

            stockStatus = "In Stock";

            statusClass = "in-stock";

        }


        // Create Row

        const row = $("<tr></tr>");


        // Product Image

        const image = $("<img>", {

            alt: product.name,

            class: "admin-product-image"

        });


        image.attr("src", "images/logo/logo.png");


        if (product.imageId) {

            try {

                const imageBlob = await getImage(product.imageId);

                if (imageBlob) {

                    const imageURL = URL.createObjectURL(imageBlob);

                    productImageURLs.push(imageURL);

                    image.attr("src", imageURL);

                }

            }

            catch (error) {

                console.error("Image loading error:", error);

            }

        }


        const imageCell = $("<td></td>");

        imageCell.append(image);

        row.append(imageCell);


        // Product Information

        $("<td></td>")
            .text(product.name)
            .appendTo(row);


        $("<td></td>")
            .text(product.category)
            .appendTo(row);


        $("<td></td>")
            .text(product.brand)
            .appendTo(row);


        $("<td></td>")
            .text(`$${Number(product.price).toFixed(2)}`)
            .appendTo(row);


        $("<td></td>")
            .text(product.stock)
            .appendTo(row);


        // Stock Badge

        row.append(`
            <td>

                <span class="stock-badge ${statusClass}">

                    ${stockStatus}

                </span>

            </td>
        `);


        // Actions

        row.append(`
            <td>

                <button
                    type="button"
                    class="btn-edit"
                    data-id="${product.id}"
                    title="Edit Product">

                    <i class="fa-solid fa-pen"></i>

                </button>

                <button
                    type="button"
                    class="btn-delete"
                    data-id="${product.id}"
                    title="Delete Product">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>
        `);


        tbody.append(row);

    }


    container.append(table);


    // Render Pagination

    renderPagination(totalPages);


    // ================= DELETE PRODUCT =================

    container.find(".btn-delete").on("click", async function () {

        // Recheck permission at the moment the action is performed.

        if (!isAdmin()) {

            await Swal.fire({

                icon: "error",

                title: "Access Denied",

                text: "Only the administrator can delete products.",

                confirmButtonColor: "#687c45"

            });

            return;

        }


        const productId = $(this).attr("data-id");


        const product = products.find(

            item => String(item.id) === String(productId)

        );


        if (!product) return;


        const result = await Swal.fire({

            title: "Delete Product?",

            text: "This product will be permanently deleted.",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "Yes, Delete",

            cancelButtonText: "Cancel",

            confirmButtonColor: "#dc2626",

            cancelButtonColor: "#687c45"

        });


        if (!result.isConfirmed) return;


        try {

            const deleted = deleteProduct(product.id);


            if (!deleted) {

                throw new Error("Could not delete product.");

            }


            // Delete Image From IndexedDB

            if (product.imageId) {

                await deleteImage(product.imageId);

            }


            // Refresh Products

            await renderAdminProducts();


            Swal.fire({

                icon: "success",

                title: "Deleted!",

                text: "Product has been deleted successfully.",

                confirmButtonColor: "#687c45"

            });

        }

        catch (error) {

            console.error("Delete Error:", error);


            Swal.fire({

                icon: "error",

                title: "Delete Failed",

                text: "Could not delete this product.",

                confirmButtonColor: "#687c45"

            });

        }

    });

}


// ================= INITIALIZE FILTERS AND SORTING =================

export function initializeProductFilters() {

    if (!isAdmin()) {

        return;

    }


    // Search

    $("#adminProductSearch").on("input", function () {

        currentPage = 1;

        renderAdminProducts();

    });


    // Category Filter

    $("#adminCategoryFilter").on("change", function () {

        currentPage = 1;

        renderAdminProducts();

    });


    // Stock Filter

    $("#adminStockFilter").on("change", function () {

        currentPage = 1;

        renderAdminProducts();

    });


    // Sorting

    $("#adminSortFilter").on("change", function () {

        currentPage = 1;

        renderAdminProducts();

    });

}
