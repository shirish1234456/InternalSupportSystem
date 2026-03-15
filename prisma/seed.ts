import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Create an initial SuperAdmin if one doesn't exist
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'SuperAdmin' },
  });

  if (!existingSuperAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: 'admin@support.local',
        passwordHash,
        role: 'SuperAdmin',
        isActive: true,
      },
    });
    console.log('Created initial SuperAdmin account: admin@support.local / admin123');
  } else {
    console.log('SuperAdmin already exists, skipping...');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });