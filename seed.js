const db = require('./src/config/database');
const Customer = require('./src/models/Customer');
const Supplier = require('./src/models/Supplier');
const Order = require('./src/models/Order');
const OrderItem = require('./src/models/OrderItem');

async function seed() {
    try {
        await db.sync({ force: true });
        console.log('Database synced (all tables dropped and recreated)');

        // Seed Supplier
        const supplier = await Supplier.create({
            name: 'SERRAPLAST TRANSFORMAÇÃO E COMERCIO DE PLÁSTICOS LTDA.',
            address: 'RUA PAULO HENRIQUE BROERING',
            number: '97',
            zipcode: '88509-550',
            po_box: '1111',
            neighborhood: 'CORAL',
            city: 'LAGES',
            state: 'SC',
            phone: '49 3224-0101',
            cnpj: '04.753.929/0002-23',
            state_registration: '254729215',
            email: 'comercial@serraplast.com.br',
            logo_filename: 'serraplast.png'
        });

        // Seed Customer
        const customer = await Customer.create({
            name: 'GRANJA FARIA',
            address: 'RUA LUIZ GONZAGA BICUDO',
            number: '1313',
            zipcode: '13309-036',
            neighborhood: 'VILA NOVA',
            city: 'ITU',
            state: 'SP',
            phone: '11 4813-3154',
            contact: 'ROBERTO DE PAULA VITOR',
            email: 'adm@granjaitu.com.br',
            cnpj: '38.439.131/0001-42',
            state_registration: '3,87321E+11'
        });

        // Seed Order
        const order = await Order.create({
            orderNumber: '1',
            orderDate: '2025-09-24',
            customerOc: 'OC-12345',
            email: 'adm@granjaitu.com.br',
            deliveryDate: '2025-05-23',
            deliveryAddress: 'O MESMO',
            carrier: 'TRANSPORTADORA EXEMPLO',
            paymentTerms: '30/45 DIAS DA DATA DE FATURAMENTO, LÍQUIDO',
            observation: 'PAGO',
            customerId: customer.id,
            supplierId: supplier.id
        });

        // Seed Order Item
        await OrderItem.create({
            productName: 'BANDEJA OVO GALINHA SRG 10',
            productCode: 'BG-10',
            caseQuantity: 90,
            weight: 45.000,
            quantity: 45.00,
            unitPrice: 526.20,
            ipi: 0,
            orderId: order.id
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
