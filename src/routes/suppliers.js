const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Supplier = require('../models/Supplier');

// Configure multer for logo uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/logos/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'supplier-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

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

// Upload logo for supplier
router.post('/:id/logo', upload.single('logo'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
        }

        // Update supplier with logo filename
        const [updated] = await Supplier.update(
            { logo_filename: req.file.filename },
            { where: { id } }
        );

        if (updated) {
            const updatedSupplier = await Supplier.findByPk(id);
            res.json({
                message: 'Logo enviado com sucesso',
                filename: req.file.filename,
                supplier: updatedSupplier
            });
        } else {
            res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
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
