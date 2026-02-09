const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Get all customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create customer
router.post('/', async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Customer.update(req.body, { where: { id } });
        if (updated) {
            const updatedCustomer = await Customer.findByPk(id);
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ error: 'Customer not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Customer.destroy({ where: { id } });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Customer not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
