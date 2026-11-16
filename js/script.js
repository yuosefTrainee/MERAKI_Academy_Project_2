
// =====================================
// Import Modules
// =====================================

import { categories } from "./data/categories.js";

import { showPage } from "./modules/navigation.js";

import { initializeProductForm } from "./modules/productUpload.js";

import { renderDashboard } from "./admin/dashboard.js";

import {
    renderAdminProducts,
    initializeProductFilters
} from "./admin/manageProducts.js";

import { renderAdminOrders } from "./admin/manageOrders.js";

import { renderAdminUsers } from "./admin/manageUsers.js";

import { renderAdminReviews } from "./admin/manageReviews.js";

import {
    initializeUsers,
    registerCustomer,
    loginUser,
    getCurrentUser,
    updateUserProfile,
    logoutUser,
    isAdmin
} from "./modules/auth.js";

// Customer Products

import {
    renderFeaturedProducts,
    renderCustomerProducts,
    initializeCustomerProductFilters,
    initializeProductDetails
} from "./modules/customerProducts.js";

// Favorites

import {
    initializeFavorites,
    renderFavorites
} from "./modules/favorites.js";

// Cart

import {
    initializeCart,
    renderCart,
    updateCartCount
} from "./modules/cart.js";

// Customer Orders

import {
    initializeCustomerOrders,
    renderCustomerOrders
} from "./modules/orders.js";

// Checkout

import {
    initializeCheckout,
    renderCheckout
} from "./modules/checkout.js";

import { initializePayment } from "./modules/payment.js";
// =====================================
// Render Categories
// =====================================

function renderCategories() {

    const categoriesContainer = $("#categoriesContainer");
    const categoryFilter = $("#categoryFilter");

    categoriesContainer.empty();

    categoryFilter.empty();

    categoryFilter.append(`
        <option value="all">All Categories</option>
    `);

    categories.forEach(function (category) {

        const categoryCard = `
            <div class="category-card"
                 data-category="${category.name}">

                <i class="${category.icon}"></i>

                <h3>${category.name}</h3>

            </div>
        `;

        categoriesContainer.append(categoryCard);

        const option = $("<option>", {
            value: category.name,
            text: category.name
        });

        categoryFilter.append(option);

    });

}


// =====================================
// Update Navbar
// =====================================

function updateNavbar() {

    const user = getCurrentUser();

    // Remove Previous Customer Logout Button

    $("#customerLogout").remove();


    if (user) {

        $("#authButton")
            .text(user.name)
            .attr("data-page", "profile");


        // Show Logout Button For Customers Only

        if (user.role === "customer") {

            $("#authButton").after(`
                <button id="customerLogout" class="customer-logout-btn">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Logout
                </button>
            `);

        }

    } else {

        $("#authButton")
            .text("Login")
            .attr("data-page", "login");

    }

}


// =====================================
// Restore User Session
// =====================================

function restoreUserSession() {

    const user = getCurrentUser();

    if (!user) {

        showPage("home");

        updateNavbar();

        updateCartCount();

        return;

    }

    updateNavbar();

    updateCartCount();

    if (user.role === "admin" && isAdmin()) {

        showPage("adminDashboard");

        renderDashboard();

    } else {

        showPage("home");

    }

}


// =====================================
// Navigation Events
// =====================================

function handleNavigation() {

    $(document).on("click", "[data-page]", function (event) {

        event.preventDefault();

        const pageId = $(this).data("page");

        const user = getCurrentUser();


        // Protect Profile

        if (pageId === "profile" && !user) {

            showPage("login");

            return;

        }


        // Protect Customer Orders

        if (pageId === "orders") {

            if (!user || user.role !== "customer") {

                showPage("login");

                return;

            }

        }


        showPage(pageId);


        // Load Profile

        if (pageId === "profile") {

            loadProfile();

        }


        // Load Customer Products

        if (pageId === "products") {

            renderCustomerProducts();

        }


        // Load Featured Products

        if (pageId === "home") {

            renderFeaturedProducts();

        }


        // Load Favorites

        if (pageId === "favorites") {

            renderFavorites();

        }


        // Load Cart

        if (pageId === "cart") {

            renderCart();

        }


        // Load Customer Orders

        if (pageId === "orders") {

            renderCustomerOrders();

        }

    });

}


// =====================================
// Category Events
// =====================================

function handleCategoryClick() {

    $(document).on("click", ".category-card", function () {

        const categoryName = $(this).data("category");

        showPage("products");

        $("#categoryFilter").val(categoryName);

        renderCustomerProducts();

    });

}


// =====================================
// Admin Navigation
// =====================================

function handleAdminNavigation() {

    const adminPages = {

        overview: "#adminOverview",
        products: "#adminProducts",
        orders: "#adminOrders",
        users: "#adminUsers",
        reviews: "#adminReviews"

    };


    $(document).on("click", "[data-admin-page]", function () {

        // Check Admin Permission

        if (!isAdmin()) {

            showPage("home");

            return;

        }


        const page = $(this).data("admin-page");


        // Hide All Admin Sections

        $(".admin-section").addClass("hidden");


        const selectedSection = adminPages[page];


        if (selectedSection) {

            $(selectedSection).removeClass("hidden");


            // Load Dashboard

            if (page === "overview") {

                renderDashboard();

            }


            // Load Products

            if (page === "products") {

                renderAdminProducts();

            }


            // Load Orders

            if (page === "orders") {

                renderAdminOrders();

            }


            // Load Customers

            if (page === "users") {

                renderAdminUsers();

            }


            // Load Reviews

            if (page === "reviews") {

                renderAdminReviews();

            }

        } else {

            console.error("Admin section not found:", page);

        }

    });

}


// =====================================
// Register
// =====================================

function handleRegister() {

    $("#registerForm").on("submit", function (event) {

        event.preventDefault();

        const name = $("#registerName").val().trim();

        const email = $("#registerEmail").val().trim();

        const password = $("#registerPassword").val();


        const result = registerCustomer(
            name,
            email,
            password
        );


        if (!result.success) {

            return;

        }


        this.reset();

        showPage("login");

    });

}


// =====================================
// Login
// =====================================

function handleLogin() {

    $("#loginForm").on("submit", function (event) {

        event.preventDefault();

        const email = $("#loginEmail").val().trim();

        const password = $("#loginPassword").val();


        const result = loginUser(email, password);


        if (!result.success) {

            $("#loginMessage")
                .text(result.message)
                .removeClass("hidden");

            return;

        }


        // Update Navbar

        updateNavbar();

        updateCartCount();


        // Hide Error Message

        $("#loginMessage")
            .addClass("hidden")
            .text("");


        this.reset();


        // Redirect Based On Role

        if (result.user.role === "admin") {

            showPage("adminDashboard");

            renderDashboard();

        } else {

            showPage("home");

            renderFeaturedProducts();

        }

    });

}


// =====================================
// Load Profile
// =====================================

function loadProfile() {

    const user = getCurrentUser();


    if (!user) {

        showPage("login");

        return;

    }


    $("#profileName").text(user.name);

    $("#profileRole").text(
        user.role === "admin"
            ? "Administrator"
            : "Customer"
    );

    $("#profileFullName").val(user.name);

    $("#profileEmail").val(user.email);

    $("#profilePassword").val("");

}


// =====================================
// Profile Update
// =====================================

function handleProfileUpdate() {

    $("#profileForm").on("submit", function (event) {

        event.preventDefault();

        const name = $("#profileFullName").val().trim();

        const password = $("#profilePassword").val();


        if (!name) {

            showProfileMessage(
                "Name is required!",
                "error"
            );

            return;

        }


        if (password !== "" && password.length < 6) {

            showProfileMessage(
                "Password must be at least 6 characters!",
                "error"
            );

            return;

        }


        const updated = updateUserProfile(
            name,
            password
        );


        if (updated) {

            loadProfile();

            updateNavbar();

            showProfileMessage(
                "Profile updated successfully!",
                "success"
            );

        } else {

            showProfileMessage(
                "Something went wrong. Please try again!",
                "error"
            );

        }

    });

}


// =====================================
// Profile Messages
// =====================================

function showProfileMessage(message, type) {

    $("#profileMessage")
        .removeClass("hidden error success")
        .addClass(type)
        .text(message);

}


// =====================================
// Logout
// =====================================

function handleLogout() {

    // Admin Logout

    $("#adminLogout").on("click", function () {

        if (!isAdmin()) {

            return;

        }

        logoutUser();

        updateNavbar();

        updateCartCount();

        showPage("home");

    });


    // Customer Logout

    $(document).on("click", "#customerLogout", function () {

        const user = getCurrentUser();

        if (!user || user.role !== "customer") {

            return;

        }

        logoutUser();

        updateNavbar();

        updateCartCount();

        showPage("home");

    });

}


// =====================================
// Initialize Application
// =====================================

function initApp() {

    console.log("Shopora App Started");


    // Initialize Users

    initializeUsers();


    // Render Categories

    renderCategories();


    // Initialize Navigation Events

    handleNavigation();

    handleCategoryClick();

    handleAdminNavigation();


    // Initialize Product Form

    initializeProductForm();


    // Initialize Customer Products

    initializeCustomerProductFilters();

    initializeProductDetails();


    // Initialize Favorites

    initializeFavorites();


    // Initialize Cart

    initializeCart();
    // Initialize Checkout

initializeCheckout();

initializePayment();

    updateCartCount();


    // Initialize Customer Orders

    initializeCustomerOrders();


    // Initialize Profile

    handleProfileUpdate();


    // Initialize Register

    handleRegister();


    // Initialize Admin Product Search and Filters

    initializeProductFilters();


    // Initialize Login

    handleLogin();


    // Initialize Logout

    handleLogout();


    // Render Customer Products

    renderFeaturedProducts();

    renderCustomerProducts();


    // Restore Previous Session

    restoreUserSession();

}


// =====================================
// Run Application
// =====================================

$(document).ready(function () {

    initApp();

});


// =====================================
// SHOPORA - DARK / LIGHT MODE
// =====================================

$(document).ready(function () {

    const themeToggle = $("#themeToggle");

    // Apply Theme

    function applyTheme(theme) {

        document.documentElement.setAttribute("data-theme", theme);

        if (theme === "dark") {

            themeToggle.html('<i class="fa-solid fa-sun"></i>');

            themeToggle.attr("aria-label", "Switch to light mode");

            themeToggle.attr("title", "Light Mode");

        } else {

            themeToggle.html('<i class="fa-solid fa-moon"></i>');

            themeToggle.attr("aria-label", "Switch to dark mode");

            themeToggle.attr("title", "Dark Mode");

        }

    }


    // Get Saved Theme

    const savedTheme = localStorage.getItem("shopora-theme") || "light";


    // Apply Saved Theme

    applyTheme(savedTheme);


    // Toggle Theme

    themeToggle.on("click", function () {

        const currentTheme = document.documentElement.getAttribute("data-theme");

        const newTheme = currentTheme === "dark" ? "light" : "dark";


        // Apply New Theme

        applyTheme(newTheme);


        // Save Theme

        localStorage.setItem("shopora-theme", newTheme);

    });

});
