import { Router } from 'express';
import authRoutes from './auth.routes';
import leadRoutes from './lead.routes';
import outletRoutes from './outlet.routes';
import commissionRoutes from './commission.routes';
import invoiceRoutes from './invoice.routes';
import licenseRoutes from './license.routes';
import adminRoutes from './admin.routes';
import salesRoutes from './sales.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/outlets', outletRoutes);
router.use('/commissions', commissionRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/license', licenseRoutes);
router.use('/admin', adminRoutes);
router.use('/sales', salesRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ProtekSales API Server',
    timestamp: new Date().toISOString(),
  });
});

export default router;
