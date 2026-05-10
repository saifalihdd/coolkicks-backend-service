const amqp = require('amqplib');

let channel = null;

async function connect() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await conn.createChannel();

    // Dead Letter Exchange & Queue
    await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
    await channel.assertQueue(process.env.ORDER_DLQ, { durable: true });
    await channel.bindQueue(process.env.ORDER_DLQ, 'dlx_exchange', process.env.ORDER_QUEUE);

    // Main queue dengan DLX
    await channel.assertQueue(process.env.ORDER_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx_exchange',
        'x-dead-letter-routing-key': process.env.ORDER_QUEUE,
        'x-message-ttl': 60000,
      },
    });

    conn.on('close', () => {
      console.warn('RabbitMQ publisher terputus, reconnect...');
      channel = null;
      setTimeout(connect, 5000);
    });

    console.log('RabbitMQ publisher terhubung');
  } catch (err) {
    console.error('Gagal koneksi RabbitMQ publisher:', err.message);
    setTimeout(connect, 5000);
  }
}

async function publishOrder(payload) {
  if (!channel) {
    console.error('Channel RabbitMQ belum siap');
    return;
  }
  channel.sendToQueue(
    process.env.ORDER_QUEUE,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
  console.log('Event order dipublish:', payload);
}

module.exports = { connect, publishOrder };