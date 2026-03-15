const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'admin@company.com' },
        update: { passwordHash: hash, role: 'SuperAdmin', isActive: true },
        create: {
            email: 'admin@company.com',
            fullName: 'Test Admin',
            passwordHash: hash,
            role: 'SuperAdmin',
            isActive: true
        }
    });

    const dept = await prisma.department.upsert({
        where: { name: 'homeschoolasia' },
        update: {},
        create: { name: 'HomeSchoolasia' }
    });

    let agent = await prisma.agent.findFirst({ where: { name: 'HomeSchool.asia' } });
    if (!agent) {
        agent = await prisma.agent.create({
            data: { name: 'HomeSchool.asia', shift: 'Day', departmentId: dept.id }
        });
    }

    const qt = await prisma.queryType.upsert({
        where: { name: 'General' },
        update: {},
        create: { name: 'General' }
    });

    const it = await prisma.issueType.upsert({
        where: { name: 'Other' },
        update: {},
        create: { name: 'Other' }
    });

    console.log('Setup finished, Admin user ready:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
