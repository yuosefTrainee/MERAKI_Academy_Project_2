
// =====================================
// SHOPORA - ADMIN MANAGE ORDERS
// =====================================

import { getData, saveData } from "../modules/storage.js";
import { isAdmin } from "../modules/auth.js";


// =====================================
// Variables
// =====================================

let currentPage = 1;
const ordersPerPage = 5;


// =====================================
// Helper: Escape HTML
// =====================================

function escapeHTML(value = "") {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

}


// =====================================
// Get Orders
// =====================================

function getOrders() {

    return getData("orders", []);

}


// =====================================
// Admin Permission Check
// =====================================

function hasAdminPermission() {

    if (isAdmin()) return true;

    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "Only the administrator can manage orders.",
            confirmButtonColor: "#687c45"
        });
    }

    return false;

}


// =====================================
// Format Price
// =====================================

function formatPrice(price) {

    return `${Number(price || 0).toFixed(2)} JD`;

}


// =====================================
// Format Date
// =====================================

function formatDate(date) {

    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB");

}


// =====================================
// Get Status Class
// =====================================

function getStatusClass(status) {

    const classes = {
        Pending: "pending",
        Processing: "processing",
        Shipped: "shipped",
        Delivered: "delivered",
        Cancelled: "cancelled"
    };

    return classes[status] || "pending";

}


// =====================================
// Render Admin Orders
// =====================================

export function renderAdminOrders() {

    if (!hasAdminPermission()) return;

    const container = document.getElementById("adminOrdersContainer");

    if (!container) return;

    container.innerHTML = `

        <div class="admin-orders-toolbar">

            <input
                type="text"
                id="orderSearch"
                placeholder="Search by order ID or customer..."
            >

            <select id="orderStatusFilter">

                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>

            </select>

            <select id="orderSortFilter">

                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Price</option>
                <option value="lowest">Lowest Price</option>

            </select>

        </div>

        <div id="ordersTableContainer"></div>

        <div id="ordersPagination"></div>

    `;

    initializeOrderFilters();

    displayOrders();

}


// =====================================
// Initialize Filters
// =====================================

function initializeOrderFilters() {

    if (!isAdmin()) return;

    const searchInput = document.getElementById("orderSearch");
    const statusFilter = document.getElementById("orderStatusFilter");
    const sortFilter = document.getElementById("orderSortFilter");

    searchInput.addEventListener("input", () => {

        currentPage = 1;
        displayOrders();

    });

    statusFilter.addEventListener("change", () => {

        currentPage = 1;
        displayOrders();

    });

    sortFilter.addEventListener("change", () => {

        currentPage = 1;
        displayOrders();

    });

}


// =====================================
// Filter And Sort Orders
// =====================================

function getFilteredOrders() {

    if (!isAdmin()) return [];

    const orders = getOrders();

    const searchValue = document
        .getElementById("orderSearch")
        .value.trim()
        .toLowerCase();

    const statusValue = document
        .getElementById("orderStatusFilter")
        .value;

    const sortValue = document
        .getElementById("orderSortFilter")
        .value;


    let filteredOrders = orders.filter(order => {

        const orderId = String(order.id || "").toLowerCase();

        const customerName = String(
            order.customerName || ""
        ).toLowerCase();

        const matchesSearch =
            orderId.includes(searchValue) ||
            customerName.includes(searchValue);

        const matchesStatus =
            statusValue === "all" ||
            order.status === statusValue;

        return matchesSearch && matchesStatus;

    });


    // Sorting

    if (sortValue === "newest") {

        filteredOrders.sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

    }

    else if (sortValue === "oldest") {

        filteredOrders.sort(
            (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );

    }

    else if (sortValue === "highest") {

        filteredOrders.sort(
            (a, b) => Number(b.total || 0) - Number(a.total || 0)
        );

    }

    else if (sortValue === "lowest") {

        filteredOrders.sort(
            (a, b) => Number(a.total || 0) - Number(b.total || 0)
        );

    }

    return filteredOrders;

}


// =====================================
// Display Orders
// =====================================

function displayOrders() {

    if (!isAdmin()) return;

    const tableContainer = document.getElementById("ordersTableContainer");

    const paginationContainer = document.getElementById("ordersPagination");

    if (!tableContainer || !paginationContainer) return;

    const orders = getFilteredOrders();


    // Empty State

    if (orders.length === 0) {

        tableContainer.innerHTML = `

            <div class="orders-empty-state">

                <h3>No Orders Found</h3>

                <p>There are no orders to display.</p>

            </div>

        `;

        paginationContainer.innerHTML = "";

        return;

    }


    // Pagination

    const totalPages = Math.ceil(orders.length / ordersPerPage);

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * ordersPerPage;

    const currentOrders = orders.slice(
        startIndex,
        startIndex + ordersPerPage
    );


    // Table

    tableContainer.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>

            </thead>

            <tbody>

                ${currentOrders.map(order => `

                    <tr>

                        <td>#${escapeHTML(order.id)}</td>

                        <td>${escapeHTML(order.customerName || "Unknown")}</td>

                        <td>${formatDate(order.createdAt)}</td>

                        <td>${formatPrice(order.total)}</td>

                        <td>

                            <span class="order-status ${getStatusClass(order.status)}">

                                ${escapeHTML(order.status || "Pending")}

                            </span>

                        </td>

                        <td>

                            <button
                                class="order-action-btn"
                                data-order-action="details"
                                data-order-id="${escapeHTML(order.id)}"
                            >
                                Details
                            </button>

                            <button
                                class="order-action-btn"
                                data-order-action="status"
                                data-order-id="${escapeHTML(order.id)}"
                            >
                                Update
                            </button>

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

    `;


    renderOrdersPagination(totalPages);

    initializeOrderActions();

}


// =====================================
// Pagination
// =====================================

function renderOrdersPagination(totalPages) {

    if (!isAdmin()) return;

    const container = document.getElementById("ordersPagination");

    let html = "";

    for (let page = 1; page <= totalPages; page++) {

        html += `

            <button
                class="order-page-btn ${page === currentPage ? "active" : ""}"
                data-order-page="${page}"
            >
                ${page}
            </button>

        `;

    }

    container.innerHTML = html;

    container.querySelectorAll("[data-order-page]").forEach(button => {

        button.addEventListener("click", () => {

            currentPage = Number(button.dataset.orderPage);

            displayOrders();

        });

    });

}


// =====================================
// Initialize Order Actions
// =====================================

function initializeOrderActions() {

    if (!isAdmin()) return;

    const buttons = document.querySelectorAll("[data-order-action]");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            if (!hasAdminPermission()) return;

            const orderId = button.dataset.orderId;

            const action = button.dataset.orderAction;

            if (action === "details") {

                showOrderDetails(orderId);

            }

            if (action === "status") {

                updateOrderStatus(orderId);

            }

        });

    });

}


// =====================================
// Show Order Details
// =====================================

function showOrderDetails(orderId) {

    if (!hasAdminPermission()) return;

    const order = getOrders().find(
        item => String(item.id) === String(orderId)
    );

    if (!order) return;

    const items = Array.isArray(order.items) ? order.items : [];

    const productsHTML = items.length > 0

        ? items.map(item => `

            <p>
                ${escapeHTML(item.name || item.productName || "Product")}
                × ${Number(item.quantity || 1)}
                — ${formatPrice(item.price)}
            </p>

        `).join("")

        : "<p>No product details available.</p>";


    Swal.fire({

        title: `Order #${escapeHTML(order.id)}`,

        html: `

            <div class="order-details">

                <p><strong>Customer:</strong> ${escapeHTML(order.customerName || "Unknown")}</p>

                <p><strong>Email:</strong> ${escapeHTML(order.customerEmail || "N/A")}</p>

                <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>

                <p><strong>Status:</strong> ${escapeHTML(order.status || "Pending")}</p>

                <hr>

                <h3>Products</h3>

                ${productsHTML}

                <hr>

                <h3>Total: ${formatPrice(order.total)}</h3>

            </div>

        `,

        confirmButtonText: "Close",

        confirmButtonColor: "#687c45"

    });

}


// =====================================
// Update Order Status
// =====================================

function updateOrderStatus(orderId) {

    if (!hasAdminPermission()) return;

    const orders = getOrders();

    const order = orders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order) return;

    Swal.fire({

        title: "Update Order Status",

        input: "select",

        inputOptions: {

            Pending: "Pending",
            Processing: "Processing",
            Shipped: "Shipped",
            Delivered: "Delivered",
            Cancelled: "Cancelled"

        },

        inputValue: order.status || "Pending",

        showCancelButton: true,

        confirmButtonText: "Save",

        cancelButtonText: "Cancel",

        confirmButtonColor: "#687c45",

        inputValidator: value => {

            if (!value) {
                return "Please select a status!";
            }

        }

    }).then(result => {

        if (!result.isConfirmed) return;

        // Verify permission again before saving the status change.

        if (!isAdmin()) {
            hasAdminPermission();
            return;
        }

        order.status = result.value;

        const saved = saveData("orders", orders);

        if (saved) {

            Swal.fire({

                icon: "success",
                title: "Updated!",
                text: "Order status updated successfully.",
                confirmButtonColor: "#687c45"

            });

            displayOrders();

        }

        else {

            Swal.fire({

                icon: "error",
                title: "Error",
                text: "Could not update order status."

            });

        }

    });

}
