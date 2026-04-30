
let editingItemId = null;


// -------------------- Items Table --------------------
const renderItems = (searchTerm) => {
    searchTerm = searchTerm || '';

    // Filter by name or item code if a search term was provided
    let list = getItems();
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(i =>
            i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
        );
    }

    const tbody = $('#items-tbody');
    tbody.empty();

    if (list.length === 0) {
        tbody.html('<tr><td colspan="6" class="text-center text-muted py-4">No items found</td></tr>');
        return;
    }

    list.forEach(function (item) {
        const isOutOfStock = item.qty === 0;

        // Quantity cell — styled differently when out of stock
        const qtyCell = isOutOfStock
            ? `<span style="color:var(--oos-text); font-weight:600">${item.qty} units</span>`
            : item.qty + ' units';

        // Status badge
        const statusBadge = isOutOfStock
            ? `<span class="pos-badge badge-danger">Out of Stock</span>`
            : `<span class="pos-badge badge-success">In Stock</span>`;

        tbody.append(`
            <tr class="${isOutOfStock ? 'oos-row' : ''}">
                <td class="id-cell">${item.id}</td>
                <td><strong>${escapeHtml(item.name)}</strong></td>
                <td>${formatMoney(item.price)}</td>
                <td>${qtyCell}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-transparent rounded"
                                onclick="openEditItem('${item.id}')">✏ Edit</button>
                        <button class="btn btn-sm btn-danger rounded"
                                onclick="openDeleteItem('${item.id}')">🗑 Del</button>
                    </div>
                </td>
            </tr>`);
    });
};


// -------------------- Search Item --------------------
$('#item-search').on('input', function () {
    renderItems($(this).val());
});


// -------------------- Add Item Modal Window --------------------
$('#btn-add-item').on('click', function () {
    editingItemId = null;
    $('#item-modal-title').text('Add Item');
    $('#item-code').val(nextItemId()).prop('readonly', false);
    $('#item-name').val('');
    $('#item-price').val('');
    $('#item-qty').val('');
    $('#item-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-item').show();
});


// -------------------- Edit Item Modal Window --------------------
window.openEditItem = function (id) {
    const item = getItemById(id);
    if (!item) return;

    editingItemId = id;
    $('#item-modal-title').text('Edit Item');
    $('#item-code').val(item.id).prop('readonly', true); // item code cannot be changed after creation
    $('#item-name').val(item.name);
    $('#item-price').val(item.price);
    $('#item-qty').val(item.qty);
    $('#item-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-item').show();
};


// -------------------- Delete Item --------------------
window.openDeleteItem = function (id) {
    const item = getItemById(id);
    if (!item) return;

    // Warn if this item appears in any past order
    const usedInOrders = getOrders().some(o => o.items.some(i => i.code === id));
    const warningText  = usedInOrders ? '<br><small class="text-warning">⚠ This item appears in past orders.</small>' : '';

    $('#confirm-msg').html(`Delete item <strong>${escapeHtml(item.name)}</strong>?${warningText}`);

    // .off('click') prevents duplicate handlers stacking up on repeated opens
    $('#btn-confirm-ok').off('click').on('click', function () {
        deleteItem(id);
        bootstrap.Modal.getInstance('#modal-confirm').hide();
        renderItems($('#item-search').val());
        showToast('Item deleted.');
    });

    new bootstrap.Modal('#modal-confirm').show();
};


// -------------------- Save Item (Add and Edit) --------------------
$('#item-form').on('submit', function (e) {

    e.preventDefault();

    const code  = $('#item-code').val().trim();
    const name  = $('#item-name').val().trim();
    const price = parseFloat($('#item-price').val());
    const qty   = parseInt($('#item-qty').val(), 10);

    // Validate all four fields
    let isValid = true;

    if (!code) {
        $('#item-code').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-code').removeClass('is-invalid');
    }

    if (!name) {
        $('#item-name').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-name').removeClass('is-invalid');
    }

    if (!price || price <= 0) {
        $('#item-price').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-price').removeClass('is-invalid');
    }

    if (isNaN(qty) || qty < 0) {
        $('#item-qty').addClass('is-invalid');
        isValid = false;
    } else {
        $('#item-qty').removeClass('is-invalid');
    }

    if (!isValid) return;

    if (editingItemId) {
        // Update existing item
        updateItem(editingItemId, name, price, qty);
        showToast('Item updated successfully.');
    } else {
        // Reject duplicate item codes
        if (getItemById(code)) {
            $('#item-code').addClass('is-invalid');
            $('#item-code-feedback').text('Item code already exists.');
            return;
        }
        addItem(code, name, price, qty);
        showToast('Item added successfully.');
    }

    bootstrap.Modal.getInstance('#modal-item').hide();
    renderItems($('#item-search').val());
});