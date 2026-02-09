const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');

// Get all suppliers
router.get('/', async (req, res) => {
    try {
        const suppliers = await Supplier.findAll();
        res.json(suppliers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create supplier
router.post('/', async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.json(supplier);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update supplier
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Supplier.update(req.body, { where: { id } });
        if (updated) {
            const updatedSupplier = await Supplier.findByPk(id);
            res.json(updatedSupplier);
        } else {
            res.status(404).json({ error: 'Supplier not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Supplier.destroy({ where: { id } });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Supplier not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
