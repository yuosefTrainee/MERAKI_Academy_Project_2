// =====================================
// SHOPORA - CUSTOMER REVIEWS
// =====================================

import { getData, saveData } from "./storage.js";
import { getCurrentUser } from "./auth.js";


// =====================================
// Helper Functions
// =====================================

function getCurrentLanguage() {

    return localStorage.getItem("shopora-language") || "en";

}


function isArabic() {

    return getCurrentLanguage() === "ar";

}


function translate(en, ar) {

    return isArabic() ? ar : en;

}


function escapeHTML(value = "") {

    return String(value).replace(/[&<>"']/g, char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

    })[char]);

}


function getReviews() {

    return getData("reviews", []);

}


function saveReviews(reviews) {

    return saveData("reviews", reviews);

}


function getCustomerKey(user) {

    return String(user.id || user.email).toLowerCase();

}


function showMessage(icon, title, text = "") {

    if (typeof Swal !== "undefined") {

        Swal.fire({

            icon,
            title,
            text,
            confirmButtonColor: "#687c45"

        });

    } else {

        alert(`${title}\n${text}`);

    }

}


// =====================================
// Get Product Reviews
// =====================================

export function getProductReviews(productId) {

    return getReviews().filter(review =>

        String(review.productId) === String(productId)

    );

}


// =====================================
// Get Average Rating
// =====================================

export function getAverageRating(productId) {

    const reviews = getProductReviews(productId);

    if (reviews.length === 0) return 0;

    const total = reviews.reduce(

        (sum, review) => sum + Number(review.rating),

        0

    );

    return Number((total / reviews.length).toFixed(1));

}


// =====================================
// Render Stars
// =====================================

function renderStars(rating) {

    const value = Math.max(

        0,

        Math.min(5, Number(rating) || 0)

    );

    return `

        <span class="review-stars">

            ${"★".repeat(value)}

            ${"☆".repeat(5 - value)}

        </span>

    `;

}


// =====================================
// Render Product Reviews
// =====================================

export function renderProductReviews(productId, productName) {

    const container = document.getElementById("productReviews");

    if (!container) return;

    const user = getCurrentUser();

    const reviews = getProductReviews(productId);

    const averageRating = getAverageRating(productId);


    // Find Customer Review

    const customerReview = user

        ? reviews.find(review =>

            review.userId === getCustomerKey(user)

        )

        : null;


    // Reviews HTML

    const reviewsHTML = reviews.length

        ? reviews.map(review => `

            <div class="customer-review-card">

                <div class="customer-review-header">

                    <strong>

                        ${escapeHTML(review.customerName)}

                    </strong>

                    ${renderStars(review.rating)}

                </div>


                <p class="customer-review-comment">

                    ${escapeHTML(review.comment)}

                </p>


                <small>

                    ${new Date(review.createdAt).toLocaleDateString(

                        isArabic() ? "ar-JO" : "en-GB"

                    )}

                </small>


                ${

                    user &&

                    review.userId === getCustomerKey(user)

                        ? `

                            <div class="customer-review-actions">

                                <button

                                    class="edit-review-btn"

                                    data-review-id="${escapeHTML(review.id)}"

                                >

                                    ${translate("Edit", "تعديل")}

                                </button>


                                <button

                                    class="delete-review-btn"

                                    data-review-id="${escapeHTML(review.id)}"

                                >

                                    ${translate("Delete", "حذف")}

                                </button>

                            </div>

                        `

                        : ""

                }

            </div>

        `).join("")

        : `

            <div class="reviews-empty">

                ${translate(

                    "No reviews yet. Be the first to review this product!",

                    "لا توجد تقييمات حتى الآن. كن أول من يقيّم هذا المنتج!"

                )}

            </div>

        `;


    container.innerHTML = `

        <section class="product-reviews-section">

            <h2>

                ${translate("Customer Reviews", "تقييمات العملاء")}

            </h2>


            <div class="reviews-summary">

                <div class="reviews-average">

                    <strong>${averageRating}</strong>

                    ${renderStars(Math.round(averageRating))}

                    <span>

                        (${reviews.length} ${translate("Reviews", "تقييمات")})

                    </span>

                </div>

            </div>


            <div class="reviews-list">

                ${reviewsHTML}

            </div>


            <div class="review-form-container">

                <h3>

                    ${customerReview

                        ? translate("Your Review", "تقييمك")

                        : translate("Write a Review", "أضف تقييمك")

                    }

                </h3>


                ${user && user.role === "customer"

                    ? `

                        <form id="reviewForm">

                            <div class="review-rating-input">

                                <label>

                                    ${translate("Your Rating:", "تقييمك:")}

                                </label>


                                <div class="rating-stars">

                                    ${[5, 4, 3, 2, 1].map(number => `

                                        <input

                                            type="radio"

                                            id="rating-${number}"

                                            name="rating"

                                            value="${number}"

                                            ${

                                                customerReview &&

                                                Number(customerReview.rating) === number

                                                    ? "checked"

                                                    : ""

                                            }

                                            required

                                        >

                                        <label for="rating-${number}">

                                            ★

                                        </label>

                                    `).join("")}

                                </div>

                            </div>


                            <textarea

                                id="reviewComment"

                                placeholder="${translate(

                                    "Write your comment here...",

                                    "اكتب تعليقك هنا..."

                                )}"

                                required

                                minlength="3"

                                maxlength="500"

                            >${customerReview

                                ? escapeHTML(customerReview.comment)

                                : ""

                            }</textarea>


                            <button type="submit">

                                ${customerReview

                                    ? translate("Update Review", "تحديث التقييم")

                                    : translate("Submit Review", "إرسال التقييم")

                                }

                            </button>

                        </form>

                    `

                    : `

                        <p class="review-login-message">

                            ${translate(

                                "Please login as a customer to write a review.",

                                "يرجى تسجيل الدخول كعميل حتى تتمكن من إضافة تقييم."

                            )}

                        </p>

                    `

                }

            </div>

        </section>

    `;


    initializeReviewEvents(productId, productName);

}


// =====================================
// Initialize Review Events
// =====================================

function initializeReviewEvents(productId, productName) {

    const form = document.getElementById("reviewForm");

    if (form) {

        form.addEventListener("submit", function (event) {

            event.preventDefault();

            submitReview(productId, productName);

        });

    }


    // Edit Review

    document.querySelectorAll(".edit-review-btn").forEach(button => {

        button.addEventListener("click", function () {

            document.getElementById("reviewComment")?.focus();

            document.getElementById("reviewForm")?.scrollIntoView({

                behavior: "smooth",

                block: "center"

            });

        });

    });


    // Delete Review

    document.querySelectorAll(".delete-review-btn").forEach(button => {

        button.addEventListener("click", function () {

            deleteCustomerReview(this.dataset.reviewId, productId, productName);

        });

    });

}


// =====================================
// Submit Review
// =====================================

function submitReview(productId, productName) {

    const user = getCurrentUser();

    if (!user || user.role !== "customer") {

        showMessage(

            "warning",

            translate("Login Required", "تسجيل الدخول مطلوب"),

            translate(

                "Please login before writing a review.",

                "يرجى تسجيل الدخول قبل إضافة تقييم."

            )

        );

        return;

    }


    const ratingInput = document.querySelector(

        'input[name="rating"]:checked'

    );

    const commentInput = document.getElementById("reviewComment");


    if (!ratingInput || !commentInput) return;


    const rating = Number(ratingInput.value);

    const comment = commentInput.value.trim();


    if (rating < 1 || rating > 5) return;


    if (comment.length < 3) {

        showMessage(

            "warning",

            translate("Invalid Comment", "تعليق غير صالح"),

            translate(

                "Your comment must contain at least 3 characters.",

                "يجب أن يحتوي التعليق على 3 أحرف على الأقل."

            )

        );

        return;

    }


    const reviews = getReviews();

    const customerKey = getCustomerKey(user);


    // Check Existing Review

    const existingReview = reviews.find(review =>

        String(review.productId) === String(productId) &&

        review.userId === customerKey

    );


    if (existingReview) {

        existingReview.rating = rating;

        existingReview.comment = comment;

        existingReview.updatedAt = new Date().toISOString();

    } else {

        const newReview = {

            id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,

            productId: productId,

            productName: productName,

            userId: customerKey,

            customerName: user.name || user.email,

            customerEmail: user.email,

            rating: rating,

            comment: comment,

            createdAt: new Date().toISOString()

        };

        reviews.push(newReview);

    }


    const saved = saveReviews(reviews);


    if (!saved) {

        showMessage(

            "error",

            translate("Error", "خطأ"),

            translate(

                "Could not save your review.",

                "تعذر حفظ التقييم."

            )

        );

        return;

    }


    showMessage(

        "success",

        translate("Success", "تم بنجاح"),

        existingReview

            ? translate(

                "Your review has been updated.",

                "تم تحديث تقييمك."

            )

            : translate(

                "Your review has been submitted.",

                "تم إرسال تقييمك."

            )

    );


    renderProductReviews(productId, productName);

}


// =====================================
// Delete Customer Review
// =====================================

function deleteCustomerReview(reviewId, productId, productName) {

    const user = getCurrentUser();

    if (!user || user.role !== "customer") return;


    const reviews = getReviews();

    const review = reviews.find(item =>

        String(item.id) === String(reviewId)

    );


    if (!review || review.userId !== getCustomerKey(user)) {

        return;

    }


    const updatedReviews = reviews.filter(item =>

        String(item.id) !== String(reviewId)

    );


    const saved = saveReviews(updatedReviews);


    if (!saved) {

        showMessage(

            "error",

            translate("Error", "خطأ"),

            translate(

                "Could not delete your review.",

                "تعذر حذف التقييم."

            )

        );

        return;

    }


    showMessage(

        "success",

        translate("Deleted", "تم الحذف"),

        translate(

            "Your review has been deleted.",

            "تم حذف تقييمك."

        )

    );


    renderProductReviews(productId, productName);

}