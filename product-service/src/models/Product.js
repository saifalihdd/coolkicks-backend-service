const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define(
  'Product',
  {
    id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name:      { type: DataTypes.STRING(150), allowNull: false },
    brand:     { type: DataTypes.STRING(100), allowNull: false },
    price:     { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock:     { type: DataTypes.INTEGER, defaultValue: 0 },
    size:      { type: DataTypes.STRING(20) },
    image_url: { type: DataTypes.STRING(255) },
  },
  { tableName: 'products', timestamps: true, underscored: true }
);

module.exports = Product;