import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRole } from '../middlewares/role.middleware';

const router = Router();

// Proteksi seluruh rute admin
router.use(authenticate, authorizeRole('ADMIN'));

// 1. Metrik Ringkasan Dashboard
router.get('/metrics', AdminController.getDashboardMetrics);

// 2. Peta Sebaran Prospek Seluruh Sales
router.get('/leads/map', AdminController.getAllLeadsForMap);

// 3. Approval Bukti Transfer Tagihan Outlet
router.post('/invoices/:id/verify', AdminController.verifyInvoicePayment);

// 4. Approval Permintaan Pencairan Dana Komisi Sales
router.post('/withdrawals/:id/process', AdminController.processWithdrawal);

// 5. Saklar Lisensi Outlet Remote (Kill-Switch Toggle)
router.post('/licenses/:id/toggle', AdminController.toggleLicenseSwitch);

// 6. Manajemen & Penyelesaian Sengketa Prospek
router.get('/disputes', AdminController.getDisputes);
router.post('/disputes/:id/resolve', AdminController.resolveDispute);

// 7. Daftar Sales
router.get('/sales', AdminController.getAllSales);

export default router;
