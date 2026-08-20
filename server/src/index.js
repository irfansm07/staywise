require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 5000;

async function seedDatabase() {
  try {
    // 1. Seed Settings (Overdue Threshold)
    const overdueSetting = await prisma.setting.findUnique({
      where: { key: 'overdue_threshold_days' }
    });
    if (!overdueSetting) {
      await prisma.setting.create({
        data: { key: 'overdue_threshold_days', value: '5' }
      });
      console.log('✔ Seeded default overdue threshold: 5 days');
    }
  } catch (error) {
    console.error('❌ Database seeding error:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
  await seedDatabase();
});
