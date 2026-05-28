import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Tạo system tenant cho superadmin
  let systemTenant = await prisma.tenant.findFirst({
    where: { domain: 'system' }
  });

  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: {
        name: 'System',
        domain: 'system',
        email: 'system@pos.com',
        isActive: true
      }
    });
    console.log('✅ Created system tenant:', systemTenant.id);
  } else {
    console.log('✅ System tenant exists:', systemTenant.id);
  }

  // Tạo superadmin
  const existing = await prisma.user.findUnique({
    where: { email: 'superadmin@gmail.com' }
  });

  if (!existing) {
    const hashed = await bcrypt.hash('123456', 10);
    const user = await prisma.user.create({
      data: {
        tenantId: systemTenant.id,
        name: 'Super Admin',
        email: 'superadmin@gmail.com',
        password: hashed,
        role: 'super_admin',
        isVerified: true
      }
    });
    console.log('✅ Created superadmin:', user.email);
  } else {
    console.log('✅ Superadmin already exists');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
