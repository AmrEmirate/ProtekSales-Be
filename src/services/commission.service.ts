import prisma from '../config/prisma';
import { config } from '../config/env';
import { CommissionStatus, WithdrawalStatus, InvoiceStatus } from '@prisma/client';

export class CommissionService {
  /**
   * Membuat komisi otomatis saat tagihan outlet berstatus PAID
   */
  static async processInvoiceCommission(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        outlet: {
          include: {
            sales: true,
          },
        },
        commission: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan.');
    }

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new Error('Invoice belum lunas. Komisi hanya dibuat untuk invoice yang sudah lunas (PAID).');
    }

    // Jika komisi untuk invoice ini sudah pernah dibuat
    if (invoice.commission) {
      return invoice.commission;
    }

    const sales = invoice.outlet.sales;
    const percentage = sales.commissionRate || config.defaultCommissionPercentage;
    const amount = (invoice.amount * percentage) / 100;

    const commission = await prisma.commission.create({
      data: {
        salesId: sales.id,
        invoiceId: invoice.id,
        invoiceAmount: invoice.amount,
        percentage,
        amount,
        status: CommissionStatus.READY,
      },
    });

    return commission;
  }

  /**
   * Mengambil ringkasan saldo dompet komisi sales
   */
  static async getSalesWalletSummary(salesId: string) {
    // 1. Total Komisi Siap Ditarik (READY)
    const readyCommissions = await prisma.commission.aggregate({
      where: {
        salesId,
        status: CommissionStatus.READY,
      },
      _sum: {
        amount: true,
      },
    });

    // 2. Total Komisi Sedang Diajukan Penarikan (PENDING withdrawal)
    const pendingWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        salesId,
        status: WithdrawalStatus.PENDING,
      },
      _sum: {
        amount: true,
      },
    });

    // 3. Total Komisi Sudah Ditarik (COMPLETED withdrawal)
    const completedWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        salesId,
        status: WithdrawalStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    });

    // 4. Komisi Tertahan / Potensi Komisi dari outlet yang tagihannya belum dibayar (UNPAID / OVERDUE)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        outlet: {
          salesId,
        },
        status: {
          in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE],
        },
      },
      include: {
        outlet: {
          include: {
            sales: true,
          },
        },
      },
    });

    let pendingPotentialCommission = 0;
    for (const inv of unpaidInvoices) {
      const rate = inv.outlet.sales.commissionRate || config.defaultCommissionPercentage;
      pendingPotentialCommission += (inv.amount * rate) / 100;
    }

    const totalReady = readyCommissions._sum.amount || 0;
    const totalPendingWithdrawal = pendingWithdrawals._sum.amount || 0;
    const availableToWithdraw = Math.max(0, totalReady - totalPendingWithdrawal);

    return {
      readyBalance: availableToWithdraw,
      totalEarnedReady: totalReady,
      pendingCommission: pendingPotentialCommission,
      pendingWithdrawalAmount: totalPendingWithdrawal,
      totalWithdrawn: completedWithdrawals._sum.amount || 0,
      minimumWithdrawal: config.minimumWithdrawalAmount,
    };
  }

  /**
   * Pengajuan penarikan dana komisi oleh sales
   */
  static async requestWithdrawal(
    salesId: string,
    amount: number,
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }
  ) {
    if (amount < config.minimumWithdrawalAmount) {
      throw new Error(
        `Batas minimum penarikan dana adalah Rp ${config.minimumWithdrawalAmount.toLocaleString('id-ID')}.`
      );
    }

    const wallet = await this.getSalesWalletSummary(salesId);
    if (amount > wallet.readyBalance) {
      throw new Error(
        `Saldo komisi siap ditarik tidak mencukupi. Saldo tersedia: Rp ${wallet.readyBalance.toLocaleString(
          'id-ID'
        )}.`
      );
    }

    const user = await prisma.user.findUnique({ where: { id: salesId } });
    // PPh 21: 2.5% jika memiliki NPWP, 3% jika belum memiliki NPWP
    const taxRate = user?.npwp ? 2.5 : 3.0;
    const taxAmount = (amount * taxRate) / 100;
    const netAmount = amount - taxAmount;

    const withdrawal = await prisma.withdrawal.create({
      data: {
        salesId,
        amount,
        taxAmount,
        netAmount,
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        accountHolder: bankInfo.accountHolder,
        status: WithdrawalStatus.PENDING,
      },
    });

    return withdrawal;
  }
}
