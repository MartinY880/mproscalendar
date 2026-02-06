/**
 * Database Seed Script
 * Creates initial admin user and sample holidays
 */

import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword
    }
  });

  console.log(`✅ Admin user created: ${admin.username}`);

  // Create sample company holidays
  const currentYear = new Date().getFullYear();
  
  const companyHolidays = [
    {
      title: 'MortgagePros Founders Day',
      date: `${currentYear}-03-15`,
      category: 'company',
      color: '#06427F',
      source: 'custom',
      visible: true,
      recurring: true
    },
    {
      title: 'Company Summer Party',
      date: `${currentYear}-07-20`,
      category: 'company',
      color: '#06427F',
      source: 'custom',
      visible: true,
      recurring: true
    },
    {
      title: 'Annual Holiday Party',
      date: `${currentYear}-12-20`,
      category: 'company',
      color: '#06427F',
      source: 'custom',
      visible: true,
      recurring: true
    }
  ];

  for (const holiday of companyHolidays) {
    const existing = await prisma.holiday.findFirst({
      where: { title: holiday.title, date: holiday.date }
    });

    if (!existing) {
      await prisma.holiday.create({ data: holiday });
      console.log(`✅ Created holiday: ${holiday.title}`);
    } else {
      console.log(`⏭️ Holiday already exists: ${holiday.title}`);
    }
  }

  // Create default settings
  await prisma.settings.upsert({
    where: { key: 'companyName' },
    update: {},
    create: { key: 'companyName', value: 'MortgagePros' }
  });

  console.log('✅ Default settings created');
  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log('');
  console.log('Default admin credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
