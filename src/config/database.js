const Sequelize = require('sequelize');

if (!process.env.DATABASE_URL) {
    console.error('CRITICAL ERROR: DATABASE_URL is not defined in environment variables!');
    process.exit(1);
}

console.log('Connecting to PostgreSQL database...');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('b4a.run') || process.env.DATABASE_URL.includes('render.com')
            ? {
                require: true,
                rejectUnauthorized: false
            }
            : false
    },
    logging: false
});

module.exports = sequelize;
