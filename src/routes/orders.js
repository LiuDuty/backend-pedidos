const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const NotaFiscal = require('../models/NotaFiscal');
const { Op } = require('sequelize');

// Get all orders with details and filters
router.get('/', async (req, res) => {
    const start = Date.now();
    try {
        const { supplierId, customerId, startDate, endDate, query } = req.query;
        let where = {};

        if (supplierId) where.supplierId = supplierId;
        if (customerId) where.customerId = customerId;

        if (startDate && endDate) {
            where.orderDate = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.orderDate = { [Op.gte]: [startDate] };
        }

        if (query) {
            where[Op.or] = [
                { orderNumber: { [Op.like]: `%${query}%` } },
                { observation: { [Op.like]: `%${query}%` } }
            ];
        }

        // Fetch structured orders
        const orders = await Order.findAll({
            where,
            include: [
                { model: Customer },
                { model: Supplier },
                { model: OrderItem }
            ],
            order: [['orderDate', 'DESC'], ['orderNumber', 'DESC']]
        });

        // Fetch legacy fiscal notes
        let legacyNotes = [];
        let nfWhere = {};
        if (query) {
            nfWhere[Op.or] = [
                { pedido: { [Op.like]: `%${query}%` } },
                { nf: { [Op.like]: `%${query}%` } },
                { cliente: { [Op.like]: `%${query}%` } },
                { produto: { [Op.like]: `%${query}%` } }
            ];
        }
        if (startDate && endDate) {
            nfWhere.data_pedido = { [Op.between]: [startDate, endDate] };
        }

        const notas = await NotaFiscal.findAll({
            where: nfWhere,
            limit: 5000,
            order: [['data_pedido', 'DESC']]
        });

        // Map NotaFiscal to Order-like structure
        legacyNotes = notas.map(n => ({
            id: `nf-${n.id}`,
            orderNumber: n.pedido || n.nf || 'S/N',
            orderDate: n.data_pedido || n.created_at,
            customer: { name: n.cliente },
            supplier: { name: 'Legacy' },
            observation: n.observacao,
            isLegacy: true,
            total: n.valor_total
        }));

        // Merge results
        const combined = [...orders, ...legacyNotes].sort((a, b) => {
            const dateA = new Date(a.orderDate).getTime() || 0;
            const dateB = new Date(b.orderDate).getTime() || 0;
            return dateB - dateA;
        });

        res.json(combined);
    } catch (err) {
        console.error('Error in GET /orders:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get next order number for a supplier/customer pair
router.get('/next-number', async (req, res) => {
    try {
        const { supplierId, customerId } = req.query;
        if (!supplierId || !customerId) {
            return res.status(400).json({ error: 'SupplierId and CustomerId are required' });
        }

        const lastOrder = await Order.findOne({
            where: { supplierId, customerId },
            order: [['orderNumber', 'DESC']]
        });

        const nextNumber = lastOrder ? parseInt(lastOrder.orderNumber) + 1 : 1;
        res.json({ nextNumber: nextNumber.toString() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get order by number, supplier and customer (unique combination)
router.get('/find', async (req, res) => {
    try {
        const { orderNumber, supplierId, customerId } = req.query;
        const order = await Order.findOne({
            where: { orderNumber, supplierId, customerId },
            include: [
                { model: Customer },
                { model: Supplier },
                { model: OrderItem }
            ]
        });

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get single order by ID (Structured or Legacy)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Handle legacy IDs
        if (id.startsWith('nf-')) {
            const legacyId = id.replace('nf-', '');
            const nota = await NotaFiscal.findByPk(legacyId);
            if (!nota) return res.status(404).json({ error: 'Nota fiscal legada não encontrada' });

            // Map to Order structure
            const mappedOrder = {
                id: `nf-${nota.id}`,
                orderNumber: nota.pedido || nota.nf || 'S/N',
                orderDate: nota.data_pedido || nota.created_at,
                customerOc: nota.oc_cliente,
                observation: nota.observacao,
                isLegacy: true,
                customer: { name: nota.cliente },
                supplier: { name: 'Legacy' },
                orderItems: [
                    {
                        productName: nota.produto,
                        quantity: nota.quantidade || 0,
                        pricePerThousand: nota.preco_unitario || 0,
                        total: nota.valor_total || 0
                    }
                ]
            };
            return res.json(mappedOrder);
        }

        const order = await Order.findByPk(id, {
            include: [
                { model: Customer },
                { model: Supplier },
                { model: OrderItem }
            ]
        });
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create order with items
router.post('/', async (req, res) => {
    try {
        const { items, ...orderData } = req.body;

        const order = await Order.create(orderData);

        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                ...item,
                orderId: order.id
            }));
            await OrderItem.bulkCreate(orderItems);
        }

        const createdOrder = await Order.findByPk(order.id, {
            include: [{ model: OrderItem }]
        });

        res.json(createdOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update order
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { items, ...orderData } = req.body;

        const [updated] = await Order.update(orderData, { where: { id } });

        if (updated) {
            await OrderItem.destroy({ where: { orderId: id } });

            if (items && items.length > 0) {
                const orderItems = items.map(item => ({
                    ...item,
                    orderId: id
                }));
                await OrderItem.bulkCreate(orderItems);
            }

            const updatedOrder = await Order.findByPk(id, { include: [{ model: OrderItem }] });
            res.json(updatedOrder);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await OrderItem.destroy({ where: { orderId: id } });
        const deleted = await Order.destroy({ where: { id } });

        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

