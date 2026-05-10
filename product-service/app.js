require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/db');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const publisher = require('./src/broker/publisher');

const app = express();
const PORT = process.env.PORT || 4281;

app.use(express.json());
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan' });
});

(async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('Database tersinkronisasi');
    await publisher.connect();
    app.listen(PORT, () => console.log(`Product Service berjalan di port ${PORT}`));
  } catch (err) {
    console.error('Gagal start service:', err.message);
    process.exit(1);
  }
})();