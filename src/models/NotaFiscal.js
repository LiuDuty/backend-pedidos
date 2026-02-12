const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotaFiscal = sequelize.define('NotaFiscal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mes_ano: {
        type: DataTypes.STRING,
        allowNull: true
    },
    data_pedido: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    data_entrega: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    data_fatura: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    produto: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pedido: {
        type: DataTypes.STRING,
        allowNull: true
    },
    oc_cliente: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quantidade: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    unidade: {
        type: DataTypes.STRING,
        allowNull: true
    },
    preco_unitario: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    valor_total: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    comissao: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    nf: {
        type: DataTypes.STRING,
        allowNull: true
    },
    saldo: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    observacao: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    origem: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Principal'
    }
}, {
    tableName: 'notas_fiscais',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // The table doesn't have an updatedAt column in the schema provided
});

module.exports = NotaFiscal;
