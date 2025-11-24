import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['./uploads/qr-codes', './uploads/products', './uploads/temp', './uploads/payment-qr'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration for QR codes
const qrCodeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, './uploads/qr-codes');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `qr-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Storage configuration for product images
const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, './uploads/products');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Storage configuration for payment QR codes
const paymentQRStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, './uploads/payment-qr');
  },
  filename: (req, file, cb) => {
    const paymentMethod = req.body.payment_method || 'unknown';
    const timestamp = Date.now();
    cb(null, `${paymentMethod}-qr-${timestamp}${path.extname(file.originalname)}`);
  }
});

// File filter for images only
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer configurations
export const uploadQRCode = multer({
  storage: qrCodeStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: imageFilter
});

export const uploadProductImage = multer({
  storage: productStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
  },
  fileFilter: imageFilter
});

// Multiple file uploads
export const uploadMultipleProducts = multer({
  storage: productStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    files: 5 // Maximum 5 files
  },
  fileFilter: imageFilter
});

// Payment QR code upload
export const uploadPaymentQR = multer({
  storage: paymentQRStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
  },
  fileFilter: imageFilter
});
