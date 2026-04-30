
// ------------------- Render the order history table -------------------
const renderHistory = (searchTerm, fromDate, toDate) => {
    searchTerm = searchTerm || '';
    fromDate   = fromDate   || '';
    toDate     = toDate     || '';

    // Start with all orders, sorted newest first
    let list = [...getOrders()].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by customer name or order ID
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(o =>
            o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
        );
    }

    // Filter by from-date (start of that day)
    if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        list = list.filter(o => new Date(o.date) >= from);
    }

    // Filter by to-date (end of that day)
    if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        list = list.filter(o => new Date(o.date) <= to);
    }

    // Update the result count label
    $('#hist-count').text(`Showing ${list.length} order${list.length !== 1 ? 's' : ''}`);

    const tbody = $('#history-tbody');
    tbody.empty();

    if (list.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center text-muted py-4">No orders found</td></tr>');
        return;
    }

    list.forEach(function (order) {
        // Show up to 2 item badges per row, then a "+N more" badge if there are extras
        const badges = order.items.slice(0, 2).map(i =>
            `<span class="pos-badge badge-blue me-1">${escapeHtml(i.name)} ×${i.qty}</span>`
        ).join('');

        const extraBadge = order.items.length > 2
            ? `<span class="pos-badge badge-blue">+${order.items.length - 2} more</span>`
            : '';

        tbody.append(`
            <tr>
                <td class="id-cell">${order.id}</td>
                <td><strong>${escapeHtml(order.customerName)}</strong></td>
                <td style="color:var(--text-3)">${formatDateTime(order.date)}</td>
                <td>${badges}${extraBadge}</td>
                <td class="text-end">
                    <strong style="font-family:var(--font-head)">${formatMoney(order.total)}</strong>
                </td>
            </tr>`);
    });
};


// ------------------- Filter button -------------------
$('#history-filter-btn').on('click', function () {
    renderHistory(
        $('#history-search').val(),
        $('#history-from').val(),
        $('#history-to').val()
    );
});


// ------------------- Clear all filters -------------------
$('#history-clear-btn').on('click', function () {
    $('#history-search').val('');
    $('#history-from').val('');
    $('#history-to').val('');
    renderHistory();
});


// ------------------- Live search while the user types -------------------
$('#history-search').on('input', function () {
    renderHistory(
        $(this).val(),
        $('#history-from').val(),
        $('#history-to').val()
    );
});