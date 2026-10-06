import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menyiapkan database produksi (Membersihkan data dummy & inisialisasi akun master)...');

  // 1. Bersihkan seluruh data dummy transaksi
  await prisma.withdrawal.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.license.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.disputeClaim.deleteMany();
  await prisma.visitLog.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Protek2026!Secure', 10);

  // 2. Akun Master Admin PT Pro Teknologi
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin PT Pro Teknologi',
      email: 'admin@protek.id',
      password: passwordHash,
      phone: '628110000001',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Akun Admin Produksi dibuat: ${admin.email}`);

  // 3. Akun Mitra Sales Resmi
  const sales = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'sales@protek.id',
      password: passwordHash,
      phone: '6281298761100',
      role: Role.SALES,
      commissionRate: 25.0,
      bankName: 'BCA (Bank Central Asia)',
      bankAccountNumber: '8830912811',
      bankAccountHolder: 'Budi Santoso',
      tier: 'Gold Specialist',
    },
  });
  console.log(`✅ Akun Sales Resmi dibuat: ${sales.email}`);
  console.log('🎉 Database bersih dan siap produksi tanpa data dummy.');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding database produksi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
