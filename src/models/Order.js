const Sequelize = require('sequelize');
const db = require('../config/database');

const Order = db.define('order', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNumber: {
        type: Sequelize.STRING,
        allowNull: false
    },
    orderDate: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.NOW
    },
    customerOc: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    deliveryDate: {
        type: Sequelize.DATEONLY
    },
    // Dados de Entrega
    deliveryName: { type: Sequelize.STRING },
    deliveryAddress: { type: Sequelize.STRING },
    deliveryCity: { type: Sequelize.STRING },
    deliveryState: { type: Sequelize.STRING },
    deliveryCnpj: { type: Sequelize.STRING },
    deliveryIe: { type: Sequelize.STRING },
    deliveryZip: { type: Sequelize.STRING },
    deliveryPhone: { type: Sequelize.STRING },

    // Dados de Cobrança
    billingAddress: { type: Sequelize.STRING },
    billingCity: { type: Sequelize.STRING },
    billingState: { type: Sequelize.STRING },

    carrier: { type: Sequelize.STRING },
    carrierPhone: { type: Sequelize.STRING },
    carrierContact: { type: Sequelize.STRING },
    freightType: { type: Sequelize.STRING }, // CIF/FOB
    paymentTerms: { type: Sequelize.STRING },
    observation: { type: Sequelize.TEXT },

    customerId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    supplierId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['orderNumber', 'supplierId', 'customerId']
        }
    ]
});

module.exports = Order;
