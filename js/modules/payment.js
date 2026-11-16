
// =====================================
// SHOPORA - PAYMENT MODULE
// =====================================

import { getData, saveData } from "./storage.js";
import { getCurrentUser } from "./auth.js";

import {
    getProducts,
    reduceProductStock
} from "./products.js";

import { getCart, updateCartCount } from "./cart.js";
import { showPage } from "./navigation.js";


// =====================================
// Helper Functions
// =====================================

function formatPrice(price) {
    return `${Number(price || 0).toFixed(2)} JD`;
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


function showMessage(icon, title, text = "") {
    return Swal.fire({
        icon,
        title,
        text,
        confirmButtonColor: "#687c45"
    });
}


// =====================================
// Render Payment Page
// =====================================

export function renderPayment() {

    const container = document.getElementById("paymentContainer");

    if (!container) return;

    const user = getCurrentUser();

    if (!user || user.role !== "customer") {
        showPage("login");
        return;
    }

    const checkoutData = JSON.parse(
        sessionStorage.getItem("shopora-checkout") || "null"
    );

    if (!checkoutData) {

        showMessage(
            "warning",
            "Checkout Information Missing",
            "Please complete your delivery information first."
        );

        showPage("checkout");
        return;
    }

    container.innerHTML = `

        <div class="payment-layout">

            <div class="payment-method-card">

                <h3>
                    <i class="fa-solid fa-credit-card"></i>
                    Select Payment Method
                </h3>

                <form id="paymentForm">

                    <label class="payment-option">

                        <input
                            type="radio"
                            name="paymentMethod"
                            value="Cash on Delivery"
                            checked
                        >

                        <div>
                            <i class="fa-solid fa-truck"></i>

                            <strong>Cash on Delivery</strong>

                            <p>Pay when your order arrives.</p>
                        </div>

                    </label>


                    <label class="payment-option">

                        <input
                            type="radio"
                            name="paymentMethod"
                            value="Demo Card"
                        >

                        <div>
                            <i class="fa-solid fa-credit-card"></i>

                            <strong>Demo Card Payment</strong>

                            <p>Simulated online payment for testing.</p>
                        </div>

                    </label>


                    <div class="demo-payment-notice">

                        <i class="fa-solid fa-circle-info"></i>

                        This is a demo payment system.
                        No real money or card information is used.

                    </div>


                    <button
                        type="submit"
                        class="btn-primary payment-submit-btn">

                        Confirm Order
                        <i class="fa-solid fa-check"></i>

                    </button>


                    <button
                        type="button"
                        id="backToCheckout"
                        class="btn-secondary payment-back-btn">

                        <i class="fa-solid fa-arrow-left"></i>
                        Back to Checkout

                    </button>

                </form>

            </div>


            <div class="payment-summary-card">

                <h3>Payment Summary</h3>

                ${checkoutData.items.map(item => `

                    <div class="payment-summary-item">

                        <span>
                            ${escapeHTML(item.name)}
                            × ${Number(item.quantity)}
                        </span>

                        <strong>
                            ${formatPrice(item.subtotal)}
                        </strong>

                    </div>

                `).join("")}

                <div class="payment-summary-total">

                    <span>Total Amount</span>

                    <strong>
                        ${formatPrice(checkoutData.total)}
                    </strong>

                </div>

            </div>

        </div>

    `;
}


// =====================================
// Validate Stock
// =====================================

function validateStock(items) {

    const products = getProducts();

    for (const item of items) {

        const product = products.find(product =>
            String(product.id) === String(item.productId)
        );

        if (!product) {

            return {
                valid: false,
                message: `${item.name} is no longer available.`
            };

        }

        const quantity = Number(item.quantity);
        const stock = Number(product.stock);

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(stock) ||
            stock < quantity
        ) {

            return {
                valid: false,
                message: `Not enough stock for ${product.name}.`
            };

        }

    }

    return { valid: true };
}


// =====================================
// Create Order
// =====================================

function createOrder(paymentMethod, paymentStatus) {

    const user = getCurrentUser();

    const checkoutData = JSON.parse(
        sessionStorage.getItem("shopora-checkout") || "null"
    );

    if (!user || !checkoutData) {
        return false;
    }

    const currentCart = getCart();

    if (!currentCart.length) {
        showMessage(
            "warning",
            "Cart Is Empty",
            "Your cart is empty."
        );

        return false;
    }

    if (!Array.isArray(checkoutData.items) ||
        checkoutData.items.length === 0) {
        return false;
    }


    // Validate Stock

    const stockCheck = validateStock(checkoutData.items);

    if (!stockCheck.valid) {

        showMessage(
            "error",
            "Stock Error",
            stockCheck.message
        );

        return false;
    }


    // Keep Original Products For Rollback

    const originalProducts = getProducts();


    // Generate Order

    const order = {

        id: "ORD-" + Date.now(),

        userId: user.id || user.email,

        customerId: user.id || user.email,

        customerName: checkoutData.customerName,

        customerEmail: checkoutData.customerEmail,

        phone: checkoutData.phone,

        city: checkoutData.city,

        address: checkoutData.address,

        notes: checkoutData.notes,

        items: checkoutData.items,

        total: checkoutData.total,

        paymentMethod,

        paymentStatus,

        status: "Pending",

        createdAt: new Date().toISOString()

    };


    // Update Product Stock

    const stockUpdated = reduceProductStock(checkoutData.items);

    if (!stockUpdated) {

        showMessage(
            "error",
            "Stock Error",
            "Could not update product stock. Your order was not completed."
        );

        return false;
    }


    // Save Order

    const orders = getData("orders", []);

    const saved = saveData("orders", [...orders, order]);

    if (!saved) {

        // Restore Original Stock

        saveData("products", originalProducts);

        showMessage(
            "error",
            "Order Error",
            "Could not save your order. Product stock was restored."
        );

        return false;
    }


    // Clear Customer Cart

    const cartKey = `cart_${user.id || user.email}`;

    const cartCleared = saveData(cartKey, []);

    if (!cartCleared) {

        console.error("Could not clear customer cart.");

    }

    updateCartCount();


    // Clear Temporary Checkout Data

    sessionStorage.removeItem("shopora-checkout");


    // Save Last Order ID

    sessionStorage.setItem(
        "shopora-last-order",
        order.id
    );

    return order;
}


// =====================================
// Handle Payment
// =====================================

async function handlePayment(event) {

    event.preventDefault();

    const form = event.currentTarget;

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    if (submitButton.disabled) return;

    submitButton.disabled = true;

    try {

        const paymentMethod = form.querySelector(
            'input[name="paymentMethod"]:checked'
        )?.value;

        if (!paymentMethod) {

            await showMessage(
                "warning",
                "Select Payment Method",
                "Please select a payment method."
            );

            return;
        }


        let paymentStatus = "Pending";


        // Demo Card Simulation

        if (paymentMethod === "Demo Card") {

            const result = await Swal.fire({

                title: "Simulate Card Payment",

                text: "Choose the result of this demo transaction.",

                icon: "info",

                showCancelButton: true,

                showDenyButton: true,

                confirmButtonText: "Simulate Success",

                denyButtonText: "Simulate Failure",

                cancelButtonText: "Cancel",

                confirmButtonColor: "#687c45",

                denyButtonColor: "#dc3545"

            });


            if (result.isDenied) {

                await showMessage(
                    "error",
                    "Payment Failed",
                    "The simulated payment was unsuccessful. No order was created."
                );

                return;
            }

            if (!result.isConfirmed) {
                return;
            }

            paymentStatus = "Paid";
        }


        // Create Order

        const order = createOrder(
            paymentMethod,
            paymentStatus
        );

        if (!order) return;


        // Show Success

        const result = await Swal.fire({

            icon: "success",

            title: "Order Placed Successfully!",

            html: `
                <p>Your order has been created.</p>
                <h3>${escapeHTML(order.id)}</h3>
                <p>Total: ${formatPrice(order.total)}</p>
            `,

            confirmButtonText: "View My Orders",

            confirmButtonColor: "#687c45"

        });


        if (result.isConfirmed) {

            showPage("orders");

            document.dispatchEvent(
                new CustomEvent("shopora:orders-updated")
            );

        } else {

            showPage("home");

        }

    } finally {

        submitButton.disabled = false;

    }
}


// =====================================
// Initialize Payment
// =====================================

export function initializePayment() {

    // Open Payment Page After Checkout

    document.addEventListener("shopora:open-payment", function () {

        renderPayment();

        showPage("payment");

    });


    // Payment Form Submit

    document.addEventListener("submit", function (event) {

        if (event.target.id !== "paymentForm") return;

        handlePayment(event);

    });


    // Back To Checkout

    document.addEventListener("click", function (event) {

        if (event.target.closest("#backToCheckout")) {

            showPage("checkout");

        }

    });

}
