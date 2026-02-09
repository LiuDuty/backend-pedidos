const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');

// Get all orders with details
router.get('/', async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: Customer },
                { model: Supplier },
                { model: OrderItem }
            ]
        });
        res.json(orders);
    } catch (err) {
        console.error(err);
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

// Get single order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
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

