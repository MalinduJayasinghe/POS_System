
let editingCustomerId = null;


// --------------------- Customer Table ---------------------
const renderCustomers = (searchTerm) => {
    searchTerm = searchTerm || '';

    // Filter by name or ID if a search term was provided
    let list = getCustomers();
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(c =>
            c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
        );
    }

    const tbody = $('#customers-tbody');
    tbody.empty();

    if (list.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center text-muted py-4">No customers found</td></tr>');
        return;
    }

    list.forEach(function (c) {
        tbody.append(`
            <tr>
                <td class="id-cell">${c.id}</td>
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td>${escapeHtml(c.contact)}</td>
                <td>${escapeHtml(c.address || '—')}</td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-transparent rounded"
                                onclick="openEditCustomer('${c.id}')">✏ Edit</button>
                        <button class="btn btn-sm btn-danger rounded"
                                onclick="openDeleteCustomer('${c.id}')">🗑 Del</button>
                    </div>
                </td>
            </tr>`);
    });
};


// --------------------- Search Customer ---------------------
$('#cust-search').on('input', function () {
    renderCustomers($(this).val());
});


// --------------------- Open Add Customer Modal ---------------------
$('#btn-add-customer').on('click', function () {
    editingCustomerId = null;
    $('#cus-modal-title').text('Add Customer');
    $('#cus-id-display').val(nextCustomerId());
    $('#cus-name').val('');
    $('#cus-contact').val('');
    $('#cus-address').val('');
    $('#cus-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-customer').show();
});


// --------------------- Open Edit Customer Modal Window ---------------------
window.openEditCustomer = function (id) {
    const customer = getCustomerById(id);
    if (!customer) return;

    editingCustomerId = id;
    $('#cus-modal-title').text('Edit Customer');
    $('#cus-id-display').val(customer.id);
    $('#cus-name').val(customer.name);
    $('#cus-contact').val(customer.contact);
    $('#cus-address').val(customer.address || '');
    $('#cus-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-customer').show();
};


// --------------------- Delete Customer ---------------------
window.openDeleteCustomer = function (id) {
    const customer = getCustomerById(id);
    if (!customer) return;

    // Warn the user if this customer has existing orders
    const customerOrders = getOrders().filter(o => o.customerId === id);
    let warningText = '';
    if (customerOrders.length > 0) {
        warningText = `<br><small class="text-warning">⚠ This customer has ${customerOrders.length} order(s). They will remain in history.</small>`;
    }

    $('#confirm-msg').html(`Delete customer <strong>${escapeHtml(customer.name)}</strong>?${warningText}`);

    // .off('click') prevents duplicate handlers stacking up on repeated opens
    $('#btn-confirm-ok').off('click').on('click', function () {
        deleteCustomer(id);
        bootstrap.Modal.getInstance('#modal-confirm').hide();
        renderCustomers($('#cust-search').val());
        showToast('Customer deleted.');
    });

    new bootstrap.Modal('#modal-confirm').show();
};


// --------------------- Save Customer (Add and Edit) ----------------------
$('#cus-form').on('submit', function (e) {
    e.preventDefault();

    const name = $('#cus-name').val().trim();
    const contact = $('#cus-contact').val().trim();
    const address = $('#cus-address').val().trim();

    // Validate name
    let isValid = true;
    if (!name) {
        $('#cus-name').addClass('is-invalid');
        isValid = false;
    } else {
        $('#cus-name').removeClass('is-invalid');
    }

    // Validate phone number using check_phone()
    if (!contact || !check_phone(contact)) {
        $('#cus-contact').addClass('is-invalid');
        isValid = false;
    } else {
        $('#cus-contact').removeClass('is-invalid');
    }

    if (!isValid) return;

    if (editingCustomerId) {
        updateCustomer(editingCustomerId, name, contact, address);
        showToast('Customer updated successfully.');
    } else {
        addCustomer(nextCustomerId(), name, contact, address);
        showToast('Customer added successfully.');
    }

    bootstrap.Modal.getInstance('#modal-customer').hide();
    renderCustomers($('#cust-search').val());
});