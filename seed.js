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
            name: 'HORTA VITAE DISTRIBUIDORA DE ALIMENTOS LTDA.',
            address: 'RUA BENEDITO ISAAC PIRES',
            number: '600',
            zipcode: '06716-300',
            neighborhood: 'VILA MARANHÃO',
            city: 'COTIA',
            state: 'SP',
            phone: '14 3812-7000',
            contact: 'RENATO BOARO',
            email: 'compras@hortavitae.com.br',
            cnpj: '74.242.876/0001-80',
            state_registration: '278.121.234.114'
        });

        // Seed Order 614 (from image)
        const orderValueQty = 5200;
        const orderValuePriceM = 1328.00;
        const subtotalValue = (orderValueQty * orderValuePriceM) / 1000;
        const ipiValue = 9.75;
        const totalValue = subtotalValue + (subtotalValue * ipiValue / 100);

        const order = await Order.create({
            orderNumber: '614',
            orderDate: '2025-12-04',
            customerOc: 'OC-614',
            email: 'nfe@hortavitae.com.br',
            deliveryDate: '2025-12-10',
            deliveryName: 'MARCELO PEREIRA (FAZENDA SANTA EMILIA)',
            deliveryAddress: 'RODOVIA MARECHAL RONDON, KM 280 - ZONA RURAL',
            deliveryCity: 'SÃO MANUEL',
            deliveryState: 'SP',
            deliveryCnpj: '13.683.220/0001-09',
            deliveryIe: '649.029.319.116',
            deliveryZip: '18650-000',
            deliveryPhone: '14 3812-7000',
            billingAddress: 'RUA BENEDITO ISAAC PIRES, 600 - VILA MARANHÃO',
            billingCity: 'COTIA',
            billingState: 'SP',
            paymentTerms: '28 DIAS DA DATA DE PAGAMENTO, LÍQUIDO',
            freightType: 'CIF',
            observation: '',
            customerId: customer.id,
            supplierId: supplier.id
        });

        await OrderItem.create({
            productName: 'BANDEJA OVO GALINHA 20 UND NATURAL DA TERRA - HORTA VITAE',
            productCode: 'SRG 20',
            caseQuantity: 13,
            weight: 130,
            quantity: 5200,
            pricePerThousand: 1328.00,
            subtotal: subtotalValue,
            ipi: ipiValue,
            total: totalValue,
            orderId: order.id
        });

        console.log('Database seeded successfully with order 614!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
