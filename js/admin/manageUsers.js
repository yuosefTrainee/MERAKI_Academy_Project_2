// =====================================
// SHOPORA - ADMIN MANAGE CUSTOMERS
// =====================================

import { getData, saveData } from "../modules/storage.js";
import { isAdmin } from "../modules/auth.js";
import { getCurrentLanguage } from "../modules/language.js";


// =====================================
// Variables
// =====================================

let currentPage = 1;

const usersPerPage = 5;

let currentSearch = "";
let currentSort = "nameAsc";


// =====================================
// Translation Helper
// =====================================

function t(english, arabic) {
    return getCurrentLanguage() === "ar" ? arabic : english;
}


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
            title: t("Access Denied", "تم رفض الوصول"),
            text: t(
                "Only the administrator can manage customers.",
                "فقط المسؤول يستطيع إدارة العملاء."
            ),
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
                <h3>${t("Access Denied", "تم رفض الوصول")}</h3>

                <p>
                    ${t(
                        "Only the administrator can manage customers.",
                        "فقط المسؤول يستطيع إدارة العملاء."
                    )}
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="admin-users-toolbar">

            <input
                type="text"
                id="customerSearch"
                placeholder="${t(
                    "Search by name or email...",
                    "ابحث بالاسم أو البريد الإلكتروني..."
                )}"
                value="${escapeHTML(currentSearch)}"
            >

            <select id="customerSortFilter">

                <option value="nameAsc" ${currentSort === "nameAsc" ? "selected" : ""}>
                    ${t("Name: A - Z", "الاسم: أ - ي")}
                </option>

                <option value="nameDesc" ${currentSort === "nameDesc" ? "selected" : ""}>
                    ${t("Name: Z - A", "الاسم: ي - أ")}
                </option>

                <option value="ordersHigh" ${currentSort === "ordersHigh" ? "selected" : ""}>
                    ${t("Most Orders", "الأكثر طلبًا")}
                </option>

                <option value="ordersLow" ${currentSort === "ordersLow" ? "selected" : ""}>
                    ${t("Least Orders", "الأقل طلبًا")}
                </option>

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

        currentSearch = this.value;

        currentPage = 1;

        displayCustomers();

    });


    sortFilter.addEventListener("change", function () {

        currentSort = this.value;

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

    const searchValue = currentSearch.trim().toLowerCase();

    const sortValue = currentSort;


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

                <h3>
                    ${t("No Customers Found", "لم يتم العثور على عملاء")}
                </h3>

                <p>
                    ${t(
                        "There are no registered customers to display.",
                        "لا يوجد عملاء مسجلون لعرضهم."
                    )}
                </p>

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

                    <th>${t("Customer", "العميل")}</th>

                    <th>${t("Email", "البريد الإلكتروني")}</th>

                    <th>${t("Total Orders", "إجمالي الطلبات")}</th>

                    <th>${t("Role", "الدور")}</th>

                    <th>${t("Actions", "الإجراءات")}</th>

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
                                    ${escapeHTML(
                                        customer.name || t("Unknown", "غير معروف")
                                    )}
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
                                ${t("Customer", "عميل")}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="customer-action-btn details-btn"
                                data-customer-action="details"
                                data-customer-id="${escapeHTML(customer.id)}"
                            >
                                ${t("Details", "التفاصيل")}
                            </button>


                            <button
                                type="button"
                                class="customer-action-btn delete-btn"
                                data-customer-action="delete"
                                data-customer-id="${escapeHTML(customer.id)}"
                            >
                                ${t("Delete", "حذف")}
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

                type="button"

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

        title: t("Customer Details", "تفاصيل العميل"),

        html: `

            <div class="customer-details">

                <p>
                    <strong>${t("Name:", "الاسم:")}</strong>
                    ${escapeHTML(customer.name)}
                </p>

                <p>
                    <strong>${t("Email:", "البريد الإلكتروني:")}</strong>
                    ${escapeHTML(customer.email)}
                </p>

                <p>
                    <strong>${t("Role:", "الدور:")}</strong>
                    ${t("Customer", "عميل")}
                </p>

                <p>
                    <strong>${t("Total Orders:", "إجمالي الطلبات:")}</strong>
                    ${ordersCount}
                </p>

            </div>

        `,

        confirmButtonText: t("Close", "إغلاق"),

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

        title: t("Delete Customer?", "حذف العميل؟"),

        text: getCurrentLanguage() === "ar"
            ? `هل أنت متأكد أنك تريد حذف ${customer.name}؟`
            : `Are you sure you want to delete ${customer.name}?`,

        icon: "warning",

        showCancelButton: true,

        confirmButtonText: t("Yes, Delete", "نعم، احذف"),

        cancelButtonText: t("Cancel", "إلغاء"),

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

                title: t("Deleted!", "تم الحذف!"),

                text: t(
                    "Customer deleted successfully.",
                    "تم حذف العميل بنجاح."
                ),

                confirmButtonColor: "#687c45"

            });


            displayCustomers();

        }

        else {

            Swal.fire({

                icon: "error",

                title: t("Error", "خطأ"),

                text: t(
                    "Could not delete customer.",
                    "تعذر حذف العميل."
                ),

                confirmButtonColor: "#687c45"

            });

        }

    });

}


