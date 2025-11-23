import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, authenticateAdmin, authenticateCashier, optionalAuth } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { uploadQRCode, uploadProductImage } from '../config/multer';

// Controllers
import * as authController from '../controllers/auth.controller';
import * as kioskController from '../controllers/kiosk.controller';
import * as orderController from '../controllers/order.controller';
import * as adminController from '../controllers/admin.controller';
import * as additionalController from '../controllers/additional.controller';
import * as refundController from '../controllers/refund.controller';
import * as wasteController from '../controllers/waste.controller';
import * as feedbackController from '../controllers/feedback.controller';
import * as promotionController from '../controllers/promotion.controller';
import * as customCakeSessionController from '../controllers/customCakeSession.controller';

const router = Router();

// ==== PUBLIC ROUTES ====

// API info endpoint
router.get('/', (req, res) => {
  const apiData = {
    name: 'GoldenMunch POS API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: {
        adminLogin: 'POST /api/auth/admin/login',
        cashierLogin: 'POST /api/auth/cashier/login',
        verify: 'GET /api/auth/verify',
      },
      kiosk: {
        menu: 'GET /api/kiosk/menu',
        categories: 'GET /api/kiosk/categories',
        promotions: 'GET /api/kiosk/promotions',
        createOrder: 'POST /api/kiosk/orders',
        getOrder: 'GET /api/kiosk/orders/:code',
      },
      cashier: {
        orders: 'GET /api/cashier/orders',
        verifyOrder: 'POST /api/cashier/orders/verify',
        verifyPayment: 'POST /api/cashier/payment/verify',
      },
      admin: {
        menu: '/api/admin/menu/*',
        categories: '/api/admin/categories/*',
        inventory: '/api/admin/inventory/*',
        analytics: '/api/admin/analytics/*',
        promotions: '/api/admin/promotions',
        feedback: '/api/admin/feedback',
        orders: '/api/admin/orders',
      },
    },
  };

  // Check if request wants JSON (API clients) or HTML (browsers)
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('application/json') || req.query.format === 'json') {
    return res.json(apiData);
  }

  // Serve HTML UI for browsers
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoldenMunch POS API</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    .header .status {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
    .header .status::before {
      content: '●';
      color: #4ade80;
      margin-right: 0.5rem;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .content {
      padding: 2rem;
    }
    .section {
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.5rem;
      color: #764ba2;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #f093fb;
      display: inline-block;
    }
    .endpoint-group {
      margin-bottom: 1.5rem;
    }
    .endpoint-group h3 {
      font-size: 1.2rem;
      color: #667eea;
      margin-bottom: 0.8rem;
      text-transform: capitalize;
    }
    .endpoint {
      background: #f8f9fa;
      padding: 1rem;
      margin: 0.5rem 0;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .endpoint:hover {
      background: #e9ecef;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .method {
      font-weight: 700;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.85rem;
      margin-right: 0.8rem;
      min-width: 60px;
      text-align: center;
    }
    .method.get { background: #10b981; color: white; }
    .method.post { background: #3b82f6; color: white; }
    .method.put { background: #f59e0b; color: white; }
    .method.patch { background: #8b5cf6; color: white; }
    .method.delete { background: #ef4444; color: white; }
    .path {
      font-family: 'Courier New', monospace;
      color: #495057;
      flex: 1;
    }
    .info-box {
      background: #e0e7ff;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border-left: 4px solid #667eea;
    }
    .info-box strong {
      color: #764ba2;
    }
    .footer {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
      font-size: 0.9rem;
      border-top: 1px solid #dee2e6;
    }
    .json-link {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.3s ease;
    }
    .json-link:hover {
      background: #764ba2;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍰 ${apiData.name}</h1>
      <p>Version ${apiData.version}</p>
      <div class="status">Status: ${apiData.status.toUpperCase()}</div>
    </div>

    <div class="content">
      <div class="info-box">
        <strong>Server Time:</strong> ${new Date(apiData.timestamp).toLocaleString()}<br>
        <a href="/api?format=json" class="json-link">View JSON Format</a>
      </div>

      <div class="section">
        <h2 class="section-title">📡 Public Endpoints</h2>
        <div class="endpoint-group">
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/health</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">🔐 Authentication</h2>
        <div class="endpoint-group">
          <div class="endpoint">
            <div><span class="method post">POST</span><span class="path">/api/auth/admin/login</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method post">POST</span><span class="path">/api/auth/cashier/login</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/auth/verify</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">🖥️ Kiosk Endpoints</h2>
        <div class="endpoint-group">
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/kiosk/menu</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/kiosk/categories</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/kiosk/promotions</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method post">POST</span><span class="path">/api/kiosk/orders</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/kiosk/orders/:code</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">💰 Cashier Endpoints</h2>
        <div class="endpoint-group">
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/cashier/orders</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method post">POST</span><span class="path">/api/cashier/orders/verify</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method post">POST</span><span class="path">/api/cashier/payment/verify</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">👨‍💼 Admin Endpoints</h2>
        <div class="endpoint-group">
          <h3>Menu Management</h3>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/admin/menu/*</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method post">POST</span><span class="path">/api/admin/menu</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method put">PUT</span><span class="path">/api/admin/menu/:id</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method delete">DELETE</span><span class="path">/api/admin/menu/:id</span></div>
          </div>
        </div>
        <div class="endpoint-group">
          <h3>Categories</h3>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/admin/categories/*</span></div>
          </div>
        </div>
        <div class="endpoint-group">
          <h3>Inventory</h3>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/admin/inventory/*</span></div>
          </div>
        </div>
        <div class="endpoint-group">
          <h3>Analytics</h3>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/admin/analytics/*</span></div>
          </div>
        </div>
        <div class="endpoint-group">
          <h3>Promotions & Feedback</h3>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/admin/promotions</span></div>
          </div>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/admin/feedback</span></div>
          </div>
        </div>
        <div class="endpoint-group">
          <h3>Orders</h3>
          <div class="endpoint">
            <div><span class="method get">GET</span><span class="path">/api/admin/orders</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>GoldenMunch POS System - Point of Sale with Custom Cake Editor</p>
      <p style="margin-top: 0.5rem; font-size: 0.85rem;">Built with Express.js & TypeScript</p>
    </div>
  </div>
</body>
</html>
  `;

  return res.send(html);
});

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==== AUTH ROUTES ====
router.post('/auth/admin/login', validate(schemas.adminLogin), asyncHandler(authController.adminLogin));
router.post('/auth/cashier/login', validate(schemas.cashierLogin), asyncHandler(authController.cashierLogin));
router.get('/auth/verify', authenticate, asyncHandler(authController.verifyToken));
router.get('/auth/diagnostic', asyncHandler(authController.diagnosticJWT));

// ==== KIOSK ROUTES (Public/Optional Auth) ====
router.get('/kiosk/menu', optionalAuth, asyncHandler(kioskController.getMenuItems));
router.get('/kiosk/categories', asyncHandler(kioskController.getCategories));
router.get('/kiosk/menu/:id', asyncHandler(kioskController.getItemDetails));
router.get('/kiosk/promotions', asyncHandler(kioskController.getActivePromotions));
router.get('/kiosk/capacity/check', asyncHandler(kioskController.checkCapacity));

// Kiosk Orders
router.post('/kiosk/orders', validate(schemas.createOrder), asyncHandler(orderController.createOrder));
router.get('/kiosk/orders/:code', asyncHandler(orderController.getOrderByVerificationCode));

// Custom Cake Sessions (for QR code customization flow)
router.post('/kiosk/custom-cake/session', asyncHandler(customCakeSessionController.createCustomCakeSession));
router.get('/kiosk/custom-cake/session/:sessionId', asyncHandler(customCakeSessionController.getCustomCakeSession));
router.put('/kiosk/custom-cake/session/:sessionId', asyncHandler(customCakeSessionController.updateCustomCakeSession));
router.post('/kiosk/custom-cake/session/:sessionId/complete', asyncHandler(customCakeSessionController.completeCustomCakeSession));
router.get('/kiosk/custom-cake/session/:sessionId/poll', asyncHandler(customCakeSessionController.pollCustomCakeSession));
router.delete('/kiosk/custom-cake/session/:sessionId', asyncHandler(customCakeSessionController.deleteCustomCakeSession));

// ==== CASHIER ROUTES ====
router.post(
  '/cashier/orders/verify',
  authenticateCashier,
  validate(schemas.verifyOrder),
  asyncHandler(orderController.verifyOrder)
);

router.post(
  '/cashier/payment/verify',
  authenticateCashier,
  uploadQRCode.single('qr_code'),
  validate(schemas.verifyPayment),
  asyncHandler(orderController.verifyPayment)
);

router.get('/cashier/orders', authenticateCashier, asyncHandler(orderController.getOrders));
router.get('/cashier/orders/:id', authenticateCashier, asyncHandler(orderController.getOrderDetails));
router.get('/cashier/orders/:id/timeline', authenticateCashier, asyncHandler(additionalController.getOrderTimeline));
router.patch('/cashier/orders/:id/status', authenticateCashier, asyncHandler(orderController.updateOrderStatus));

// Cashier - Waste Tracking
router.post('/cashier/waste', authenticateCashier, asyncHandler(wasteController.createWasteEntry));
router.get('/cashier/waste', authenticateCashier, asyncHandler(wasteController.getWasteEntries));

// Cashier - Feedback Recording
router.post('/cashier/feedback', authenticateCashier, asyncHandler(feedbackController.submitFeedback));

// Cashier - Refund Requests
router.post('/cashier/refund', authenticateCashier, asyncHandler(refundController.createRefundRequest));
router.get('/cashier/refund', authenticateCashier, asyncHandler(refundController.getRefundRequests));
router.get('/cashier/refund/:id', authenticateCashier, asyncHandler(refundController.getRefundDetails));

// ==== ADMIN ROUTES ====

// Menu Management
router.post(
  '/admin/menu',
  authenticateAdmin,
  uploadProductImage.single('image'),
  validate(schemas.createMenuItem),
  asyncHandler(adminController.createMenuItem)
);

router.put(
  '/admin/menu/:id',
  authenticateAdmin,
  uploadProductImage.single('image'),
  validate(schemas.updateMenuItem),
  asyncHandler(adminController.updateMenuItem)
);

router.delete('/admin/menu/:id', authenticateAdmin, asyncHandler(adminController.deleteMenuItem));

// Pricing
router.post('/admin/menu/prices', authenticateAdmin, asyncHandler(adminController.addItemPrice));

// Categories
router.post(
  '/admin/categories',
  authenticateAdmin,
  uploadProductImage.single('image'),
  asyncHandler(adminController.createCategory)
);

router.put('/admin/categories/:id', authenticateAdmin, asyncHandler(adminController.updateCategory));
router.post('/admin/categories/assign', authenticateAdmin, asyncHandler(adminController.assignItemToCategory));

// Inventory
router.get('/admin/inventory/alerts', authenticateAdmin, asyncHandler(adminController.getInventoryAlerts));
router.patch('/admin/inventory/alerts/:id/acknowledge', authenticateAdmin, asyncHandler(adminController.acknowledgeAlert));
router.post('/admin/inventory/adjust', authenticateAdmin, asyncHandler(adminController.adjustInventory));

// Stock Adjustment Reasons
router.get('/admin/inventory/reasons', authenticateAdmin, asyncHandler(additionalController.getStockReasons));
router.post('/admin/inventory/reasons', authenticateAdmin, asyncHandler(additionalController.createStockReason));

// Analytics
router.get('/admin/analytics/sales', authenticateAdmin, asyncHandler(adminController.getSalesAnalytics));
router.get('/admin/analytics/trending', authenticateAdmin, asyncHandler(adminController.getTrendingItems));
router.get('/admin/analytics/waste', authenticateAdmin, asyncHandler(adminController.getWasteReport));
router.post('/admin/analytics/popularity/recalculate', authenticateAdmin, asyncHandler(adminController.recalculatePopularity));

// Stats & History
router.get('/admin/stats/daily', authenticateAdmin, asyncHandler(additionalController.getDailyStats));
router.get('/admin/stats/popularity-history', authenticateAdmin, asyncHandler(additionalController.getPopularityHistory));

// Promotions
router.post('/admin/promotions', authenticateAdmin, asyncHandler(adminController.createPromotion));
router.get('/admin/promotions', authenticateAdmin, asyncHandler(adminController.getPromotions));
router.put('/admin/promotions/:id', authenticateAdmin, asyncHandler(promotionController.updatePromotion));
router.delete('/admin/promotions/:id', authenticateAdmin, asyncHandler(promotionController.deletePromotion));

// Promotion Assignments
router.post('/admin/promotions/:id/items', authenticateAdmin, asyncHandler(promotionController.assignItemsToPromotion));
router.post('/admin/promotions/:id/categories', authenticateAdmin, asyncHandler(promotionController.assignCategoriesToPromotion));
router.get('/admin/promotions/:id/assignments', authenticateAdmin, asyncHandler(promotionController.getPromotionAssignments));
router.get('/admin/promotions/:id/usage', authenticateAdmin, asyncHandler(promotionController.getPromotionUsageLog));
router.get('/admin/promotions/applicable', authenticateAdmin, asyncHandler(promotionController.getApplicablePromotions));

// Feedback
router.get('/admin/feedback', authenticateAdmin, asyncHandler(adminController.getFeedback));
router.get('/admin/feedback/stats', authenticateAdmin, asyncHandler(feedbackController.getFeedbackStats));
router.post('/admin/feedback/:id/respond', authenticateAdmin, asyncHandler(adminController.respondToFeedback));

// Orders (Admin can see all)
router.get('/admin/orders', authenticateAdmin, asyncHandler(orderController.getOrders));
router.get('/admin/orders/:id', authenticateAdmin, asyncHandler(orderController.getOrderDetails));
router.get('/admin/orders/:id/timeline', authenticateAdmin, asyncHandler(additionalController.getOrderTimeline));
router.patch('/admin/orders/:id/status', authenticateAdmin, asyncHandler(orderController.updateOrderStatus));

// Customer Management
router.post('/admin/customers', authenticateAdmin, asyncHandler(additionalController.createCustomer));
router.get('/admin/customers', authenticateAdmin, asyncHandler(additionalController.getCustomers));
router.get('/admin/customers/:id', authenticateAdmin, asyncHandler(additionalController.getCustomer));
router.put('/admin/customers/:id', authenticateAdmin, asyncHandler(additionalController.updateCustomer));

// Supplier Management
router.post('/admin/suppliers', authenticateAdmin, asyncHandler(additionalController.createSupplier));
router.get('/admin/suppliers', authenticateAdmin, asyncHandler(additionalController.getSuppliers));
router.put('/admin/suppliers/:id', authenticateAdmin, asyncHandler(additionalController.updateSupplier));
router.delete('/admin/suppliers/:id', authenticateAdmin, asyncHandler(additionalController.deleteSupplier));

// Cashier Management
router.post('/admin/cashiers', authenticateAdmin, asyncHandler(additionalController.createCashier));
router.get('/admin/cashiers', authenticateAdmin, asyncHandler(additionalController.getCashiers));
router.put('/admin/cashiers/:id', authenticateAdmin, asyncHandler(additionalController.updateCashier));
router.delete('/admin/cashiers/:id', authenticateAdmin, asyncHandler(additionalController.deleteCashier));

// Tax Rules
router.post('/admin/tax-rules', authenticateAdmin, asyncHandler(additionalController.createTaxRule));
router.get('/admin/tax-rules', authenticateAdmin, asyncHandler(additionalController.getTaxRules));
router.put('/admin/tax-rules/:id', authenticateAdmin, asyncHandler(additionalController.updateTaxRule));

// Cake Customization Management
// Flavors
router.post('/admin/cake/flavors', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.createFlavor));
router.get('/admin/cake/flavors', authenticateAdmin, asyncHandler(additionalController.getFlavors));
router.put('/admin/cake/flavors/:id', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.updateFlavor));

// Sizes
router.post('/admin/cake/sizes', authenticateAdmin, asyncHandler(additionalController.createSize));
router.get('/admin/cake/sizes', authenticateAdmin, asyncHandler(additionalController.getSizes));
router.put('/admin/cake/sizes/:id', authenticateAdmin, asyncHandler(additionalController.updateSize));

// Themes
router.post('/admin/cake/themes', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.createTheme));
router.get('/admin/cake/themes', authenticateAdmin, asyncHandler(additionalController.getThemes));
router.put('/admin/cake/themes/:id', authenticateAdmin, uploadProductImage.single('image'), asyncHandler(additionalController.updateTheme));

// Kiosk Settings
router.get('/admin/kiosk-settings', authenticateAdmin, asyncHandler(additionalController.getKioskSettings));
router.post('/admin/kiosk-settings', authenticateAdmin, asyncHandler(additionalController.createKioskSetting));
router.put('/admin/kiosk-settings/:key', authenticateAdmin, asyncHandler(additionalController.updateKioskSetting));

// Refund Management (Admin Only)
router.get('/admin/refund', authenticateAdmin, asyncHandler(refundController.getRefundRequests));
router.get('/admin/refund/:id', authenticateAdmin, asyncHandler(refundController.getRefundDetails));
router.post('/admin/refund/:id/approve', authenticateAdmin, asyncHandler(refundController.approveRefund));
router.post('/admin/refund/:id/reject', authenticateAdmin, asyncHandler(refundController.rejectRefund));
router.post('/admin/refund/:id/complete', authenticateAdmin, asyncHandler(refundController.completeRefund));

// Waste Tracking (Admin can view all)
router.get('/admin/waste', authenticateAdmin, asyncHandler(wasteController.getWasteEntries));
router.get('/admin/waste/summary', authenticateAdmin, asyncHandler(wasteController.getWasteSummary));
router.post('/admin/waste', authenticateAdmin, asyncHandler(wasteController.createWasteEntry));

export default router;
