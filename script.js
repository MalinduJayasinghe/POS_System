'use strict';

// ── Credentials ─────────────────────────────────────────────
const CREDENTIALS = { username: 'admin', password: 'admin123' };

// ── Data helpers ─────────────────────────────────────────────
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    getObj: (key, def = {}) => JSON.parse(localStorage.getItem(key) || JSON.stringify(def)),
    setObj: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
};

// Seed demo data on first run
function seedData() {
    if (!localStorage.getItem('pos_seeded')) {
        DB.set('customers', [
            { id: 'C001', name: 'John Silva',   contact: '+94 77 123 4567', address: 'Colombo, LK' },
            { id: 'C002', name: 'Mary Perera',  contact: '+94 71 987 6543', address: 'Kandy, LK' },
            { id: 'C003', name: 'Kasun Raj',    contact: '+94 76 555 0001', address: 'Galle, LK' },
        ]);
        DB.set('items', [
            { id: 'ITM-001', name: 'Wireless Mouse',      price: 2000,  qty: 45 },
            { id: 'ITM-002', name: 'USB-C Hub',            price: 500,   qty: 12 },
            { id: 'ITM-003', name: 'Mechanical Keyboard',  price: 6000,  qty: 0  },
        ]);
        DB.set('orders', [
            {
                id: 'ORD-0010', customerId: 'C003', customerName: 'Kasun Silva',
                date: '2026-04-08T14:20:00',
                items: [{ code:'ITM-001', name:'Wireless Mouse', price:2000, qty:1, subtotal:2000 },
                    { code:'ITM-002', name:'USB-C Hub',       price:500,  qty:2, subtotal:1000 }],
                total: 3000
            },
            {
                id: 'ORD-0011', customerId: 'C002', customerName: 'Mary Perera',
                date: '2026-04-09T09:05:00',
                items: [{ code:'ITM-001', name:'Wireless Mouse', price:2000, qty:1, subtotal:2000 }],
                total: 2000
            },
            {
                id: 'ORD-0012', customerId: 'C001', customerName: 'John Silva',
                date: '2026-04-09T11:14:00',
                items: [{ code:'ITM-002', name:'USB-C Hub', price:500, qty:3, subtotal:1500 }],
                total: 1500
            },
        ]);
        localStorage.setItem('pos_seeded', '1');
    }
}

// ── Session ──────────────────────────────────────────────────
const Session = {
    login: (u) => sessionStorage.setItem('pos_user', u),
    logout: () => { sessionStorage.removeItem('pos_user'); },
    user: () => sessionStorage.getItem('pos_user'),
    isLoggedIn: () => !!sessionStorage.getItem('pos_user'),
};

// ── Current order state ──────────────────────────────────────
let currentOrder = { customerId: null, items: [] };
let editingCustomerId = null;
let editingItemId = null;

// ── ID generators ─────────────────────────────────────────────
function nextCustomerId() {
    const custs = DB.get('customers');
    if (!custs.length) return 'C001';
    const nums = custs.map(c => parseInt(c.id.replace('C',''),10));
    return 'C' + String(Math.max(...nums)+1).padStart(3,'0');
}
function nextItemId() {
    const items = DB.get('items');
    if (!items.length) return 'ITM-001';
    const nums = items.map(i => parseInt(i.id.replace('ITM-',''),10));
    return 'ITM-' + String(Math.max(...nums)+1).padStart(3,'0');
}
function nextOrderId() {
    const orders = DB.get('orders');
    if (!orders.length) return 'ORD-0001';
    const nums = orders.map(o => parseInt(o.id.replace('ORD-',''),10));
    return 'ORD-' + String(Math.max(...nums)+1).padStart(4,'0');
}

// ── Toast notifications ──────────────────────────────────────
function showToast(msg, type='success') {
    const id = 'toast-' + Date.now();
    const icons = { success:'✓', danger:'✕', warning:'⚠', info:'ℹ' };
    const html = `
    <div id="${id}" class="toast align-items-center text-white bg-${type==='success'?'success':type==='danger'?'danger':type==='warning'?'warning text-dark':'primary'} border-0" role="alert" style="min-width:260px;border-radius:10px;">
      <div class="d-flex">
        <div class="toast-body fw-semibold">${icons[type]||'•'} ${msg}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
    $('#toast-area').append(html);
    const el = document.getElementById(id);
    const t = new bootstrap.Toast(el, { delay: 3200 });
    t.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

// ── Routing / View switching ──────────────────────────────────
function showView(viewId) {
    $('.view').removeClass('active');
    $('#' + viewId).addClass('active');
    // Update active nav link
    $('.nav-link-item').removeClass('active');
    $(`.nav-link-item[data-view="${viewId}"]`).addClass('active');
    // Refresh content
    switch (viewId) {
        case 'dashboard':  renderDashboard();  break;
        case 'view-customers':  renderCustomers();  break;
        case 'view-items':      renderItems();      break;
        case 'view-orders':     renderNewOrder();   break;
        case 'view-history':    renderHistory();    break;
    }
    window.scrollTo(0, 0);
}

function requireAuth() {
    if (!Session.isLoggedIn()) { showView('login'); }
}

// ── Formatting helpers ────────────────────────────────────────
function fmtMoney(n) { return 'Rs. ' + Number(n).toLocaleString(); }
function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
        + ' · ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
function fmtDateShort(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function today() {
    return new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════
$('#login-form').on('submit', function(e) {
    e.preventDefault();
    const u = $('#login-username').val().trim();
    const p = $('#login-password').val();
    if (u === CREDENTIALS.username && p === CREDENTIALS.password) {
        $('#login-error').hide();
        Session.login(u);
        showView('dashboard');
    } else {
        $('#login-error').show();
    }
});

$('#btn-logout').on('click', function() {
    Session.logout();
    currentOrder = { customerId: null, items: [] };
    showView('login');
});

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function renderDashboard() {
    const customers = DB.get('customers');
    const items     = DB.get('items');
    const orders    = DB.get('orders');

    const today = new Date(); today.setHours(0,0,0,0);
    const todayOrders = orders.filter(o => new Date(o.date) >= today);
    const revenue = todayOrders.reduce((s,o) => s+o.total, 0);
    const inStock = items.reduce((s,i) => s+(i.qty>0?1:0), 0);

    $('#customers').text(customers.length);
    $('#items').text(inStock);
    $('#orders').text(todayOrders.length);
    $('#revenue').text(fmtMoney(revenue));
    $('#date').text(new Date().toLocaleDateString('en-US', {weekday:'long',year:'numeric',month:'long',day:'numeric'}));

    // Recent orders (last 5, newest first)
    const recent = [...orders].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
    const tbody = $('#dash-orders-body');
    tbody.empty();
    if (!recent.length) {
        tbody.html(`<tr><td colspan="5" class="text-center text-muted py-4">No orders yet</td></tr>`);
        return;
    }
    recent.forEach(o => {
        tbody.append(`
      <tr>
        <td class="id-cell">${o.id}</td>
        <td>${escHtml(o.customerName)}</td>
        <td>${fmtDateShort(o.date)}</td>
        <td><strong>${fmtMoney(o.total)}</strong></td>
        <td><span class="pos-badge badge-success">Completed</span></td>
      </tr>`);
    });
}

// ════════════════════════════════════════════════════════════
// CUSTOMERS
// ════════════════════════════════════════════════════════════
function renderCustomers(filter='') {
    let custs = DB.get('customers');
    if (filter) {
        const q = filter.toLowerCase();
        custs = custs.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }
    const tbody = $('#customers-tbody');
    tbody.empty();
    if (!custs.length) {
        tbody.html(`<tr><td colspan="5" class="text-center text-muted py-4">No customers found</td></tr>`);
        return;
    }
    custs.forEach(c => {
        tbody.append(`
      <tr>
        <td class="id-cell">${c.id}</td>
        <td><strong>${escHtml(c.name)}</strong></td>
        <td>${escHtml(c.contact)}</td>
        <td>${escHtml(c.address||'—')}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-pos-ghost rounded" onclick="editCustomer('${c.id}')">✏ Edit</button>
            <button class="btn btn-sm btn-pos-danger rounded" onclick="deleteCustomer('${c.id}')">🗑 Del</button>
          </div>
        </td>
      </tr>`);
    });
}

$('#cust-search').on('input', function() { renderCustomers($(this).val()); });

$('#btn-add-customer').on('click', function() {
    editingCustomerId = null;
    $('#cust-modal-title').text('Add Customer');
    $('#cust-id-display').val(nextCustomerId());
    $('#cust-name').val(''); $('#cust-contact').val(''); $('#cust-address').val('');
    $('#cust-form')[0].reset();
    $('#cust-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-customer').show();
});

window.editCustomer = function(id) {
    const c = DB.get('customers').find(x => x.id===id);
    if (!c) return;
    editingCustomerId = id;
    $('#cust-modal-title').text('Edit Customer');
    $('#cust-id-display').val(c.id);
    $('#cust-name').val(c.name);
    $('#cust-contact').val(c.contact);
    $('#cust-address').val(c.address||'');
    $('#cust-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-customer').show();
};

window.deleteCustomer = function(id) {
    const c = DB.get('customers').find(x => x.id===id);
    if (!c) return;
    const orders = DB.get('orders').filter(o => o.customerId===id);
    const extra = orders.length ? `<br><small class="text-warning">⚠ This customer has ${orders.length} order(s). They will remain in history.</small>` : '';
    $('#confirm-msg').html(`Delete customer <strong>${escHtml(c.name)}</strong>?${extra}`);
    $('#btn-confirm-ok').off('click').on('click', function() {
        let custs = DB.get('customers').filter(x => x.id!==id);
        DB.set('customers', custs);
        bootstrap.Modal.getInstance('#modal-confirm').hide();
        renderCustomers($('#cust-search').val());
        showToast('Customer deleted.');
    });
    new bootstrap.Modal('#modal-confirm').show();
};

$('#cust-form').on('submit', function(e) {
    e.preventDefault();
    const name    = $('#cust-name').val().trim();
    const contact = $('#cust-contact').val().trim();
    const address = $('#cust-address').val().trim();
    let valid = true;

    $('#cust-name').toggleClass('is-invalid', !name);
    if (!contact || !/^\+?[\d\s\-]{7,15}$/.test(contact)) {
        $('#cust-contact').addClass('is-invalid'); valid = false;
    } else { $('#cust-contact').removeClass('is-invalid'); }
    if (!name) valid = false;
    if (!valid) return;

    let custs = DB.get('customers');
    if (editingCustomerId) {
        custs = custs.map(c => c.id===editingCustomerId ? {...c, name, contact, address} : c);
        DB.set('customers', custs);
        showToast('Customer updated successfully.');
    } else {
        const id = nextCustomerId();
        custs.push({ id, name, contact, address });
        DB.set('customers', custs);
        showToast('Customer added successfully.');
    }
    bootstrap.Modal.getInstance('#modal-customer').hide();
    renderCustomers($('#cust-search').val());
});

// ════════════════════════════════════════════════════════════
// ITEMS
// ════════════════════════════════════════════════════════════
function renderItems(filter='') {
    let items = DB.get('items');
    if (filter) {
        const q = filter.toLowerCase();
        items = items.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    const tbody = $('#items-tbody');
    tbody.empty();
    if (!items.length) {
        tbody.html(`<tr><td colspan="6" class="text-center text-muted py-4">No items found</td></tr>`);
        return;
    }
    items.forEach(item => {
        const oos = item.qty === 0;
        tbody.append(`
      <tr class="${oos?'oos-row':''}">
        <td class="id-cell">${item.id}</td>
        <td><strong>${escHtml(item.name)}</strong></td>
        <td>${fmtMoney(item.price)}</td>
        <td>${oos ? `<span style="color:var(--oos-text);font-weight:600">${item.qty} units</span>` : item.qty+' units'}</td>
        <td>${oos
            ? `<span class="pos-badge badge-oos">Out of Stock</span>`
            : `<span class="pos-badge badge-success">In Stock</span>`}</td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-pos-ghost rounded" onclick="editItem('${item.id}')">✏ Edit</button>
            <button class="btn btn-sm btn-pos-danger rounded" onclick="deleteItem('${item.id}')">🗑 Del</button>
          </div>
        </td>
      </tr>`);
    });
}

$('#item-search').on('input', function() { renderItems($(this).val()); });

$('#btn-add-item').on('click', function() {
    editingItemId = null;
    $('#item-modal-title').text('Add Item');
    $('#item-code').val(nextItemId()).prop('readonly', false);
    $('#item-name').val(''); $('#item-price').val(''); $('#item-qty').val('');
    $('#item-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-item').show();
});

window.editItem = function(id) {
    const item = DB.get('items').find(x => x.id===id);
    if (!item) return;
    editingItemId = id;
    $('#item-modal-title').text('Edit Item');
    $('#item-code').val(item.id).prop('readonly', true);
    $('#item-name').val(item.name);
    $('#item-price').val(item.price);
    $('#item-qty').val(item.qty);
    $('#item-form .is-invalid').removeClass('is-invalid');
    new bootstrap.Modal('#modal-item').show();
};

window.deleteItem = function(id) {
    const item = DB.get('items').find(x => x.id===id);
    if (!item) return;
    const usedInOrders = DB.get('orders').some(o => o.items.some(i => i.code===id));
    const extra = usedInOrders ? `<br><small class="text-warning">⚠ This item appears in past orders.</small>` : '';
    $('#confirm-msg').html(`Delete item <strong>${escHtml(item.name)}</strong>?${extra}`);
    $('#btn-confirm-ok').off('click').on('click', function() {
        DB.set('items', DB.get('items').filter(x => x.id!==id));
        bootstrap.Modal.getInstance('#modal-confirm').hide();
        renderItems($('#item-search').val());
        showToast('Item deleted.');
    });
    new bootstrap.Modal('#modal-confirm').show();
};

$('#item-form').on('submit', function(e) {
    e.preventDefault();
    const code  = $('#item-code').val().trim();
    const name  = $('#item-name').val().trim();
    const price = parseFloat($('#item-price').val());
    const qty   = parseInt($('#item-qty').val(), 10);
    let valid = true;

    if (!code) { $('#item-code').addClass('is-invalid'); valid=false; } else { $('#item-code').removeClass('is-invalid'); }
    if (!name) { $('#item-name').addClass('is-invalid'); valid=false; } else { $('#item-name').removeClass('is-invalid'); }
    if (!price || price<=0) { $('#item-price').addClass('is-invalid'); valid=false; } else { $('#item-price').removeClass('is-invalid'); }
    if (isNaN(qty)||qty<0) { $('#item-qty').addClass('is-invalid'); valid=false; } else { $('#item-qty').removeClass('is-invalid'); }
    if (!valid) return;

    let items = DB.get('items');
    if (editingItemId) {
        items = items.map(i => i.id===editingItemId ? {...i, name, price, qty} : i);
        DB.set('items', items);
        showToast('Item updated successfully.');
    } else {
        if (items.find(i => i.id===code)) {
            $('#item-code').addClass('is-invalid');
            $('#item-code-feedback').text('Item code already exists.');
            return;
        }
        items.push({ id:code, name, price, qty });
        DB.set('items', items);
        showToast('Item added successfully.');
    }
    bootstrap.Modal.getInstance('#modal-item').hide();
    renderItems($('#item-search').val());
});

// ════════════════════════════════════════════════════════════
// NEW ORDER
// ════════════════════════════════════════════════════════════
function renderNewOrder() {
    // Populate customer dropdown
    const customers = DB.get('customers');
    const $csel = $('#order-customer-select');
    $csel.html('<option value="">Choose a customer…</option>');
    customers.forEach(c => {
        $csel.append(`<option value="${c.id}">${c.id} — ${escHtml(c.name)}</option>`);
    });
    if (currentOrder.customerId) $csel.val(currentOrder.customerId);

    // Populate item dropdown
    const items = DB.get('items');
    const $isel = $('#order-item-select');
    $isel.html('<option value="">Select item…</option>');
    items.filter(i=>i.qty>0).forEach(i => {
        $isel.append(`<option value="${i.id}" data-price="${i.price}" data-qty="${i.qty}">${i.id} — ${escHtml(i.name)}</option>`);
    });

    // Show new order ID
    $('#order-id-display').text(nextOrderId());

    renderOrderItems();
}

$('#order-item-select').on('change', function() {
    const opt = $(this).find(':selected');
    const price = opt.data('price') || 0;
    $('#order-unit-price').text(price ? fmtMoney(price) : 'Unit Price: —');
});

$('#btn-add-order-item').on('click', function() {
    const sel = $('#order-item-select');
    const opt = sel.find(':selected');
    const code  = sel.val();
    const price = parseFloat(opt.data('price'));
    const maxQty = parseInt(opt.data('qty'), 10);
    const qty   = parseInt($('#order-qty').val(), 10);
    const name  = opt.text().split(' — ')[1] || opt.text();

    if (!code) { showToast('Please select an item.', 'warning'); return; }
    if (!qty || qty < 1) { showToast('Quantity must be at least 1.', 'warning'); return; }
    if (qty > maxQty) { showToast(`Only ${maxQty} units available.`, 'danger'); return; }

    // Check if already in order
    const existing = currentOrder.items.find(i => i.code===code);
    if (existing) {
        const newQty = existing.qty + qty;
        if (newQty > maxQty) { showToast(`Cannot exceed available stock (${maxQty}).`, 'danger'); return; }
        existing.qty = newQty;
        existing.subtotal = newQty * price;
    } else {
        currentOrder.items.push({ code, name, price, qty, subtotal: qty*price });
    }
    renderOrderItems();
    sel.val(''); $('#order-qty').val(1); $('#order-unit-price').text('Unit Price: —');
});

function renderOrderItems() {
    const tbody = $('#order-items-tbody');
    tbody.empty();
    if (!currentOrder.items.length) {
        tbody.html(`<tr><td colspan="5" class="text-center text-muted py-3">No items added yet</td></tr>`);
        $('#order-grand-total').text('Rs. 0');
        return;
    }
    let grand = 0;
    currentOrder.items.forEach((item, idx) => {
        grand += item.subtotal;
        tbody.append(`
      <tr>
        <td><strong>${escHtml(item.name)}</strong></td>
        <td>${fmtMoney(item.price)}</td>
        <td class="text-center">×${item.qty}</td>
        <td><strong>${fmtMoney(item.subtotal)}</strong></td>
        <td class="text-center">
          <button class="btn btn-sm btn-pos-danger rounded-1 px-2 py-1" onclick="removeOrderItem(${idx})">✕</button>
        </td>
      </tr>`);
    });
    $('#order-grand-total').text(fmtMoney(grand));
}

window.removeOrderItem = function(idx) {
    currentOrder.items.splice(idx, 1);
    renderOrderItems();
};

$('#btn-clear-order').on('click', function() {
    currentOrder = { customerId: null, items: [] };
    renderNewOrder();
    showToast('Order cleared.', 'info');
});

$('#btn-place-order').on('click', function() {
    const custId = $('#order-customer-select').val();
    if (!custId) { showToast('Please select a customer first.', 'warning'); return; }
    if (!currentOrder.items.length) { showToast('Please add at least one item.', 'warning'); return; }

    const custName = DB.get('customers').find(c=>c.id===custId)?.name || custId;
    currentOrder.customerId = custId;

    // Build order
    const orderId = nextOrderId();
    const total = currentOrder.items.reduce((s,i) => s+i.subtotal, 0);
    const order = {
        id: orderId,
        customerId: custId,
        customerName: custName,
        date: new Date().toISOString(),
        items: [...currentOrder.items],
        total
    };

    // Save order
    const orders = DB.get('orders');
    orders.push(order);
    DB.set('orders', orders);

    // Decrement stock
    let items = DB.get('items');
    currentOrder.items.forEach(oi => {
        items = items.map(i => i.id===oi.code ? {...i, qty: Math.max(0, i.qty-oi.qty)} : i);
    });
    DB.set('items', items);

    // Show confirmation modal
    showOrderConfirmation(order);

    // Reset order
    currentOrder = { customerId: null, items: [] };
});

function showOrderConfirmation(order) {
    $('#conf-order-id').text(order.id);
    $('#conf-customer').text(order.customerName);
    $('#conf-date').text(fmtDate(order.date));

    const tbody = $('#conf-items-tbody');
    tbody.empty();
    order.items.forEach(item => {
        tbody.append(`
      <tr>
        <td>${escHtml(item.name)}</td>
        <td class="text-center">×${item.qty}</td>
        <td class="text-end"><strong>${fmtMoney(item.subtotal)}</strong></td>
      </tr>`);
    });
    $('#conf-total').text(fmtMoney(order.total));

    new bootstrap.Modal('#modal-confirmation').show();
}

$('#btn-new-order-after').on('click', function() {
    bootstrap.Modal.getInstance('#modal-confirmation').hide();
    renderNewOrder();
});

$('#btn-print-receipt').on('click', function() {
    window.print();
});

// ════════════════════════════════════════════════════════════
// ORDER HISTORY
// ════════════════════════════════════════════════════════════
function renderHistory(searchTerm='', fromDate='', toDate='') {
    let orders = DB.get('orders').sort((a,b)=>new Date(b.date)-new Date(a.date));

    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        orders = orders.filter(o => o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
    }
    if (fromDate) {
        const from = new Date(fromDate); from.setHours(0,0,0,0);
        orders = orders.filter(o => new Date(o.date) >= from);
    }
    if (toDate) {
        const to = new Date(toDate); to.setHours(23,59,59,999);
        orders = orders.filter(o => new Date(o.date) <= to);
    }

    $('#hist-count').text(`Showing ${orders.length} order${orders.length!==1?'s':''}`);

    const tbody = $('#history-tbody');
    tbody.empty();
    if (!orders.length) {
        tbody.html(`<tr><td colspan="5" class="text-center text-muted py-4">No orders found</td></tr>`);
        return;
    }
    orders.forEach(o => {
        const itemBadges = o.items.slice(0,2).map(i =>
                `<span class="pos-badge badge-blue me-1">${escHtml(i.name)} ×${i.qty}</span>`).join('') +
            (o.items.length>2 ? `<span class="pos-badge badge-blue">+${o.items.length-2} more</span>` : '');
        tbody.append(`
      <tr>
        <td class="id-cell">${o.id}</td>
        <td><strong>${escHtml(o.customerName)}</strong></td>
        <td style="color:var(--text-3)">${fmtDate(o.date)}</td>
        <td>${itemBadges}</td>
        <td class="text-end"><strong style="font-family:var(--font-head)">${fmtMoney(o.total)}</strong></td>
      </tr>`);
    });
}

$('#hist-filter-btn').on('click', function() {
    renderHistory($('#hist-search').val(), $('#hist-from').val(), $('#hist-to').val());
});
$('#hist-clear-btn').on('click', function() {
    $('#hist-search').val(''); $('#hist-from').val(''); $('#hist-to').val('');
    renderHistory();
});
$('#hist-search').on('input', function() {
    renderHistory($(this).val(), $('#hist-from').val(), $('#hist-to').val());
});

// ── Security: block back-navigation after logout ──────────────
window.addEventListener('popstate', function() {
    if (!Session.isLoggedIn()) showView('login');
});

// ── Escape HTML helper ────────────────────────────────────────
function escHtml(s) {
    return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ─────────────────────────────────────────────────────
$(function() {
    seedData();
    if (Session.isLoggedIn()) {
        showView('dashboard');
    } else {
        showView('login');
    }

    // Nav clicks
    $(document).on('click', '.nav-link-item', function() {
        if (!Session.isLoggedIn()) return;
        showView($(this).data('view'));
    });

    // ---------------- Quick Access ----------------

    $('#btn-customer').on('click', function() { showView('view-customers'); setTimeout(()=>$('#btn-add-customer').trigger('click'),100); });
    $('#btn-item').on('click', function() { showView('view-items'); setTimeout(()=>$('#btn-add-item').trigger('click'),100); });
    $('#btn-order').on('click', function() { showView('view-orders'); });
});