export interface PackagePlan {
  code: string;
  name: string;
  monthlyFee: number;
  dailyTxLimit: number; // 0 = unlimited
  monthlyTxLimit: number; // 0 = unlimited
  description: string;
}

export const PROTEK_PACKAGES: Record<string, PackagePlan> = {
  PAKET_100K: {
    code: 'PAKET_100K',
    name: 'Paket 1: Hemat (200 Tx/Hari)',
    monthlyFee: 100000,
    dailyTxLimit: 200,
    monthlyTxLimit: 6000, // 200 x 30 hari
    description: 'Rp 100.000/bln - 200 transaksi per hari dihitung per bulan (6.000 tx/bln)',
  },
  PAKET_150K: {
    code: 'PAKET_150K',
    name: 'Paket 2: Bisnis (300 Tx/Hari)',
    monthlyFee: 150000,
    dailyTxLimit: 300,
    monthlyTxLimit: 9000, // 300 x 30 hari
    description: 'Rp 150.000/bln - 300 transaksi per hari dihitung per bulan (9.000 tx/bln)',
  },
  PAKET_200K: {
    code: 'PAKET_200K',
    name: 'Paket 3: Pro (500 Tx/Hari)',
    monthlyFee: 200000,
    dailyTxLimit: 500,
    monthlyTxLimit: 15000, // 500 x 30 hari
    description: 'Rp 200.000/bln - 500 transaksi per hari dihitung per bulan (15.000 tx/bln)',
  },
  PAKET_250K: {
    code: 'PAKET_250K',
    name: 'Paket 4: Unlimited (Tanpa Batas)',
    monthlyFee: 250000,
    dailyTxLimit: 0,
    monthlyTxLimit: 0,
    description: 'Rp 250.000/bln - Unlimited transaksi selama sebulan (Tanpa Batas Kuota)',
  },
};

/**
 * Normalisasi paket Protek berdasarkan kode atau nominal tarif bulanan
 */
export const getPackageByCodeOrFee = (codeOrFee?: string | number): PackagePlan => {
  if (!codeOrFee) return PROTEK_PACKAGES.PAKET_150K;

  if (typeof codeOrFee === 'number') {
    if (codeOrFee <= 100000) return PROTEK_PACKAGES.PAKET_100K;
    if (codeOrFee <= 150000) return PROTEK_PACKAGES.PAKET_150K;
    if (codeOrFee <= 200000) return PROTEK_PACKAGES.PAKET_200K;
    return PROTEK_PACKAGES.PAKET_250K;
  }

  const upper = String(codeOrFee).toUpperCase().trim();
  if (PROTEK_PACKAGES[upper]) return PROTEK_PACKAGES[upper];

  // Map dari nama lama ke paket baru
  if (upper.includes('100') || upper.includes('STARTER')) return PROTEK_PACKAGES.PAKET_100K;
  if (upper.includes('150') || upper.includes('GROWTH') || upper.includes('STANDARD')) return PROTEK_PACKAGES.PAKET_150K;
  if (upper.includes('200') || upper.includes('PRO')) return PROTEK_PACKAGES.PAKET_200K;
  if (upper.includes('250') || upper.includes('UNLIMITED') || upper.includes('ENTERPRISE')) return PROTEK_PACKAGES.PAKET_250K;

  return PROTEK_PACKAGES.PAKET_150K;
};
