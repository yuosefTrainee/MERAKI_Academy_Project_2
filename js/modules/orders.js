// =====================================
// SHOPORA - CUSTOMER ORDERS
// =====================================

import { getData } from "./storage.js";
import { getCurrentUser } from "./auth.js";


// =====================================
// Helper Functions
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


function formatPrice(price) {

    return `${Number(price || 0).toFixed(2)} JD`;

}


function formatDate(date) {

    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB");

}


// =====================================
// Get Customer Orders
// =====================================

export function getCustomerOrders() {

    const user = getCurrentUser();

    if (!user) return [];

    const orders = getData("orders", []);

    return orders.filter(order =>

        String(order.userId || order.customerId) === String(user.id) ||

        (
            order.customerEmail &&
            order.customerEmail.toLowerCase() === user.email.toLowerCase()
        )

    ).sort((a, b) =>

        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)

    );

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
// Render Customer Orders
// =====================================

export function renderCustomerOrders() {

    const container = document.getElementById("ordersContainer");

    if (!container) return;

    const user = getCurrentUser();

    if (!user || user.role !== "customer") {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-lock"></i>

                <h3>Login Required</h3>

                <p>Please login to view your orders.</p>

            </div>
        `;

        return;

    }

    const orders = getCustomerOrders();

    if (orders.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-box-open"></i>

                <h3>No Orders Yet</h3>

                <p>Your orders will appear here after checkout.</p>

            </div>
        `;

        return;

    }

    container.innerHTML = `

        <div class="customer-orders-list">

            ${orders.map(order => `

                <div class="customer-order-card">

                    <div class="customer-order-header">

                        <div>

                            <h3>
                                <span>Order #</span>${escapeHTML(order.id)}
                            </h3>

                            <p>
                                ${formatDate(order.createdAt)}
                            </p>

                        </div>

                        <span class="order-status ${getStatusClass(order.status)}">
                            ${escapeHTML(order.status || "Pending")}
                        </span>

                    </div>


                    <div class="customer-order-info">

                        <span>

                            <i class="fa-solid fa-box"></i>

                            ${Array.isArray(order.items) ? order.items.length : 0}

                            <span>Products</span>

                        </span>

                        <strong>
                            ${formatPrice(order.total)}
                        </strong>

                    </div>


                    <button
                        type="button"
                        class="btn-secondary customer-order-details-btn"
                        data-customer-order-details="${escapeHTML(order.id)}">

                        <i class="fa-solid fa-eye"></i>

                        View Details

                    </button>

                </div>

            `).join("")}

        </div>

    `;

}


// =====================================
// Show Order Details
// =====================================

function showCustomerOrderDetails(orderId) {

    const order = getCustomerOrders().find(item =>

        String(item.id) === String(orderId)

    );

    if (!order) return;

    const items = Array.isArray(order.items) ? order.items : [];

    const productsHTML = items.length

        ? items.map(item => `

            <div class="customer-order-product">

                <span>

                    ${escapeHTML(item.name || item.productName || "Product")}

                    × ${Number(item.quantity || 1)}

                </span>

                <strong>

                    ${formatPrice(
                        Number(item.price || 0) * Number(item.quantity || 1)
                    )}

                </strong>

            </div>

        `).join("")

        : "<p>No product details available.</p>";


    Swal.fire({

        title: `
            <span>Order #</span>${escapeHTML(order.id)}
        `,

        html: `

            <div class="customer-order-details">

                <p>

                    <strong>Date:</strong>

                    ${formatDate(order.createdAt)}

                </p>


                <p>

                    <strong>Status:</strong>

                    ${escapeHTML(order.status || "Pending")}

                </p>


                <hr>


                <h3>Products</h3>

                ${productsHTML}


                <hr>


                <h3>

                    <span>Total:</span>

                    ${formatPrice(order.total)}

                </h3>

            </div>

        `,

        confirmButtonText: "Close",

        confirmButtonColor: "#687c45"

    });

}


// =====================================
// Initialize Customer Orders
// =====================================

export function initializeCustomerOrders() {

    document.addEventListener("click", function (event) {

        const button = event.target.closest(
            "[data-customer-order-details]"
        );

        if (!button) return;

        showCustomerOrderDetails(
            button.dataset.customerOrderDetails
        );

    });

}