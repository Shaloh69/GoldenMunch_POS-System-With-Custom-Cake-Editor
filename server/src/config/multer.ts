import multer from 'multer';
import path from 'path';

/**
 * Multer configuration for Supabase Storage
 * Uses memory storage to temporarily hold files before uploading to Supabase
 * No local file system storage is used - all files go directly to cloud storage
 */

// Use memory storage - files are stored in memory as Buffer objects
// This is required for Supabase storage as we upload directly to cloud
const memoryStorage = multer.memoryStorage();

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

// Multer configurations using memory storage
// All files are uploaded to Supabase Storage instead of local disk
// Trim MAX_FILE_SIZE to prevent parsing errors from whitespace
const maxFileSize = parseInt((process.env.MAX_FILE_SIZE || '10485760').trim()); // 10MB default

export const uploadQRCode = multer({
  storage: memoryStorage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: imageFilter
});

export const uploadProductImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: imageFilter
});

// Multiple file uploads
export const uploadMultipleProducts = multer({
  storage: memoryStorage,
  limits: {
    fileSize: maxFileSize,
    files: 5 // Maximum 5 files
  },
  fileFilter: imageFilter
});

// Payment QR code upload
export const uploadPaymentQR = multer({
  storage: memoryStorage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: imageFilter
});
