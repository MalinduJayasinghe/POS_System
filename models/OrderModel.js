const getOrders = () => {
    return order_db;
};


// ── Generate the next order ID ────────────────────────────────
// e.g. ORD-0002 → ORD-0003
const nextOrderId = () => {
    if (order_db.length === 0) return 'ORD-0001';
    const numbers = order_db.map(o => parseInt(o.id.replace('ORD-', ''), 10));
    const next    = Math.max(...numbers) + 1;
    return 'ORD-' + String(next).padStart(4, '0');
};


const addOrder = (id, customerId, customerName, items, total) => {
    const newOrder = {
        id,
        customerId,
        customerName,
        date:  new Date().toISOString(),
        items: [...items],
        total
    };
    order_db.push(newOrder);
    return newOrder;
};