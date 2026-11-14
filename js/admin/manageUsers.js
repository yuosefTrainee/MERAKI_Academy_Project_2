
// =====================================
// SHOPORA - ADMIN MANAGE CUSTOMERS
// =====================================

import { getData, saveData } from "../modules/storage.js";
import { isAdmin } from "../modules/auth.js";


// =====================================
// Variables
// =====================================

let currentPage = 1;

const usersPerPage = 5;


// =====================================
// Escape HTML
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
// Admin Permission Check
// =====================================

function hasAdminPermission() {

    if (isAdmin()) return true;

    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "Only the administrator can manage customers.",
            confirmButtonColor: "#687c45"
        });
    }

    return false;

}


// =====================================
// Get Customers
// =====================================

function getCustomers() {

    const users = getData("users", []);

    return users.filter(user => user.role === "customer");

}


// =====================================
// Get Customer Orders Count
// =====================================

function getCustomerOrdersCount(customer) {

    const orders = getData("orders", []);

    return orders.filter(order =>

        order.userId === customer.id ||
        order.customerId === customer.id ||
        order.customerEmail === customer.email

    ).length;

}


// =====================================
// Render Customers
// =====================================

export function renderAdminUsers() {

    const container = document.getElementById("adminUsersContainer");

    if (!container) return;

    if (!hasAdminPermission()) {

        container.innerHTML = `
            <div class="customers-empty-state">
                <h3>Access Denied</h3>
                <p>Only the administrator can manage customers.</p>
            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="admin-users-toolbar">

            <input
                type="text"
                id="customerSearch"
                placeholder="Search by name or email..."
            >

            <select id="customerSortFilter">

                <option value="nameAsc">Name: A - Z</option>

                <option value="nameDesc">Name: Z - A</option>

                <option value="ordersHigh">Most Orders</option>

                <option value="ordersLow">Least Orders</option>

            </select>

        </div>


        <div id="customersTableContainer"></div>

        <div id="customersPagination"></div>

    `;


    initializeCustomerFilters();

    displayCustomers();

}


// =====================================
// Initialize Filters
// =====================================

function initializeCustomerFilters() {

    if (!isAdmin()) return;

    const searchInput = document.getElementById("customerSearch");

    const sortFilter = document.getElementById("customerSortFilter");


    searchInput.addEventListener("input", function () {

        currentPage = 1;

        displayCustomers();

    });


    sortFilter.addEventListener("change", function () {

        currentPage = 1;

        displayCustomers();

    });

}


// =====================================
// Filter And Sort Customers
// =====================================

function getFilteredCustomers() {

    if (!isAdmin()) return [];

    const customers = getCustomers();

    const searchValue = document
        .getElementById("customerSearch")
        .value.trim()
        .toLowerCase();

    const sortValue = document
        .getElementById("customerSortFilter")
        .value;


    let filteredCustomers = customers.filter(customer => {

        const name = String(customer.name || "").toLowerCase();

        const email = String(customer.email || "").toLowerCase();

        return name.includes(searchValue) ||
               email.includes(searchValue);

    });


    // Sorting

    if (sortValue === "nameAsc") {

        filteredCustomers.sort((a, b) =>
            String(a.name).localeCompare(String(b.name))
        );

    }

    else if (sortValue === "nameDesc") {

        filteredCustomers.sort((a, b) =>
            String(b.name).localeCompare(String(a.name))
        );

    }

    else if (sortValue === "ordersHigh") {

        filteredCustomers.sort((a, b) =>
            getCustomerOrdersCount(b) - getCustomerOrdersCount(a)
        );

    }

    else if (sortValue === "ordersLow") {

        filteredCustomers.sort((a, b) =>
            getCustomerOrdersCount(a) - getCustomerOrdersCount(b)
        );

    }


    return filteredCustomers;

}


// =====================================
// Display Customers
// =====================================

function displayCustomers() {

    if (!isAdmin()) return;

    const tableContainer = document.getElementById("customersTableContainer");

    const paginationContainer = document.getElementById("customersPagination");

    if (!tableContainer || !paginationContainer) return;


    const customers = getFilteredCustomers();


    // Empty State

    if (customers.length === 0) {

        tableContainer.innerHTML = `

            <div class="customers-empty-state">

                <h3>No Customers Found</h3>

                <p>There are no registered customers to display.</p>

            </div>

        `;

        paginationContainer.innerHTML = "";

        return;

    }


    // Pagination

    const totalPages = Math.ceil(customers.length / usersPerPage);

    if (currentPage > totalPages) {

        currentPage = totalPages;

    }


    const startIndex = (currentPage - 1) * usersPerPage;

    const currentCustomers = customers.slice(
        startIndex,
        startIndex + usersPerPage
    );


    // Customers Table

    tableContainer.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>Customer</th>

                    <th>Email</th>

                    <th>Total Orders</th>

                    <th>Role</th>

                    <th>Actions</th>

                </tr>

            </thead>


            <tbody>

                ${currentCustomers.map(customer => `

                    <tr>

                        <td>

                            <div class="customer-name">

                                <div class="customer-avatar">

                                    ${escapeHTML(
                                        String(customer.name || "?")
                                            .charAt(0)
                                            .toUpperCase()
                                    )}

                                </div>

                                <span>
                                    ${escapeHTML(customer.name || "Unknown")}
                                </span>

                            </div>

                        </td>


                        <td>
                            ${escapeHTML(customer.email || "N/A")}
                        </td>


                        <td>
                            <span class="customer-orders-count">
                                ${getCustomerOrdersCount(customer)}
                            </span>
                        </td>


                        <td>

                            <span class="customer-role">
                                Customer
                            </span>

                        </td>


                        <td>

                            <button
                                class="customer-action-btn details-btn"
                                data-customer-action="details"
                                data-customer-id="${escapeHTML(customer.id)}"
                            >
                                Details
                            </button>


                            <button
                                class="customer-action-btn delete-btn"
                                data-customer-action="delete"
                                data-customer-id="${escapeHTML(customer.id)}"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

    `;


    renderCustomersPagination(totalPages);

    initializeCustomerActions();

}


// =====================================
// Pagination
// =====================================

function renderCustomersPagination(totalPages) {

    if (!isAdmin()) return;

    const container = document.getElementById("customersPagination");

    let html = "";


    for (let page = 1; page <= totalPages; page++) {

        html += `

            <button

                class="customer-page-btn ${page === currentPage ? "active" : ""}"

                data-customer-page="${page}"

            >

                ${page}

            </button>

        `;

    }


    container.innerHTML = html;


    container.querySelectorAll("[data-customer-page]").forEach(button => {

        button.addEventListener("click", function () {

            currentPage = Number(this.dataset.customerPage);

            displayCustomers();

        });

    });

}


// =====================================
// Customer Actions
// =====================================

function initializeCustomerActions() {

    if (!isAdmin()) return;

    const buttons = document.querySelectorAll("[data-customer-action]");


    buttons.forEach(button => {

        button.addEventListener("click", function () {

            if (!hasAdminPermission()) return;

            const customerId = this.dataset.customerId;

            const action = this.dataset.customerAction;


            if (action === "details") {

                showCustomerDetails(customerId);

            }


            if (action === "delete") {

                deleteCustomer(customerId);

            }

        });

    });

}


// =====================================
// Show Customer Details
// =====================================

function showCustomerDetails(customerId) {

    if (!hasAdminPermission()) return;

    const customer = getCustomers().find(user =>

        String(user.id) === String(customerId)

    );


    if (!customer) return;


    const ordersCount = getCustomerOrdersCount(customer);


    Swal.fire({

        title: "Customer Details",

        html: `

            <div class="customer-details">

                <p>
                    <strong>Name:</strong>
                    ${escapeHTML(customer.name)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(customer.email)}
                </p>

                <p>
                    <strong>Role:</strong>
                    Customer
                </p>

                <p>
                    <strong>Total Orders:</strong>
                    ${ordersCount}
                </p>

            </div>

        `,

        confirmButtonText: "Close",

        confirmButtonColor: "#687c45"

    });

}


// =====================================
// Delete Customer
// =====================================

function deleteCustomer(customerId) {

    if (!hasAdminPermission()) return;


    const users = getData("users", []);


    const customer = users.find(user =>

        String(user.id) === String(customerId) &&
        user.role === "customer"

    );


    if (!customer) return;


    Swal.fire({

        title: "Delete Customer?",

        text: `Are you sure you want to delete ${customer.name}?`,

        icon: "warning",

        showCancelButton: true,

        confirmButtonText: "Yes, Delete",

        cancelButtonText: "Cancel",

        confirmButtonColor: "#dc3545",

        cancelButtonColor: "#687c45"

    }).then(result => {

        if (!result.isConfirmed) return;


        // Check permission again before deleting.

        if (!isAdmin()) {

            hasAdminPermission();

            return;

        }


        const updatedUsers = users.filter(user =>

            String(user.id) !== String(customerId) ||
            user.role !== "customer"

        );


        const saved = saveData("users", updatedUsers);


        if (saved) {

            Swal.fire({

                icon: "success",

                title: "Deleted!",

                text: "Customer deleted successfully.",

                confirmButtonColor: "#687c45"

            });


            displayCustomers();

        }

        else {

            Swal.fire({

                icon: "error",

                title: "Error",

                text: "Could not delete customer."

            });

        }

    });

}
