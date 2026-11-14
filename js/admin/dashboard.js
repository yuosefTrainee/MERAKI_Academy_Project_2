import { getData } from "../modules/storage.js";

// =====================================
// Dashboard Statistics
// =====================================

export function renderDashboard() {

    const products = getData("products", []);
    const users = getData("users", []);
    const orders = getData("orders", []);

    // Completed orders
    const completedOrders = orders.filter(
        order => order.status === "Delivered"
    );

    // Total sales
    const totalSales = completedOrders.reduce(
        (total, order) => total + Number(order.total || 0),
        0
    );

    // Customers
    const customers = users.filter(
        user => user.role === "customer"
    );

    // Update statistics
    $("#totalSales").text(`$${totalSales.toFixed(2)}`);
    $("#totalOrders").text(orders.length);
    $("#totalProducts").text(products.length);
    $("#totalCustomers").text(customers.length);

    // Dashboard date
    $("#dashboardDate").text(
        new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    );

    renderRecentOrders(orders);
    renderSalesChart(completedOrders);
    renderOrdersChart(orders);
}


// =====================================
// Chart Empty State
// =====================================

function showChartMessage(canvas, message) {

    const parent = canvas.parentElement;

    // Hide canvas
    canvas.style.display = "none";

    // Remove old message
    parent.querySelector(".chart-empty-state")?.remove();

    // Create message
    const emptyMessage = document.createElement("div");

    emptyMessage.className = "chart-empty-state";

    emptyMessage.innerHTML = `
        <i class="fa-solid fa-chart-simple"></i>
        <p>${message}</p>
    `;

    parent.appendChild(emptyMessage);
}


function hideChartMessage(canvas) {

    const parent = canvas.parentElement;

    // Show canvas
    canvas.style.display = "block";

    // Remove empty message
    parent.querySelector(".chart-empty-state")?.remove();
}


// =====================================
// Recent Orders
// =====================================

function renderRecentOrders(orders) {

    const container = $("#recentOrdersContainer");

    container.empty();

    if (!orders.length) {

        container.html(`
            <div class="dashboard-empty-state">
                <i class="fa-solid fa-receipt"></i>
                <p>No orders available yet.</p>
                <span>New orders will appear here.</span>
            </div>
        `);

        return;
    }

    const recentOrders = [...orders]
        .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            return dateB - dateA;
        })
        .slice(0, 5);

    const table = $(`
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `);

    recentOrders.forEach(order => {

        const row = $("<tr></tr>");

        row.append(
            $("<td></td>").text(order.id || "N/A")
        );

        row.append(
            $("<td></td>").text(
                order.customerName || "Customer"
            )
        );

        row.append(
            $("<td></td>").text(
                `$${Number(order.total || 0).toFixed(2)}`
            )
        );

        const status = order.status || "Pending";

        const statusCell = $("<td></td>");

        const badge = $("<span></span>")
            .addClass(`status-badge status-${status.toLowerCase()}`)
            .text(status);

        statusCell.append(badge);

        row.append(statusCell);

        table.find("tbody").append(row);
    });

    container.append(table);
}


// =====================================
// Sales Chart
// =====================================

let salesChartInstance = null;

function renderSalesChart(orders) {

    const canvas = document.getElementById("salesChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (salesChartInstance) {
        salesChartInstance.destroy();
        salesChartInstance = null;
    }

    const currentYear = new Date().getFullYear();

    const monthlySales = Array(12).fill(0);

    orders.forEach(order => {

        if (!order.createdAt) return;

        const date = new Date(order.createdAt);

        if (Number.isNaN(date.getTime())) return;

        if (date.getFullYear() === currentYear) {

            monthlySales[date.getMonth()] += Number(order.total || 0);

        }
    });

    const hasSales = monthlySales.some(amount => amount > 0);

    if (!hasSales) {

        showChartMessage(
            canvas,
            "No sales data available yet."
        );

        return;
    }

    hideChartMessage(canvas);

    salesChartInstance = new Chart(canvas, {

        type: "line",

        data: {

            labels: [
                "Jan", "Feb", "Mar", "Apr",
                "May", "Jun", "Jul", "Aug",
                "Sep", "Oct", "Nov", "Dec"
            ],

            datasets: [{

                label: "Sales ($)",

                data: monthlySales,

                tension: 0.4,

                fill: true,

                borderWidth: 3,

                pointRadius: 4,

                pointHoverRadius: 6

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    callbacks: {

                        label: function(context) {
                            return `Sales: $${context.parsed.y.toFixed(2)}`;
                        }

                    }

                }

            },

            scales: {

                y: {
                    beginAtZero: true
                }

            }

        }

    });
}


// =====================================
// Orders Chart
// =====================================

let ordersChartInstance = null;

function renderOrdersChart(orders) {

    const canvas = document.getElementById("ordersChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (ordersChartInstance) {
        ordersChartInstance.destroy();
        ordersChartInstance = null;
    }

    if (!orders.length) {

        showChartMessage(
            canvas,
            "No orders available yet."
        );

        return;
    }

    hideChartMessage(canvas);

    const statuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];

    const statusCounts = statuses.map(status => {

        return orders.filter(
            order => order.status === status
        ).length;

    });

    ordersChartInstance = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: statuses,

            datasets: [{

                data: statusCounts,

                borderWidth: 2,

                hoverOffset: 8

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}