/**
 * Image utility functions for handling image URLs
 */

/**
 * Get the full image URL from a relative path
 * @param imageUrl - Relative image URL from database (e.g., "/uploads/products/image.jpg")
 * @returns Full URL pointing to backend server
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;

  // If already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Get backend URL from environment or use default
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  // Remove '/api' suffix to get base URL
  const baseUrl = apiUrl.replace('/api', '');

  // Ensure imageUrl starts with /
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${baseUrl}${path}`;
}

/**
 * Check if an image URL is valid and exists
 * @param imageUrl - Image URL to check
 * @returns True if URL appears valid
 */
export function isValidImageUrl(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;

  // Check if it's a relative path to uploads
  if (imageUrl.startsWith('/uploads/')) return true;

  // Check if it's a full URL
  try {
    new URL(imageUrl);
    return true;
  } catch {
    return false;
  }
}
