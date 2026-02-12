const express = require('express');
const router = express.Router();
const NotaFiscal = require('../models/NotaFiscal');

// Get all notes
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let whereClause = {};

        if (search) {
            const { Op } = require('sequelize');
            whereClause = {
                [Op.or]: [
                    { cliente: { [Op.like]: `%${search}%` } },
                    { produto: { [Op.like]: `%${search}%` } },
                    { nf: { [Op.like]: `%${search}%` } },
                    { pedido: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        const notas = await NotaFiscal.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']]
        });
        res.json(notas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single note
router.get('/:id', async (req, res) => {
    try {
        const nota = await NotaFiscal.findByPk(req.params.id);
        if (!nota) return res.status(404).json({ message: 'Nota não encontrada' });
        res.json(nota);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create note
router.post('/', async (req, res) => {
    try {
        const novaNota = await NotaFiscal.create(req.body);
        res.status(201).json(novaNota);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update note
router.put('/:id', async (req, res) => {
    try {
        console.log(`Updating record ID: ${req.params.id}`);
        console.log('Update body:', req.body);
        const nota = await NotaFiscal.findByPk(req.params.id);
        if (!nota) {
            console.log(`Record with ID ${req.params.id} not found`);
            return res.status(404).json({ message: 'Nota não encontrada' });
        }

        const { id, created_at, ...updateData } = req.body;
        await nota.update(updateData);
        console.log('Update successful');
        res.json(nota);
    } catch (err) {
        console.error('Update error:', err);
        res.status(400).json({ message: err.message });
    }
});

// Delete note
router.delete('/:id', async (req, res) => {
    try {
        const nota = await NotaFiscal.findByPk(req.params.id);
        if (!nota) return res.status(404).json({ message: 'Nota não encontrada' });

        await nota.destroy();
        res.json({ message: 'Nota deletada com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
