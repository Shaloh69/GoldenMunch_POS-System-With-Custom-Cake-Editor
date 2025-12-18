import { supabase, STORAGE_BUCKETS, getPublicUrl } from '../config/supabase';
import path from 'path';

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Generate a unique filename for uploads
 */
export const generateUniqueFilename = (originalName: string, prefix: string = 'file'): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  return `${prefix}-${timestamp}-${randomSuffix}${extension}`;
};

/**
 * Upload a file buffer to Supabase Storage
 */
export const uploadToSupabase = async (
  file: Express.Multer.File,
  bucket: string,
  folder: string = '',
  filePrefix: string = 'file'
): Promise<UploadResult> => {
  try {
    if (!file || !file.buffer) {
      return {
        success: false,
        error: 'No file provided or file buffer is empty',
      };
    }

    // Generate unique filename
    const filename = generateUniqueFilename(file.originalname, filePrefix);
    const filePath = folder ? `${folder}/${filename}` : filename;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const publicUrl = getPublicUrl(bucket, data.path);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Unknown upload error',
    };
  }
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFromSupabase = async (
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message || 'Unknown delete error',
    };
  }
};

/**
 * Extract file path from Supabase public URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/products/file-123.jpg
 * Returns: file-123.jpg
 */
export const extractFilePathFromUrl = (url: string, bucket: string): string | null => {
  try {
    const urlParts = url.split(`/object/public/${bucket}/`);
    if (urlParts.length === 2) {
      return urlParts[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting file path:', error);
    return null;
  }
};

/**
 * Replace old image with new one (delete old, upload new)
 */
export const replaceImage = async (
  oldImageUrl: string | null,
  newFile: Express.Multer.File,
  bucket: string,
  folder: string = '',
  filePrefix: string = 'file'
): Promise<UploadResult> => {
  try {
    // Upload new image first
    const uploadResult = await uploadToSupabase(newFile, bucket, folder, filePrefix);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Delete old image if it exists
    if (oldImageUrl) {
      const oldFilePath = extractFilePathFromUrl(oldImageUrl, bucket);
      if (oldFilePath) {
        await deleteFromSupabase(bucket, oldFilePath);
      }
    }

    return uploadResult;
  } catch (error: any) {
    console.error('Replace image error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Upload product image (menu items, categories, flavors, themes)
 */
export const uploadProductImage = async (file: Express.Multer.File): Promise<UploadResult> => {
  return uploadToSupabase(file, STORAGE_BUCKETS.PRODUCTS, 'products', 'product');
};

/**
 * Upload payment QR code
 */
export const uploadPaymentQR = async (
  file: Express.Multer.File,
  paymentMethod: string
): Promise<UploadResult> => {
  return uploadToSupabase(file, STORAGE_BUCKETS.PAYMENT_QR, '', `${paymentMethod}-qr`);
};

/**
 * Upload session QR code
 */
export const uploadSessionQR = async (file: Express.Multer.File): Promise<UploadResult> => {
  return uploadToSupabase(file, STORAGE_BUCKETS.SESSION_QR, '', 'qr');
};

/**
 * Replace product image (delete old, upload new)
 */
export const replaceProductImage = async (
  oldImageUrl: string | null,
  newFile: Express.Multer.File
): Promise<UploadResult> => {
  return replaceImage(oldImageUrl, newFile, STORAGE_BUCKETS.PRODUCTS, 'products', 'product');
};
