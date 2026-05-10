const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Product = require('./Product');

const Order = sequelize.define(
  'Order',
  {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id:     { type: DataTypes.INTEGER, allowNull: false },
    product_id:  { type: DataTypes.INTEGER, allowNull: false },
    quantity:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status:      { type: DataTypes.ENUM('pending', 'processed', 'cancelled'), defaultValue: 'pending' },
  },
  { tableName: 'orders', timestamps: true, underscored: true }
);

Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = Order;