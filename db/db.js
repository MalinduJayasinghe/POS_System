

let customer_db = [
    { id: 'C001', name: 'John Silva', contact: '0771234567', address: 'Colombo'},
    { id: 'C002', name: 'Nimal Perera', contact: '0719876543', address: 'Kandy'},
    { id: 'C003', name: 'Kasun Perera', contact: '0765550001', address: 'Galle'}
];

let item_db = [
    { id: 'ITM-001', name: 'Wireless Mouse', price: 2000, qty: 45 },
    { id: 'ITM-002', name: 'USB-C Hub', price: 500,  qty: 12 },
    { id: 'ITM-003', name: 'Keyboard', price: 6000, qty: 0},
];

let order_db = [
    {
        id: 'ORD-0001', customerId: 'C003', customerName: 'Kasun Perera', date: '2026-04-08T14:20:00',
        items: [
            { code: 'ITM-001', name: 'Wireless Mouse', price: 2000, qty: 1, subtotal: 2000 },
            { code: 'ITM-002', name: 'USB-C Hub',       price: 500,  qty: 2, subtotal: 1000 },
        ],
        total: 3000
    },
    {
        id: 'ORD-0002', customerId: 'C002', customerName: 'Nimal Perera', date: '2026-04-09T09:05:00',
        items: [
            { code: 'ITM-001', name: 'Wireless Mouse', price: 2000, qty: 1, subtotal: 2000 },
        ],
        total: 2000
    },
    {
        id: 'ORD-0003', customerId: 'C001', customerName: 'John Silva', date: '2026-04-09T11:14:00',
        items: [
            { code: 'ITM-002', name: 'USB-C Hub', price: 500, qty: 3, subtotal: 1500 },
        ],
        total: 1500
    },
];