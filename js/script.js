// Import Modules

import { categories } from "./data/categories.js";

import { showPage } from "./modules/navigation.js";

import {initializeProductForm} from "./modules/productUpload.js";

// ================================
// Render Categories
// ================================

// Render Categories

function renderCategories() {

    const categoriesContainer = $("#categoriesContainer");
    const categoryFilter = $("#categoryFilter");

    categoriesContainer.empty();

    // Reset category filter
    categoryFilter.empty();

    categoryFilter.append(`
        <option value="all">All Categories</option>
    `);

    categories.forEach(function (category) {

        // Create Category Card
        const categoryCard = `
            <div class="category-card"
                 data-category="${category.name}">

                <i class="${category.icon}"></i>

                <h3>${category.name}</h3>

            </div>
        `;

        categoriesContainer.append(categoryCard);


        // Add Category To Filter
        const option = $("<option>", {
            value: category.name,
            text: category.name
        });

        categoryFilter.append(option);

    });

}


// ================================
// Navigation Events
// ================================

function handleNavigation() {

    $(document).on("click", "[data-page]", function (event) {

        event.preventDefault();

        const pageId = $(this).data("page");

        showPage(pageId);

    });

}


// ================================
// Category Events
// ================================

function handleCategoryClick() {

    $(document).on("click", ".category-card", function () {

        const categoryName = $(this).data("category");

        showPage("products");

        $("#categoryFilter").val(categoryName);

    });

}


// ================================
// Initialize Application
// ================================

function initApp() {

    console.log("Shopora Application Started!");

    renderCategories();

    handleNavigation();

    handleAdminNavigation();

    handleCategoryClick();

    initializeProductForm();

}


// Run Application

$(document).ready(function () {

    initApp();

});


function handleAdminNavigation() {
    const adminPages = {
        overview: "#adminOverview",
        products: "#adminProducts",
        orders: "#adminOrders",
        users: "#adminUsers",
        reviews: "#adminReviews"
    };

    $(document).on("click", "[data-admin-page]", function () {
        const page = $(this).data("admin-page");

        // Hide all admin sections
        $(".admin-section").addClass("hidden");

        // Show selected section
        const selectedSection = adminPages[page];

        if (selectedSection) {
            $(selectedSection).removeClass("hidden");
        } else {
            console.error("Admin section not found:", page);
        }

        console.log("Admin page:", page);
    });
}
