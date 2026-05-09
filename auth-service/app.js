require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4181;

app.use(express.json());
app.use('/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan' });
});

sequelize.sync({ alter: false }).then(() => {
  console.log('Database tersinkronisasi');
  app.listen(PORT, () => console.log(`Auth Service berjalan di port ${PORT}`));
}).catch((err) => {
  console.error('Gagal koneksi database:', err.message);
  process.exit(1);
});