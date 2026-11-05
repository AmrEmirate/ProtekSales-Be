-- 1. Hapus semua data dummy lama
TRUNCATE TABLE withdrawals, commissions, invoices, licenses, outlets, dispute_claims, visit_logs, leads, ui_design_requests CASCADE;

-- 2. Ambil ID sales1 (Budi) dan admin
DO $$
DECLARE
  v_sales_id UUID;
  v_admin_id UUID;
  v_outlet_id UUID;
  v_invoice_id UUID;
BEGIN
  SELECT id INTO v_sales_id FROM users WHERE email = 'sales1@protek.id' LIMIT 1;
  SELECT id INTO v_admin_id FROM users WHERE email = 'admin@protek.id' LIMIT 1;

  -- 1. Buat Lead Resmi Dimsum Intan (Status DEAL)
  INSERT INTO leads (id, "salesId", "storeName", "ownerName", phone, address, status, notes, "protectedUntil", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    v_sales_id,
    'Dimsum Intan Resto & Food Truck',
    'Intan Permatasari',
    '6281244558899',
    'Jl. Dipatiukur No. 45, Dago, Coblong, Bandung, Jawa Barat',
    'DEAL',
    'Klien aktif produksi Cloud POS. Terpasang mesin kasir 58mm Bluetooth & integrasi QRIS.',
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  );

  -- 2. Buat Outlet Resmi Dimsum Intan
  v_outlet_id := gen_random_uuid();
  INSERT INTO outlets (id, "salesId", name, "ownerName", phone, address, "monthlyFee", "createdAt", "updatedAt")
  VALUES (
    v_outlet_id,
    v_sales_id,
    'Dimsum Intan - Cabang 1 Dago Pusat',
    'Intan Permatasari',
    '6281244558899',
    'Jl. Dipatiukur No. 45, Dago, Bandung',
    350000,
    NOW(),
    NOW()
  );

  -- 3. Lisensi Resmi Dimsum Intan
  INSERT INTO licenses (id, "outletId", "licenseKey", status, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    v_outlet_id,
    'LIC-DIMSUM-INTAN-PRO-2026',
    'ACTIVE',
    NOW(),
    NOW()
  );

  -- 4. Invoice Pembayaran Langganan Dimsum Intan
  v_invoice_id := gen_random_uuid();
  INSERT INTO invoices (id, "outletId", "invoiceNumber", amount, "billingPeriod", "dueDate", status, "paidAt", "paymentNotes", "createdAt", "updatedAt")
  VALUES (
    v_invoice_id,
    v_outlet_id,
    'INV-PRO-DIMSUM-2026-001',
    350000,
    'November 2026',
    NOW(),
    'PAID',
    NOW(),
    'Langganan Cloud POS Multi-Outlet Dimsum Intan',
    NOW(),
    NOW()
  );

  -- 5. Komisi Riil untuk Sales 1: 25% dari Rp 350.000 = Rp 87.500
  INSERT INTO commissions (id, "salesId", "invoiceId", "invoiceAmount", percentage, amount, status, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    v_sales_id,
    v_invoice_id,
    350000,
    25.0,
    87500,
    'READY',
    NOW(),
    NOW()
  );

  -- 6. UI Design Request resmi untuk Dimsum Intan
  INSERT INTO ui_design_requests (id, "salesId", "storeName", category, "primaryColor", "styleNotes", status, "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    v_sales_id,
    'Dimsum Intan Resto & Food Truck',
    'F&B (Dimsum & Chinese Halal Cuisine)',
    '#D97706',
    'Tema hangat Chinese modern gold-terracotta dengan katalog cepat siomay ayam, hakau, lumpia, dan cetak struk thermal 58mm.',
    'APPROVED',
    NOW(),
    NOW()
  );
END $$;
