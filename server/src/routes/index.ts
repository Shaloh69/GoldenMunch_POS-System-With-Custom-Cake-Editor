import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, authenticateAdmin, authenticateCashier, optionalAuth } from '../middleware/auth.middleware';
import { validate, validateQuery, schemas } from '../middleware/validation.middleware';
import { uploadQRCode, uploadProductImage } from '../config/multer';

// Controllers
import * as authController from '../controllers/auth.controller';
import * as kioskController from '../controllers/kiosk.controller';
import * as orderController from '../controllers/order.controller';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// ==== PUBLIC ROUTES ====

// API info endpoint
router.get('/', (req, res) => {
  res.json({
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
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==== AUTH ROUTES ====
router.post('/auth/admin/login', validate(schemas.adminLogin), asyncHandler(authController.adminLogin));
router.post('/auth/cashier/login', validate(schemas.cashierLogin), asyncHandler(authController.cashierLogin));
router.get('/auth/verify', authenticate, asyncHandler(authController.verifyToken));

// ==== KIOSK ROUTES (Public/Optional Auth) ====
router.get('/kiosk/menu', optionalAuth, asyncHandler(kioskController.getMenuItems));
router.get('/kiosk/categories', asyncHandler(kioskController.getCategories));
router.get('/kiosk/menu/:id', asyncHandler(kioskController.getItemDetails));
router.get('/kiosk/promotions', asyncHandler(kioskController.getActivePromotions));
router.get('/kiosk/capacity/check', asyncHandler(kioskController.checkCapacity));

// Kiosk Orders
router.post('/kiosk/orders', validate(schemas.createOrder), asyncHandler(orderController.createOrder));
router.get('/kiosk/orders/:code', asyncHandler(orderController.getOrderByVerificationCode));

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
router.patch('/cashier/orders/:id/status', authenticateCashier, asyncHandler(orderController.updateOrderStatus));

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

// Analytics
router.get('/admin/analytics/sales', authenticateAdmin, asyncHandler(adminController.getSalesAnalytics));
router.get('/admin/analytics/trending', authenticateAdmin, asyncHandler(adminController.getTrendingItems));
router.get('/admin/analytics/waste', authenticateAdmin, asyncHandler(adminController.getWasteReport));
router.post('/admin/analytics/popularity/recalculate', authenticateAdmin, asyncHandler(adminController.recalculatePopularity));

// Promotions
router.post('/admin/promotions', authenticateAdmin, asyncHandler(adminController.createPromotion));
router.get('/admin/promotions', authenticateAdmin, asyncHandler(adminController.getPromotions));

// Feedback
router.get('/admin/feedback', authenticateAdmin, asyncHandler(adminController.getFeedback));
router.post('/admin/feedback/:id/respond', authenticateAdmin, asyncHandler(adminController.respondToFeedback));

// Orders (Admin can see all)
router.get('/admin/orders', authenticateAdmin, asyncHandler(orderController.getOrders));
router.get('/admin/orders/:id', authenticateAdmin, asyncHandler(orderController.getOrderDetails));
router.patch('/admin/orders/:id/status', authenticateAdmin, asyncHandler(orderController.updateOrderStatus));

export default router;
