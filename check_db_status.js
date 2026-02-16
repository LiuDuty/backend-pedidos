const db = require('./src/config/database');
const Customer = require('./src/models/Customer');
const Supplier = require('./src/models/Supplier');
const Order = require('./src/models/Order');
const OrderItem = require('./src/models/OrderItem');
const NotaFiscal = require('./src/models/NotaFiscal');

async function checkStatus() {
    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');

        const counts = {
            customers: await Customer.count(),
            suppliers: await Supplier.count(),
            orders: await Order.count(),
            orderItems: await OrderItem.count(),
            notasFiscais: await NotaFiscal.count(),
        };

        console.log('Database Statistics:');
        console.table(counts);

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

checkStatus();
