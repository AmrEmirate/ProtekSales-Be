import { PrismaClient, Role, LeadStatus, InvoiceStatus, CommissionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Membersihkan seluruh data lama di proteksales_db...');

  try {
    await (prisma as any).uiDesignRequest?.deleteMany();
  } catch (e) {}
  await prisma.withdrawal.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.license.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.disputeClaim.deleteMany();
  await prisma.visitLog.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database bersih 100%.');

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);

  // 1. Akun Admin Sales
  const admin = await prisma.user.create({
    data: {
      name: 'Admin PT Pro Teknologi',
      email: 'admin@protek.id',
      password: adminPasswordHash,
      phone: '628111222333',
      role: Role.ADMIN,
      commissionRate: 0,
      bankName: 'BCA (Bank Central Asia)',
      bankAccountNumber: '1234567890',
      bankAccountHolder: 'PT Pro Teknologi',
      tier: 'Management HQ',
    },
  });

  // 2. Akun Owner (Admin Bisnis & SaaS HQ)
  const owner = await prisma.user.create({
    data: {
      name: 'Owner / Direktur PT Pro Teknologi',
      email: 'owner@protek.id',
      password: adminPasswordHash,
      phone: '628119999888',
      role: Role.ADMIN,
      commissionRate: 0,
      bankName: 'BCA (Bank Central Asia)',
      bankAccountNumber: '9988776655',
      bankAccountHolder: 'PT Pro Teknologi Indonesia',
      tier: 'Super Admin HQ',
    },
  });

  // 3. Akun Sales 1
  const sales1 = await prisma.user.create({
    data: {
      name: 'Budi Sales (Senior)',
      email: 'sales1@protek.id',
      password: salesPasswordHash,
      phone: '6281234567890',
      role: Role.SALES,
      commissionRate: 25.0,
      bankName: 'BCA (Bank Central Asia)',
      bankAccountNumber: '8800123456',
      bankAccountHolder: 'Budi Santoso',
      tier: 'Gold Specialist',
    },
  });

  // 4. Akun Sales 2
  const sales2 = await prisma.user.create({
    data: {
      name: 'Siti Sales (Junior)',
      email: 'sales2@protek.id',
      password: salesPasswordHash,
      phone: '6289876543210',
      role: Role.SALES,
      commissionRate: 20.0,
      bankName: 'Bank Mandiri',
      bankAccountNumber: '13300998877',
      bankAccountHolder: 'Siti Rahma',
      tier: 'Silver Sales',
    },
  });

  // 5. Data Produksi Riil: Dimsum Intan Resto & Food Truck
  const protectedUntil = new Date();
  protectedUntil.setDate(protectedUntil.getDate() + 30);

  const realLead = await prisma.lead.create({
    data: {
      salesId: sales1.id,
      storeName: 'Dimsum Intan Resto & Food Truck',
      ownerName: 'Intan Permatasari',
      phone: '6281244558899',
      address: 'Jl. Dipatiukur No. 45, Dago, Coblong, Bandung, Jawa Barat',
      status: LeadStatus.DEAL,
      notes: 'Klien aktif produksi Cloud POS. Terpasang mesin kasir 58mm Bluetooth & integrasi QRIS.',
      protectedUntil,
    },
  });

  const realOutlet = await prisma.outlet.create({
    data: {
      leadId: realLead.id,
      salesId: sales1.id,
      name: 'Dimsum Intan - Cabang 1 Dago Pusat',
      ownerName: 'Intan Permatasari',
      phone: '6281244558899',
      address: 'Jl. Dipatiukur No. 45, Dago, Bandung',
      monthlyFee: 350000,
    },
  });

  await prisma.license.create({
    data: {
      outletId: realOutlet.id,
      licenseKey: 'LIC-DIMSUM-INTAN-PRO-2026',
      status: LicenseStatus.ACTIVE,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      outletId: realOutlet.id,
      invoiceNumber: 'INV-PRO-DIMSUM-2026-001',
      amount: 350000,
      billingPeriod: 'November 2026',
      dueDate: new Date(),
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      paymentNotes: 'Langganan Cloud POS Multi-Outlet Dimsum Intan',
    },
  });

  await prisma.commission.create({
    data: {
      salesId: sales1.id,
      invoiceId: invoice.id,
      invoiceAmount: 350000,
      percentage: 25.0,
      amount: 87500,
      status: CommissionStatus.READY,
    },
  });

  await (prisma as any).uiDesignRequest.create({
    data: {
      salesId: sales1.id,
      storeName: 'Dimsum Intan Resto & Food Truck',
      category: 'F&B (Dimsum & Chinese Halal Cuisine)',
      primaryColor: '#D97706',
      referenceImageUrl: '/qris.jpeg',
      styleNotes: 'Tema hangat Chinese modern gold-terracotta dengan katalog cepat siomay ayam, hakau, lumpia, dan cetak struk thermal 58mm.',
      status: 'APPROVED',
    },
  });

  console.log('✅ Seeding data produksi riil Dimsum Intan selesai 100%.');
}

main()
  .catch((e) => {
    console.error('❌ Gagal seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
