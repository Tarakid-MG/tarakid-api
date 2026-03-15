const { DataSource } = require('typeorm');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function activateManual() {
  const dataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Get the latest pending subscription
    const [subscription] = await dataSource.query(
      "SELECT * FROM subscriptions WHERE status = 'PENDING_PAYMENT' ORDER BY createdAt DESC LIMIT 1",
    );

    if (!subscription) {
      console.log('No pending subscriptions found.');
      return;
    }

    console.log(
      `Activating subscription ${subscription.id} for user ${subscription.userId}...`,
    );

    // Activate the subscription
    // Check for existing active subscription to stack
    const [existing] = await dataSource.query(
      "SELECT endDate FROM subscriptions WHERE userId = ? AND status = 'ACTIVE' ORDER BY endDate DESC LIMIT 1",
      [subscription.userId],
    );

    const startDate =
      existing && new Date(existing.endDate) > new Date()
        ? new Date(existing.endDate)
        : new Date();

    const endDate = new Date(startDate);

    // Calculate end date based on commitment (match database enums)
    if (subscription.commitmentType === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscription.commitmentType === 'THREE_MONTHS') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (subscription.commitmentType === 'SIX_MONTHS') {
      endDate.setMonth(endDate.getMonth() + 6);
    }

    await dataSource.query(
      "UPDATE subscriptions SET status = 'ACTIVE', startDate = ?, endDate = ? WHERE id = ?",
      [startDate, endDate, subscription.id],
    );

    // Update user credits and plan
    const [user] = await dataSource.query('SELECT * FROM users WHERE id = ?', [
      subscription.userId,
    ]);

    if (user) {
      const newCredits = (user.credits || 0) + subscription.totalCredits;
      await dataSource.query(
        'UPDATE users SET credits = ?, subscriptionPlan = ? WHERE id = ?',
        [newCredits, subscription.planName, user.id],
      );
      console.log(`Success! User ${user.email} now has ${newCredits} credits.`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

activateManual().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
