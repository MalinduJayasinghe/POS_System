const getItems = () => {
    return item_db;
};


const getItemById = (id) => {
    return item_db.find(i => i.id === id);
};


// ── Generate the next item ID ──────────────────────────────────
// e.g. ITM-003 → ITM-004
const nextItemId = () => {
    if (item_db.length === 0) return 'ITM-001';
    const numbers = item_db.map(i => parseInt(i.id.replace('ITM-', ''), 10));
    const next    = Math.max(...numbers) + 1;
    return 'ITM-' + String(next).padStart(3, '0');
};


const addItem = (id, name, price, qty) => {
    const newItem = { id, name, price, qty };
    item_db.push(newItem);
};


const updateItem = (id, name, price, qty) => {
    const item = item_db.find(i => i.id === id);
    if (item) {
        item.name  = name;
        item.price = price;
        item.qty   = qty;
    }
};


const deleteItem = (id) => {
    const index = item_db.findIndex(i => i.id === id);
    if (index !== -1) {
        item_db.splice(index, 1);
    }
};


// ── Reduce an item's stock quantity after an order ────────────
const decrementStock = (id, qtyOrdered) => {
    const item = item_db.find(i => i.id === id);
    if (item) {
        item.qty = Math.max(0, item.qty - qtyOrdered);
    }
};