// Import Modules

import { categories } from "./data/categories.js";

import { showPage } from "./modules/navigation.js";


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

    handleCategoryClick();

}


// Run Application

$(document).ready(function () {

    initApp();

});