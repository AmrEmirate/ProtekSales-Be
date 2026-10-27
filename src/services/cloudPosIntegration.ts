import { config } from '../config/env';

const CLOUD_POS_API_URL = config.cloudPosApiUrl || 'http://localhost:3000/api/v1';
const INTERNAL_SERVICE_KEY = config.internalServiceKey || 'protek-cloudpos-sync-secret-2026';

export class CloudPosIntegrationService {
  /**
   * Cek konektivitas dan kesehatan layanan Cloud POS BE
   */
  static async checkCloudPosHealth(): Promise<{ online: boolean; url: string; latencyMs?: number; message?: string }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${CLOUD_POS_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const latencyMs = Date.now() - startTime;
      const resData: any = await response.json();
      return {
        online: response.ok,
        url: CLOUD_POS_API_URL,
        latencyMs,
        message: resData?.message || 'Cloud POS API berjalan normal',
      };
    } catch (err: any) {
      return {
        online: false,
        url: CLOUD_POS_API_URL,
        latencyMs: Date.now() - startTime,
        message: err.message || 'Tidak dapat terhubung ke Cloud POS Backend',
      };
    }
  }

  /**
   * Mengirim sinyal perubahan lisensi secara instan ke Cloud POS API (Kill-Switch Realtime)
   */
  static async syncLicenseToCloudPos(licenseKey: string, status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED', reason?: string) {
    try {
      const response = await fetch(`${CLOUD_POS_API_URL}/internal/sync-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify({ licenseKey, status, reason }),
      });

      const resData: any = await response.json();
      console.log(`[CloudPosSync] Lisensi ${licenseKey} disinkronkan ke Cloud POS (${status}):`, resData?.message);
      return resData;
    } catch (err: any) {
      console.warn(`[CloudPosSync] Gagal menyinkronkan lisensi ${licenseKey} ke Cloud POS (Service offline):`, err.message);
      return null;
    }
  }

  /**
   * Mengirim perintah provisioning otomatis tenant baru ke Cloud POS API saat Lead DEAL
   */
  static async provisionTenantToCloudPos(data: {
    name: string;
    ownerName: string;
    phone: string;
    planCode: string;
    licenseKey: string;
  }) {
    try {
      const response = await fetch(`${CLOUD_POS_API_URL}/internal/provision-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SERVICE_KEY,
        },
        body: JSON.stringify(data),
      });

      const resData: any = await response.json();
      console.log(`[CloudPosSync] Provisioning toko "${data.name}" ke Cloud POS:`, resData?.message);
      return resData;
    } catch (err: any) {
      console.warn(`[CloudPosSync] Gagal provisioning toko "${data.name}" ke Cloud POS (Service offline):`, err.message);
      return null;
    }
  }

  /**
   * Mengambil data operasional real-time tenant dari Cloud POS BE berdasarkan licenseKey
   * (Omset hari ini, total orders, sisa kuota, aktivitas kasir & transaksi terakhir)
   */
  static async getTenantByLicense(licenseKey: string) {
    if (!licenseKey) return null;
    try {
      const response = await fetch(`${CLOUD_POS_API_URL}/internal/tenant/${encodeURIComponent(licenseKey)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SERVICE_KEY,
        },
      });

      if (!response.ok) {
        return null;
      }

      const resData: any = await response.json();
      return resData.data || null;
    } catch (err: any) {
      console.warn(`[CloudPosSync] Gagal mengambil data operasional lisensi ${licenseKey} dari Cloud POS:`, err.message);
      return null;
    }
  }

  /**
   * Mengambil seluruh daftar tenant yang terdaftar di Cloud POS BE
   */
  static async getAllTenants() {
    try {
      const response = await fetch(`${CLOUD_POS_API_URL}/internal/tenants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SERVICE_KEY,
        },
      });

      if (!response.ok) {
        return [];
      }

      const resData: any = await response.json();
      return Array.isArray(resData.data) ? resData.data : [];
    } catch (err: any) {
      console.warn('[CloudPosSync] Gagal mengambil daftar tenant dari Cloud POS:', err.message);
      return [];
    }
  }

  /**
   * Mengambil metrik platform konsolidasi dari Cloud POS BE
   */
  static async getPlatformAnalytics() {
    try {
      const response = await fetch(`${CLOUD_POS_API_URL}/internal/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SERVICE_KEY,
        },
      });

      if (!response.ok) {
        return null;
      }

      const resData: any = await response.json();
      return resData.data || null;
    } catch (err: any) {
      console.warn('[CloudPosSync] Gagal mengambil analitik platform dari Cloud POS:', err.message);
      return null;
    }
  }
}
