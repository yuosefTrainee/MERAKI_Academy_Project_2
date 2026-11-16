
// =====================================
// SHOPORA - CHECKOUT
// =====================================

import { getCart } from "./cart.js";
import { getProducts } from "./products.js";
import { getCurrentUser } from "./auth.js";
import { showPage } from "./navigation.js";


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
// Get Checkout Items
// =====================================

function getCheckoutItems() {

    const cart = getCart();

    const products = getProducts();

    return cart.map(item => {

        const product = products.find(product =>
            String(product.id) === String(item.productId)
        );

        if (!product) return null;

        return {
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: Number(item.quantity),
            subtotal: Number(product.price) * Number(item.quantity)
        };

    }).filter(Boolean);

}


// =====================================
// Calculate Total
// =====================================

function getCheckoutTotal(items) {

    return items.reduce(
        (total, item) => total + item.subtotal,
        0
    );

}


// =====================================
// Render Checkout
// =====================================

export function renderCheckout() {

    const container = document.getElementById("checkoutContainer");

    if (!container) return;

    const user = getCurrentUser();

    if (!user || user.role !== "customer") {

        showPage("login");

        return;

    }

    const items = getCheckoutItems();

    if (items.length === 0) {

        showMessage(
            "warning",
            "Your Cart Is Empty",
            "Please add products before checkout."
        );

        showPage("cart");

        return;

    }

    const total = getCheckoutTotal(items);

    container.innerHTML = `

        <div class="checkout-layout">

            <!-- Delivery Information -->

            <div class="checkout-form-card">

                <h3>
                    <i class="fa-solid fa-truck"></i>
                    Delivery Information
                </h3>

                <form id="checkoutForm">

                    <div class="form-group">

                        <label for="checkoutName">
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="checkoutName"
                            value="${escapeHTML(user.name || "")}"
                            required
                            minlength="3"
                            placeholder="Enter your full name"
                        >

                    </div>


                    <div class="form-group">

                        <label for="checkoutEmail">
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="checkoutEmail"
                            value="${escapeHTML(user.email || "")}"
                            required
                            readonly
                        >

                    </div>


                    <div class="form-group">

                        <label for="checkoutPhone">
                            Phone Number
                        </label>

                        <input
                            type="tel"
                            id="checkoutPhone"
                            required
                            pattern="[0-9+() -]{9,15}"
                            placeholder="07XXXXXXXX"
                        >

                    </div>


                    <div class="form-group">

                        <label for="checkoutCity">
                            City
                        </label>

                        <select id="checkoutCity" required>

                            <option value="">Select City</option>
                            <option value="Amman">Amman</option>
                            <option value="Zarqa">Zarqa</option>
                            <option value="Irbid">Irbid</option>
                            <option value="Aqaba">Aqaba</option>
                            <option value="Madaba">Madaba</option>
                            <option value="Salt">Salt</option>
                            <option value="Other">Other</option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label for="checkoutAddress">
                            Full Address
                        </label>

                        <textarea
                            id="checkoutAddress"
                            rows="3"
                            required
                            minlength="5"
                            placeholder="Street, building, apartment..."
                        ></textarea>

                    </div>


                    <div class="form-group">

                        <label for="checkoutNotes">
                            Order Notes (Optional)
                        </label>

                        <textarea
                            id="checkoutNotes"
                            rows="2"
                            placeholder="Additional delivery instructions..."
                        ></textarea>

                    </div>


                    <button
                        type="submit"
                        class="btn-primary checkout-submit-btn">

                        Continue to Payment
                        <i class="fa-solid fa-arrow-right"></i>

                    </button>

                </form>

            </div>


            <!-- Order Summary -->

            <div class="checkout-summary-card">

                <h3>
                    <i class="fa-solid fa-receipt"></i>
                    Order Summary
                </h3>

                <div class="checkout-items">

                    ${items.map(item => `

                        <div class="checkout-item">

                            <div>

                                <strong>
                                    ${escapeHTML(item.name)}
                                </strong>

                                <p>
                                    Quantity: ${item.quantity}
                                </p>

                            </div>

                            <strong>
                                ${formatPrice(item.subtotal)}
                            </strong>

                        </div>

                    `).join("")}

                </div>


                <div class="checkout-total">

                    <span>Total</span>

                    <strong>
                        ${formatPrice(total)}
                    </strong>

                </div>

            </div>

        </div>

    `;

}


// =====================================
// Save Checkout Information
// =====================================

function handleCheckoutSubmit() {

    const container = document.getElementById("checkoutContainer");

    if (!container) return;

    container.addEventListener("submit", function (event) {

        if (event.target.id !== "checkoutForm") return;

        event.preventDefault();

        const user = getCurrentUser();

        if (!user || user.role !== "customer") {

            showPage("login");

            return;

        }

        const items = getCheckoutItems();

        if (items.length === 0) {

            showMessage(
                "warning",
                "Cart Is Empty",
                "Please add products before continuing."
            );

            showPage("cart");

            return;

        }

        const checkoutData = {

            userId: user.id || user.email,

            customerName: document
                .getElementById("checkoutName")
                .value.trim(),

            customerEmail: user.email,

            phone: document
                .getElementById("checkoutPhone")
                .value.trim(),

            city: document
                .getElementById("checkoutCity")
                .value,

            address: document
                .getElementById("checkoutAddress")
                .value.trim(),

            notes: document
                .getElementById("checkoutNotes")
                .value.trim(),

            items,

            total: getCheckoutTotal(items),

            createdAt: new Date().toISOString()

        };


       // Save temporary checkout data

sessionStorage.setItem(
    "shopora-checkout",
    JSON.stringify(checkoutData)
);

// Open Payment Page

document.dispatchEvent(
    new CustomEvent("shopora:open-payment")
);

    });

}


// =====================================
// Initialize Checkout
// =====================================

export function initializeCheckout() {

    // Open Checkout From Cart

    document.addEventListener("click", function (event) {

        const checkoutButton = event.target.closest("#checkoutBtn");

        if (!checkoutButton) return;

        event.preventDefault();

        const user = getCurrentUser();

        if (!user || user.role !== "customer") {

            showPage("login");

            return;

        }

        renderCheckout();

        showPage("checkout");

    });


    // Checkout Form Submit

    handleCheckoutSubmit();

}
