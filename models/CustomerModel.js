const getCustomers = () => {
    return customer_db;
};


const getCustomerById = (id) => {
    return customer_db.find(c => c.id === id);
};


const getCustomerByIndex = (index) => {
    return customer_db[index];
};


// Finds the highest existing number and adds 1 (e.g. C003 → C004)
const nextCustomerId = () => {
    if (customer_db.length === 0) return 'C001';
    const numbers = customer_db.map(c => parseInt(c.id.replace('C', ''), 10));
    const next    = Math.max(...numbers) + 1;
    return 'C' + String(next).padStart(3, '0');
};


const addCustomer = (id, name, contact, address) => {
    const newCustomer = { id, name, contact, address };
    customer_db.push(newCustomer);
};


const updateCustomer = (id, name, contact, address) => {
    const customer = customer_db.find(c => c.id === id);
    if (customer) {
        customer.name    = name;
        customer.contact = contact;
        customer.address = address;
    }
};


const deleteCustomer = (id) => {
    const index = customer_db.findIndex(c => c.id === id);
    if (index !== -1) {
        customer_db.splice(index, 1);
    }
};