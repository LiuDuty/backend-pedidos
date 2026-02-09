const Sequelize = require('sequelize');
const db = require('../config/database');

const OrderItem = db.define('orderItem', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    productCode: {
        type: Sequelize.STRING
    },
    caseQuantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    weight: {
        type: Sequelize.DECIMAL(10, 3),
        defaultValue: 0.000
    },
    quantity: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
    },
    ipi: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    orderId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = OrderItem;
