
// =====================================
// SHOPORA - ADMIN MANAGE REVIEWS
// =====================================

import { getData, saveData } from "../modules/storage.js";
import { isAdmin } from "../modules/auth.js";


// =====================================
// Variables
// =====================================

let currentPage = 1;

const reviewsPerPage = 5;


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
// Get Reviews
// =====================================

function getReviews() {

    return getData("reviews", []);

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

            text: "Only the administrator can manage reviews.",

            confirmButtonColor: "#687c45"

        });

    }

    return false;

}


// =====================================
// Render Stars
// =====================================

function renderStars(rating) {

    const stars = Math.max(0, Math.min(5, Number(rating) || 0));

    return `
        <span class="review-stars">
            ${"★".repeat(Math.floor(stars))}
            ${"☆".repeat(5 - Math.floor(stars))}
        </span>
    `;

}


// =====================================
// Render Admin Reviews
// =====================================

export function renderAdminReviews() {

    const container = document.getElementById("adminReviewsContainer");

    if (!container) return;

    if (!hasAdminPermission()) {

        container.innerHTML = `
            <div class="reviews-empty-state">
                <h3>Access Denied</h3>
                <p>Only the administrator can manage reviews.</p>
            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="admin-reviews-toolbar">

            <input
                type="text"
                id="reviewSearch"
                placeholder="Search by customer or product..."
            >

            <select id="reviewRatingFilter">

                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>

            </select>

            <select id="reviewSortFilter">

                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>

            </select>

        </div>

        <div id="reviewsTableContainer"></div>

        <div id="reviewsPagination"></div>

    `;


    initializeReviewFilters();

    displayReviews();

}


// =====================================
// Initialize Filters
// =====================================

function initializeReviewFilters() {

    if (!isAdmin()) return;

    const searchInput = document.getElementById("reviewSearch");

    const ratingFilter = document.getElementById("reviewRatingFilter");

    const sortFilter = document.getElementById("reviewSortFilter");


    searchInput.addEventListener("input", function () {

        currentPage = 1;

        displayReviews();

    });


    ratingFilter.addEventListener("change", function () {

        currentPage = 1;

        displayReviews();

    });


    sortFilter.addEventListener("change", function () {

        currentPage = 1;

        displayReviews();

    });

}


// =====================================
// Filter And Sort Reviews
// =====================================

function getFilteredReviews() {

    if (!isAdmin()) return [];

    const reviews = getReviews();

    const searchValue = document
        .getElementById("reviewSearch")
        .value.trim()
        .toLowerCase();

    const ratingValue = document
        .getElementById("reviewRatingFilter")
        .value;

    const sortValue = document
        .getElementById("reviewSortFilter")
        .value;


    let filteredReviews = reviews.filter(review => {

        const customerName = String(
            review.customerName || review.userName || ""
        ).toLowerCase();

        const productName = String(
            review.productName || review.product || ""
        ).toLowerCase();

        const comment = String(
            review.comment || review.text || ""
        ).toLowerCase();


        const matchesSearch =
            customerName.includes(searchValue) ||
            productName.includes(searchValue) ||
            comment.includes(searchValue);


        const matchesRating =
            ratingValue === "all" ||
            Number(review.rating) === Number(ratingValue);


        return matchesSearch && matchesRating;

    });


    // Sorting

    if (sortValue === "newest") {

        filteredReviews.sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

    }

    else if (sortValue === "oldest") {

        filteredReviews.sort((a, b) =>
            new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );

    }

    else if (sortValue === "highest") {

        filteredReviews.sort((a, b) =>
            Number(b.rating || 0) - Number(a.rating || 0)
        );

    }

    else if (sortValue === "lowest") {

        filteredReviews.sort((a, b) =>
            Number(a.rating || 0) - Number(b.rating || 0)
        );

    }


    return filteredReviews;

}


// =====================================
// Display Reviews
// =====================================

function displayReviews() {

    if (!isAdmin()) return;

    const tableContainer = document.getElementById("reviewsTableContainer");

    const paginationContainer = document.getElementById("reviewsPagination");

    if (!tableContainer || !paginationContainer) return;


    const reviews = getFilteredReviews();


    // Empty State

    if (reviews.length === 0) {

        tableContainer.innerHTML = `

            <div class="reviews-empty-state">

                <h3>No Reviews Found</h3>

                <p>There are no reviews to display.</p>

            </div>

        `;

        paginationContainer.innerHTML = "";

        return;

    }


    // Pagination

    const totalPages = Math.ceil(reviews.length / reviewsPerPage);

    if (currentPage > totalPages) {

        currentPage = totalPages;

    }


    const startIndex = (currentPage - 1) * reviewsPerPage;

    const currentReviews = reviews.slice(
        startIndex,
        startIndex + reviewsPerPage
    );


    // Reviews Table

    tableContainer.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>Customer</th>
                    <th>Product</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Actions</th>

                </tr>

            </thead>

            <tbody>

                ${currentReviews.map(review => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                review.customerName ||
                                review.userName ||
                                "Unknown"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                review.productName ||
                                review.product ||
                                "Unknown"
                            )}
                        </td>

                        <td>
                            ${renderStars(review.rating)}
                        </td>

                        <td class="review-comment-cell">
                            ${escapeHTML(
                                review.comment ||
                                review.text ||
                                "No comment"
                            )}
                        </td>

                        <td>
                            ${formatReviewDate(review.createdAt)}
                        </td>

                        <td>

                            <button
                                class="review-action-btn details-btn"
                                data-review-action="details"
                                data-review-id="${escapeHTML(review.id)}"
                            >
                                Details
                            </button>

                            <button
                                class="review-action-btn delete-btn"
                                data-review-action="delete"
                                data-review-id="${escapeHTML(review.id)}"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>

    `;


    renderReviewsPagination(totalPages);

    initializeReviewActions();

}


// =====================================
// Format Date
// =====================================

function formatReviewDate(date) {

    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-GB");

}


// =====================================
// Pagination
// =====================================

function renderReviewsPagination(totalPages) {

    if (!isAdmin()) return;

    const container = document.getElementById("reviewsPagination");

    let html = "";


    for (let page = 1; page <= totalPages; page++) {

        html += `

            <button
                class="review-page-btn ${page === currentPage ? "active" : ""}"
                data-review-page="${page}"
            >

                ${page}

            </button>

        `;

    }


    container.innerHTML = html;


    container.querySelectorAll("[data-review-page]").forEach(button => {

        button.addEventListener("click", function () {

            currentPage = Number(this.dataset.reviewPage);

            displayReviews();

        });

    });

}


// =====================================
// Initialize Review Actions
// =====================================

function initializeReviewActions() {

    if (!isAdmin()) return;

    const buttons = document.querySelectorAll("[data-review-action]");


    buttons.forEach(button => {

        button.addEventListener("click", function () {

            if (!hasAdminPermission()) return;

            const reviewId = this.dataset.reviewId;

            const action = this.dataset.reviewAction;


            if (action === "details") {

                showReviewDetails(reviewId);

            }


            if (action === "delete") {

                deleteReview(reviewId);

            }

        });

    });

}


// =====================================
// Show Review Details
// =====================================

function showReviewDetails(reviewId) {

    if (!hasAdminPermission()) return;

    const review = getReviews().find(item =>

        String(item.id) === String(reviewId)

    );


    if (!review) return;


    Swal.fire({

        title: "Review Details",

        html: `

            <div class="review-details">

                <p>
                    <strong>Customer:</strong>
                    ${escapeHTML(
                        review.customerName ||
                        review.userName ||
                        "Unknown"
                    )}
                </p>

                <p>
                    <strong>Product:</strong>
                    ${escapeHTML(
                        review.productName ||
                        review.product ||
                        "Unknown"
                    )}
                </p>

                <p>
                    <strong>Rating:</strong>
                    ${renderStars(review.rating)}
                </p>

                <p>
                    <strong>Comment:</strong>
                </p>

                <p>
                    ${escapeHTML(
                        review.comment ||
                        review.text ||
                        "No comment"
                    )}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${formatReviewDate(review.createdAt)}
                </p>

            </div>

        `,

        confirmButtonText: "Close",

        confirmButtonColor: "#687c45"

    });

}


// =====================================
// Delete Review
// =====================================

function deleteReview(reviewId) {

    if (!hasAdminPermission()) return;


    const reviews = getReviews();

    const reviewExists = reviews.some(item =>

        String(item.id) === String(reviewId)

    );


    if (!reviewExists) return;


    Swal.fire({

        title: "Delete Review?",

        text: "Are you sure you want to delete this review?",

        icon: "warning",

        showCancelButton: true,

        confirmButtonText: "Yes, Delete",

        cancelButtonText: "Cancel",

        confirmButtonColor: "#dc3545",

        cancelButtonColor: "#687c45"

    }).then(result => {

        if (!result.isConfirmed) return;


        // Verify permission again before deleting the review.

        if (!isAdmin()) {

            hasAdminPermission();

            return;

        }


        const updatedReviews = reviews.filter(item =>

            String(item.id) !== String(reviewId)

        );


        const saved = saveData("reviews", updatedReviews);


        if (saved) {

            Swal.fire({

                icon: "success",

                title: "Deleted!",

                text: "Review deleted successfully.",

                confirmButtonColor: "#687c45"

            });


            displayReviews();

        }

        else {

            Swal.fire({

                icon: "error",

                title: "Error",

                text: "Could not delete review."

            });

        }

    });

}