const runDbMigrations = async (sequelize, Payment) => {
  try {
    // Modify ENUM columns safely in MySQL
    await sequelize.query(`
      ALTER TABLE bookings 
      MODIFY COLUMN status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';
    `).catch((err) => {
      console.log('[Migration] Note on status ENUM modify:', err.message);
    });

    await sequelize.query(`
      ALTER TABLE bookings 
      MODIFY COLUMN paymentStatus ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED') NOT NULL DEFAULT 'PENDING';
    `).catch((err) => {
      console.log('[Migration] Note on paymentStatus ENUM modify:', err.message);
    });

    // Check and add stripeSessionId column
    const [columns] = await sequelize.query(`SHOW COLUMNS FROM bookings LIKE 'stripeSessionId'`);
    if (columns.length === 0) {
      await sequelize.query(`ALTER TABLE bookings ADD COLUMN stripeSessionId VARCHAR(255) NULL;`);
      console.log('[Migration] Added stripeSessionId column to bookings table.');
    }

    // Check and add stripePaymentIntentId column
    const [intentColumns] = await sequelize.query(`SHOW COLUMNS FROM bookings LIKE 'stripePaymentIntentId'`);
    if (intentColumns.length === 0) {
      await sequelize.query(`ALTER TABLE bookings ADD COLUMN stripePaymentIntentId VARCHAR(255) NULL;`);
      console.log('[Migration] Added stripePaymentIntentId column to bookings table.');
    }

    // Sync Payment model to ensure payments table exists
    if (Payment) {
      await Payment.sync();
      console.log('[Migration] Payments table synced successfully.');
    }
  } catch (err) {
    console.error('[Migration] Error during database migration:', err.message);
  }
};

module.exports = runDbMigrations;
