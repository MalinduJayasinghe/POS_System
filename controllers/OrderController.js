
// ------------------------- Format date + time -------------------------
const formatDateTime = (isoString) => {
    const date     = new Date(isoString);
    const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return datePart + ' · ' + timePart;
};


//  Holds the current order -------------------------
let currentOrder = {
    customerId: null,
    items: []    // array of { code, name, price, qty, subtotal }
};


// ------------------------- New Order Page -------------------------
const renderNewOrder = () => {

    // Fill the customer dropdown
    const customerSelect = $('#order-customer-select');
    customerSelect.html('<option value="">Choose a customer…</option>');
    getCustomers().forEach(function (c) {
        customerSelect.append(`<option value="${c.id}">${c.id} — ${escapeHtml(c.name)}</option>`);
    });

    // Re-select the previously chosen customer if one exists
    if (currentOrder.customerId) {
        customerSelect.val(currentOrder.customerId);
    }

    // Fill the item dropdown — only show items with stock available
    const itemSelect = $('#order-item-select');
    itemSelect.html('<option value="">Select item…</option>');
    getItems().filter(i => i.qty > 0).forEach(function (i) {
        itemSelect.append(`
            <option value="${i.id}" data-price="${i.price}" data-qty="${i.qty}">
                ${i.id} — ${escapeHtml(i.name)}
            </option>`);
    });

    // Show the auto-generated order ID
    $('#order-id-display').text(nextOrderId());

    renderOrderItemsTable();
};


// ------------------------- Show unit price when an item is selected -------------------------
$('#order-item-select').on('change', function () {
    const selectedOption = $(this).find(':selected');
    const price = selectedOption.data('price') || 0;
    $('#order-unit-price').text(price ? formatMoney(price) : 'Unit Price: 0');
});


// ------------------------- Add Item to Order -------------------------
$('#btn-add-order-item').on('click', function () {
    const select = $('#order-item-select');
    const option = select.find(':selected');
    const code   = select.val();
    const price  = parseFloat(option.data('price'));
    const maxQty = parseInt(option.data('qty'), 10);
    const qty    = parseInt($('#order-qty').val(), 10);
    // Extract the name from the option text after the " — " separator
    const name   = option.text().trim().split(' — ')[1] || option.text().trim();

    // Validate inputs
    if (!code){
        showToast('Please select an item.', 'warning');
        return;
    }

    if (!qty || qty < 1){
        showToast('Quantity must be at least 1.', 'warning');
        return;
    }

    if (qty > maxQty){
        showToast(`Only ${maxQty} units available.`, 'danger');
        return;
    }

    // If item already exists in the order, increase quantity instead of adding a duplicate row
    const existing = currentOrder.items.find(i => i.code === code);
    if (existing) {
        const newQty = existing.qty + qty;
        if (newQty > maxQty) {
            showToast(`Cannot exceed available stock (${maxQty}).`, 'danger');
            return;
        }
        existing.qty      = newQty;
        existing.subtotal = newQty * price;
    } else {
        currentOrder.items.push({ code, name, price, qty, subtotal: qty * price });
    }

    renderOrderItemsTable();

    // Reset the item selector row for the next addition
    select.val('');
    $('#order-qty').val(1);
    $('#order-unit-price').text('Unit Price: 0');
});


// ------------------------- Order Items Table -------------------------
const renderOrderItemsTable = () => {
    const tbody = $('#order-items-tbody');
    tbody.empty();

    if (currentOrder.items.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center text-muted py-3">No items added yet</td></tr>');
        $('#order-grand-total').text('Rs. 0');
        return;
    }

    let grandTotal = 0;
    currentOrder.items.forEach(function (item, index) {
        grandTotal += item.subtotal;
        tbody.append(`
            <tr>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>${formatMoney(item.price)}</td>
                <td class="text-center">×${item.qty}</td>
                <td><strong>${formatMoney(item.subtotal)}</strong></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger rounded-1 px-2 py-1"
                            onclick="removeOrderItem(${index})">✕</button>
                </td>
            </tr>`);
    });

    $('#order-grand-total').text(formatMoney(grandTotal));
};


// ------------------------- Remove one item from order -------------------------
window.removeOrderItem = function (index) {
    currentOrder.items.splice(index, 1);
    renderOrderItemsTable();
};


// ------------------------- Clear current order -------------------------
$('#btn-clear-order').on('click', function () {
    currentOrder = { customerId: null, items: [] };
    renderNewOrder();
    showToast('Order cleared.', 'info');
});


// ------------------------- Place Order -------------------------
$('#btn-place-order').on('click', function () {
    const customerId = $('#order-customer-select').val();

    if (!customerId){
        showToast('Please select a customer first.', 'warning');
        return;
    }

    if (currentOrder.items.length === 0){
        showToast('Please add at least one item.', 'warning');
        return;
    }

    const customer     = getCustomerById(customerId);
    const customerName = customer ? customer.name : customerId;
    const orderId      = nextOrderId();
    const total        = currentOrder.items.reduce((sum, i) => sum + i.subtotal, 0);

    // Save the order via the model
    const savedOrder = addOrder(orderId, customerId, customerName, currentOrder.items, total);

    // Reduce stock for every item that was ordered
    currentOrder.items.forEach(function (orderedItem) {
        decrementStock(orderedItem.code, orderedItem.qty);
    });

    // Show the confirmation receipt modal
    renderConfirmationModal(savedOrder);

    // Reset the order form ready for the next transaction
    currentOrder = { customerId: null, items: [] };
});


// ------------------------- Order Confirmation modal -------------------------
const renderConfirmationModal = (order) => {
    $('#conf-order-id').text(order.id);
    $('#conf-customer').text(order.customerName);
    $('#conf-date').text(formatDateTime(order.date));

    const tbody = $('#conf-items-tbody');
    tbody.empty();
    order.items.forEach(function (item) {
        tbody.append(`
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td class="text-center">×${item.qty}</td>
                <td class="text-end"><strong>${formatMoney(item.subtotal)}</strong></td>
            </tr>`);
    });

    $('#conf-total').text(formatMoney(order.total));
    new bootstrap.Modal('#modal-confirmation').show();
};


// ------------------------- "New Order" button inside confirmation modal -------------------------
$('#btn-new-order-after').on('click', function () {
    bootstrap.Modal.getInstance('#modal-confirmation').hide();
    renderNewOrder();
});


// ------------------------- Print Receipt -------------------------
$('#btn-print-receipt').on('click', function () {
    window.print();
});