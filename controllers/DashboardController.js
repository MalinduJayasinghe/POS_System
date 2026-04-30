
// ------------------------ Format Rupees correctly ------------------------
const formatMoney = (amount) => {
    return 'Rs. ' + Number(amount).toLocaleString();
};


// ------------------------ Format date correctly ------------------------
const formatDateShort = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};


// ── Escape HTML special characters to prevent XSS ───────────────────
// Turns <script> into &lt;script&gt; so user input renders as text not code
const escapeHtml = (text) => {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};


// ------------------------ Dashboard ------------------------
const renderDashboard = () => {

    // Count today's orders and revenue
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);
    const todayOrders  = getOrders().filter(o => new Date(o.date) >= dateToday);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const itemsInStock = getItems().filter(i => i.qty > 0).length;

    // Update the four stat cards
    $('#customers').text(getCustomers().length);
    $('#items').text(itemsInStock);
    $('#orders').text(todayOrders.length);
    $('#revenue').text(formatMoney(todayRevenue));

    // Show today's date below the welcome heading
    $('#date').text(new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));

    // Show the 5 most recent orders in the table (newest first)
    const recentOrders = [...getOrders()]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const tbody = $('#dash-orders-body');
    tbody.empty();

    if (recentOrders.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center text-muted py-4">No orders yet</td></tr>');
        return;
    }

    recentOrders.forEach(function (order) {
        tbody.append(`
            <tr>
                <td class="id-cell">${order.id}</td>
                <td>${escapeHtml(order.customerName)}</td>
                <td>${formatDateShort(order.date)}</td>
                <td><strong>${formatMoney(order.total)}</strong></td>
                <td><span class="pos-badge badge-success">Completed</span></td>
            </tr>`);
    });
};


// ------------------------ Quick Access Buttons ------------------------
$('#btn-customer').on('click', function () {
    showView('view-customers');
    renderCustomers();
    setTimeout(function () { $('#btn-add-customer').trigger('click'); }, 100);
});

$('#btn-item').on('click', function () {
    showView('view-items');
    renderItems();
    setTimeout(function () { $('#btn-add-item').trigger('click'); }, 100);
});

$('#btn-order').on('click', function () {
    showView('view-orders');
    renderNewOrder();
});


// ------------------------ Nav link navigation ------------------------
$(document).on('click', '.nav-link-item', function () {
    const target = $(this).data('view');
    showView(target);
    if (target === 'dashboard')      renderDashboard();
    if (target === 'view-customers') renderCustomers();
    if (target === 'view-items')     renderItems();
    if (target === 'view-orders')    renderNewOrder();
    if (target === 'view-history')   renderHistory();
});


// ------------------------ Start with Login Page ------------------------
$(function () {
    showView('login');
});