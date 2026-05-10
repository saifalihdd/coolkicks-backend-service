require('dotenv').config();
const amqp = require('amqplib');
const { Sequelize, DataTypes } = require('sequelize');

// DB Connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);

const Product = sequelize.define('Product', {
  id:    { type: DataTypes.INTEGER, primaryKey: true },
  stock: { type: DataTypes.INTEGER },
}, { tableName: 'products', timestamps: false });

const Order = sequelize.define('Order', {
  id:     { type: DataTypes.INTEGER, primaryKey: true },
  status: { type: DataTypes.STRING },
}, { tableName: 'orders', timestamps: false });

async function startConsumer() {
  try {
    await sequelize.authenticate();
    console.log('Consumer: database terhubung');

    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await conn.createChannel();

    // Deklarasi queue (harus sama dengan publisher)
    await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
    await channel.assertQueue(process.env.ORDER_DLQ, { durable: true });
    await channel.bindQueue(process.env.ORDER_DLQ, 'dlx_exchange', process.env.ORDER_QUEUE);

    await channel.assertQueue(process.env.ORDER_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx_exchange',
        'x-dead-letter-routing-key': process.env.ORDER_QUEUE,
        'x-message-ttl': 60000,
      },
    });

    channel.prefetch(1);
    console.log(`Consumer mendengarkan queue: ${process.env.ORDER_QUEUE}`);

    channel.consume(process.env.ORDER_QUEUE, async (msg) => {
      if (!msg) return;

      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
      } catch {
        console.error('Pesan tidak valid JSON, masuk DLQ');
        channel.nack(msg, false, false);
        return;
      }

      console.log(`Menerima event order #${payload.orderId}`);

      try {
        // 1. Kurangi stok produk
        const product = await Product.findByPk(payload.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - payload.quantity);
          await product.update({ stock: newStock });
          console.log(`Stok produk #${payload.productId}: ${product.stock} -> ${newStock}`);
        }

        // 2. Notifikasi (status TIDAK diubah di sini, diupdate manual oleh admin)
        console.log(
          `[NOTIF] Order #${payload.orderId} user #${payload.userId} ` +
          `Rp${payload.totalPrice} sedang menunggu konfirmasi admin`
        );

        channel.ack(msg);
      } catch (err) {
        console.error(`Gagal proses order #${payload.orderId}:`, err.message);
        // NACK tanpa requeue -> masuk Dead Letter Queue
        channel.nack(msg, false, false);
      }
    });

    conn.on('close', () => {
      console.warn('Koneksi RabbitMQ terputus, reconnect dalam 5 detik...');
      setTimeout(startConsumer, 5000);
    });
  } catch (err) {
    console.error('Gagal start consumer:', err.message);
    setTimeout(startConsumer, 5000);
  }
}

startConsumer();