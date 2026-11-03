import { PrismaClient, Role, LeadStatus, InvoiceStatus, CommissionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Membersihkan seluruh data lama di proteksales_db...');

  // 1. Bersihkan seluruh data tabel transaksi
  try {
    await (prisma as any).uiDesignRequest?.deleteMany();
  } catch (e) {
    // tabel baru
  }
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

  // Password hashes untuk pengujian
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);

  // 2. Akun Utama (Super Admin PT Pro Teknologi)
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
  console.log(`✅ Akun Admin Utama dibuat: ${admin.email} (Password: admin123)`);

  // 2b. Akun Khusus Pemilik / Owner (Super Admin dengan Hak Atur Komisi)
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
  console.log(`✅ Akun Owner Utama dibuat: ${owner.email} (Password: admin123)`);

  // 3. Akun Sales 1 (Pengujian Utama USER)
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
  console.log(`✅ Akun Sales 1 dibuat: ${sales1.email} (Password: sales123)`);

  // 3b. Akun Sales Alias (sales@protek.id)
  const salesAlias = await prisma.user.create({
    data: {
      name: 'Budi Santoso (Mitra Sales)',
      email: 'sales@protek.id',
      password: salesPasswordHash,
      phone: '6281234567891',
      role: Role.SALES,
      commissionRate: 25.0,
      bankName: 'BCA (Bank Central Asia)',
      bankAccountNumber: '8800123456',
      bankAccountHolder: 'Budi Santoso',
      tier: 'Gold Specialist',
    },
  });
  console.log(`✅ Akun Sales Alias dibuat: ${salesAlias.email} (Password: sales123)`);

  // 4. Akun Sales 2 (Untuk Uji Coba Anti-Tabrakan)
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
  console.log(`✅ Akun Sales 2 dibuat: ${sales2.email} (Password: sales123)`);

  // 5. Buat 1 Outlet yang sudah ditawarkan oleh Sales 1 (Untuk Uji Coba Proteksi Anti-Tabrakan)
  const protectedUntil = new Date();
  protectedUntil.setDate(protectedUntil.getDate() + 30); // Proteksi 30 hari

  const sampleLead1 = await prisma.lead.create({
    data: {
      salesId: sales1.id,
      storeName: 'Kopi Kenangan Senja',
      ownerName: 'Pak Hendra Wijaya',
      phone: '6281299887766',
      address: 'Jl. Sabang No. 45, Menteng, Jakarta Pusat',
      status: LeadStatus.DEMO,
      notes: 'Owner berminat paket POS Cloud 150k. Sudah presentasi demo awal, menunggu jadwal onboarding.',
      protectedUntil,
    },
  });
  console.log(`✅ Data Prospek Sales 1 Aktif (Untuk Anti-Tabrakan): ${sampleLead1.storeName} (${sampleLead1.phone})`);

  // 6. Buat 2 Outlet Aktif & Komisi Realistis untuk Sales 1 (Saldo Siap Tarik Rp 500.000 untuk test penarikan)
  const sampleOutlet1 = await prisma.outlet.create({
    data: {
      leadId: sampleLead1.id,
      salesId: sales1.id,
      name: 'Kopi Kenangan Senja (Cabang 1)',
      ownerName: 'Pak Hendra Wijaya',
      phone: '6281299887766',
      address: 'Jl. Sabang No. 45, Menteng, Jakarta Pusat',
      monthlyFee: 1000000,
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      outletId: sampleOutlet1.id,
      invoiceNumber: 'INV-PRO-2026-001',
      amount: 1000000,
      billingPeriod: 'November 2026',
      dueDate: new Date(),
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      paymentNotes: 'Pembayaran langganan tahunan SaaS POS',
    },
  });

  const sampleOutlet2 = await prisma.outlet.create({
    data: {
      salesId: sales1.id,
      name: 'Kedai Dimsum Juara',
      ownerName: 'Ibu Ratna',
      phone: '6281311223344',
      address: 'Mall Kota Kasablanka Lantai LG No. 12',
      monthlyFee: 1000000,
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      outletId: sampleOutlet2.id,
      invoiceNumber: 'INV-PRO-2026-002',
      amount: 1000000,
      billingPeriod: 'November 2026',
      dueDate: new Date(),
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      paymentNotes: 'Pembayaran aktivasi awal kasir POS',
    },
  });

  // Komisi: 25% dari 1.000.000 = 250.000 x 2 = Rp 500.000 READY untuk ditarik
  await prisma.commission.create({
    data: {
      salesId: sales1.id,
      invoiceId: invoice1.id,
      invoiceAmount: 1000000,
      percentage: 25.0,
      amount: 250000,
      status: CommissionStatus.READY,
    },
  });

  await prisma.commission.create({
    data: {
      salesId: sales1.id,
      invoiceId: invoice2.id,
      invoiceAmount: 1000000,
      percentage: 25.0,
      amount: 250000,
      status: CommissionStatus.READY,
    },
  });
  console.log(`✅ Saldo Komisi Siap Tarik untuk Sales 1: Rp 500.000 (Siap diuji coba penarikan)`);

  // 7. Data Request UI Pendaftaran UMKM (Untuk test fitur upload kebutuhan UI UMKM)
  await (prisma as any).uiDesignRequest.create({
    data: {
      salesId: sales1.id,
      storeName: 'Ayam Bakar Madu Solo',
      category: 'F&B (Restoran Nusantara)',
      primaryColor: '#b45309',
      referenceImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      styleNotes: 'UMKM request tampilan kasir nuansa kayu/cokelat hangat, tombol menu cepat untuk ayam bakar paha/dada, dan cetak struk logo ayam.',
      status: 'READY_REVIEW',
    },
  });
  console.log(`✅ Request Desain UI UMKM terdaftar (Ayam Bakar Madu Solo - Siap Review & Approve)`);

  console.log('\n🎉 Selesai! Seluruh data bersih, akun pengujian siap dipakai:');
  console.log('   1. Akun Admin : admin@protek.id | admin123');
  console.log('   2. Akun Sales 1: sales1@protek.id | sales123 (Saldo Rp 500.000, outlet terlindungi)');
  console.log('   3. Akun Sales 2: sales2@protek.id | sales123 (Untuk uji tabrakan nomor 6281299887766)');
}

main()
  .catch((e) => {
    console.error('❌ Gagal seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
