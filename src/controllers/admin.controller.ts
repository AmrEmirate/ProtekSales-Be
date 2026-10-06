import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { BillingService } from '../services/billing.service';
import { LicenseService } from '../services/license.service';
import { LicenseStatus, WithdrawalStatus, DisputeStatus, CommissionStatus } from '@prisma/client';

export class AdminController {
  /**
   * 1. Dashboard Metrics Summary
   * GET /api/admin/metrics
   */
  static async getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const totalSales = await prisma.user.count({ where: { role: 'SALES' } });
      const totalLeads = await prisma.lead.count();
      const totalOutlets = await prisma.outlet.count();
      const activeLicenses = await prisma.license.count({ where: { status: LicenseStatus.ACTIVE } });
      const suspendedLicenses = await prisma.license.count({ where: { status: LicenseStatus.SUSPENDED } });

      const pendingWithdrawals = await prisma.withdrawal.aggregate({
        where: { status: WithdrawalStatus.PENDING },
        _count: true,
        _sum: { amount: true },
      });

      const unpaidInvoices = await prisma.invoice.aggregate({
        where: { status: 'UNPAID' },
        _count: true,
        _sum: { amount: true },
      });

      const overdueInvoices = await prisma.invoice.aggregate({
        where: { status: 'OVERDUE' },
        _count: true,
        _sum: { amount: true },
      });

      return sendSuccess(res, 'Metrik dashboard admin berhasil diambil.', {
        totalSales,
        totalLeads,
        totalOutlets,
        licenses: {
          active: activeLicenses,
          suspended: suspendedLicenses,
        },
        withdrawals: {
          pendingCount: pendingWithdrawals._count || 0,
          pendingAmount: pendingWithdrawals._sum.amount || 0,
        },
        invoices: {
          unpaidCount: unpaidInvoices._count || 0,
          unpaidAmount: unpaidInvoices._sum.amount || 0,
          overdueCount: overdueInvoices._count || 0,
          overdueAmount: overdueInvoices._sum.amount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Peta Sebaran & Prospek Seluruh Sales
   * GET /api/admin/leads/map
   */
  static async getAllLeadsForMap(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const leads = await prisma.lead.findMany({
        include: {
          sales: { select: { id: true, name: true, phone: true } },
          visits: { orderBy: { visitDate: 'desc' }, take: 1 },
        },
      });

      return sendSuccess(res, 'Data prospek untuk peta sebaran berhasil diambil.', leads);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Verifikasi Bukti Transfer Invoice Outlet (Approval Finansial)
   * POST /api/admin/invoices/:id/verify
   */
  static async verifyInvoicePayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const result = await BillingService.verifyAndMarkInvoiceAsPaid(id, notes);

      return sendSuccess(
        res,
        'Pembayaran tagihan berhasil diverifikasi dan komisi sales otomatis diterbitkan (Status: Ready).',
        result
      );
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal memverifikasi pembayaran tagihan.', 400);
    }
  }

  /**
   * 4. Approval Permintaan Pencairan Komisi Sales (Payout Approval)
   * POST /api/admin/withdrawals/:id/process
   */
  static async processWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, adminNotes, proofUrl } = req.body;

      if (!status || ![WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED, WithdrawalStatus.COMPLETED].includes(status)) {
        return sendError(res, 'Status proses harus salah satu dari: APPROVED, REJECTED, COMPLETED.', 400);
      }

      const withdrawal = await prisma.withdrawal.findUnique({
        where: { id },
      });

      if (!withdrawal) {
        return sendError(res, 'Data penarikan dana tidak ditemukan.', 404);
      }

      const updated = await prisma.withdrawal.update({
        where: { id },
        data: {
          status,
          adminNotes,
          proofUrl: proofUrl || withdrawal.proofUrl,
          processedAt: new Date(),
        },
      });

      // Jika completed, update status komisi sales terkait menjadi WITHDRAWN
      if (status === WithdrawalStatus.COMPLETED) {
        // Ambil komisi-komisi READY milik sales tersebut hingga mencukupi amount withdrawal
        const readyCommissions = await prisma.commission.findMany({
          where: { salesId: withdrawal.salesId, status: CommissionStatus.READY },
          orderBy: { createdAt: 'asc' },
        });

        let remainingToDeduct = withdrawal.amount;
        for (const comm of readyCommissions) {
          if (remainingToDeduct <= 0) break;
          await prisma.commission.update({
            where: { id: comm.id },
            data: { status: CommissionStatus.WITHDRAWN },
          });
          remainingToDeduct -= comm.amount;
        }
      }

      return sendSuccess(res, `Pengajuan penarikan dana berhasil diperbarui menjadi ${status}.`, updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 5. Saklar Lisensi Outlet Remote (Kill-Switch Toggle)
   * POST /api/admin/licenses/:id/toggle
   */
  static async toggleLicenseSwitch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || ![LicenseStatus.ACTIVE, LicenseStatus.SUSPENDED, LicenseStatus.EXPIRED].includes(status)) {
        return sendError(res, 'Status lisensi harus salah satu dari: ACTIVE, SUSPENDED, EXPIRED.', 400);
      }

      const updatedLicense = await LicenseService.toggleLicenseStatus(id, status, reason);

      return sendSuccess(
        res,
        `Status lisensi outlet berhasil diubah menjadi ${status}.`,
        updatedLicense
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * 6. Penyelesaian Sengketa Klaim Outlet Antarsales (Dispute Resolution)
   * GET /api/admin/disputes
   */
  static async getDisputes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const disputes = await prisma.disputeClaim.findMany({
        include: {
          lead: {
            include: {
              sales: { select: { id: true, name: true, phone: true } },
            },
          },
          claimantSales: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, 'Daftar sengketa klaim prospek berhasil diambil.', disputes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/disputes/:id/resolve
   */
  static async resolveDispute(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, resolutionNotes } = req.body;

      if (!action || !['APPROVE_CLAIMANT', 'REJECT_CLAIMANT'].includes(action)) {
        return sendError(
          res,
          'Aksi penyelesaian harus salah satu dari: APPROVE_CLAIMANT (alihkan hak ke pelapor) atau REJECT_CLAIMANT (pertahankan pemilik saat ini).',
          400
        );
      }

      const dispute = await prisma.disputeClaim.findUnique({
        where: { id },
        include: { lead: true },
      });

      if (!dispute) {
        return sendError(res, 'Data sengketa tidak ditemukan.', 404);
      }

      if (action === 'APPROVE_CLAIMANT') {
        // Alihkan kepemilikan lead ke claimantSalesId
        await prisma.lead.update({
          where: { id: dispute.leadId },
          data: {
            salesId: dispute.claimantSalesId,
            // Berikan proteksi 30 hari lagi untuk sales baru
            protectedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        const updatedDispute = await prisma.disputeClaim.update({
          where: { id },
          data: {
            status: DisputeStatus.APPROVED,
            resolutionNotes: resolutionNotes || 'Klaim disetujui, hak prospek dialihkan ke sales pelapor.',
            resolvedAt: new Date(),
          },
        });

        return sendSuccess(res, 'Sengketa diselesaikan: Hak prospek berhasil dialihkan.', updatedDispute);
      } else {
        const updatedDispute = await prisma.disputeClaim.update({
          where: { id },
          data: {
            status: DisputeStatus.REJECTED,
            resolutionNotes: resolutionNotes || 'Klaim ditolak, hak prospek tetap pada sales awal.',
            resolvedAt: new Date(),
          },
        });

        return sendSuccess(res, 'Sengketa diselesaikan: Klaim ditolak.', updatedDispute);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 7. Kelola Seluruh Data Sales
   * GET /api/admin/sales
   */
  static async getAllSales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const salesList = await prisma.user.findMany({
        where: { role: 'SALES' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          commissionRate: true,
          bankName: true,
          bankAccountNumber: true,
          bankAccountHolder: true,
          _count: {
            select: {
              leads: true,
              outlets: true,
            },
          },
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      return sendSuccess(res, 'Daftar sales berhasil diambil.', salesList);
    } catch (error) {
      next(error);
    }
  }
}
