const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { publishOrder } = require('../broker/publisher');

// POST /orders
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  const { product_id, quantity } = req.body;
  try {
    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Stok tidak mencukupi' });
    }

    const total_price = product.price * quantity;
    const order = await Order.create({
      user_id: req.user.id,
      product_id,
      quantity,
      total_price,
      status: 'pending'
    });

    // Publish event ke RabbitMQ (asinkron, tidak menghambat response)
    publishOrder({
      orderId: order.id,
      userId: order.user_id,
      productId: product_id,
      quantity,
      totalPrice: total_price,
    });

    res.status(201).json({ success: true, message: 'Order berhasil dibuat', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /orders  (admin)
exports.getAll = async (req, res) => {
  try {
    const orders = await Order.findAll({ include: [{ model: Product, as: 'product' }] });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /orders/my  (user sendiri)
exports.getMy = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product, as: 'product' }],
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /orders/:id/cancel
exports.cancel = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Hanya order pending yang bisa dibatalkan' });
    }
    await order.update({ status: 'cancelled' });
    res.json({ success: true, message: 'Order berhasil dibatalkan', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /orders/:id/status  (admin)
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'processed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(422).json({ success: false, message: 'Status tidak valid' });
  }
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    await order.update({ status });
    res.json({ success: true, message: 'Status order diperbarui', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};