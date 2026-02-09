const Sequelize = require('sequelize');
const db = require('../config/database');

const Customer = db.define('customer', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    address: {
        type: Sequelize.STRING
    },
    number: {
        type: Sequelize.STRING
    },
    zipcode: {
        type: Sequelize.STRING
    },
    po_box: {
        type: Sequelize.STRING
    },
    neighborhood: {
        type: Sequelize.STRING
    },
    city: {
        type: Sequelize.STRING
    },
    state: {
        type: Sequelize.STRING
    },
    phone: {
        type: Sequelize.STRING
    },
    contact: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    cnpj: {
        type: Sequelize.STRING
    },
    state_registration: {
        type: Sequelize.STRING
    }
});

module.exports = Customer;
