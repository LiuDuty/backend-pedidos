const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./src/config/database');

// Build associations
const Customer = require('./src/models/Customer');
const Supplier = require('./src/models/Supplier');
const Order = require('./src/models/Order');
const OrderItem = require('./src/models/OrderItem');

Customer.hasMany(Order);
Order.belongsTo(Customer);

Supplier.hasMany(Order);
Order.belongsTo(Supplier);

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/customers', require('./src/routes/customers'));
app.use('/api/suppliers', require('./src/routes/suppliers'));
app.use('/api/orders', require('./src/routes/orders'));

// Test DB connection
db.authenticate()
    .then(() => console.log('Database connected...'))
    .catch(err => console.log('Error: ' + err));

// Sync database
// force: false ensures we don't drop tables on every startup
db.sync({ force: false })
    .then(() => console.log('Database synced...'))
    .catch(err => console.log('Error syncing database: ' + err));

app.get('/', (req, res) => res.send('Pedidos API Running'));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
