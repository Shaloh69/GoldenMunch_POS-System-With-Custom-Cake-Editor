import { apiClient } from '@/config/api';

export interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url?: string;
  is_available?: boolean;
  is_featured?: boolean;
}

class ProductService {
  async getAllProducts(): Promise<Product[]> {
    const response = await apiClient.get('/admin/products');
    return response.data.products;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get(`/admin/products/${id}`);
    return response.data.product;
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    const response = await apiClient.post('/admin/products', data);
    return response.data.product;
  }

  async updateProduct(id: number, data: Partial<CreateProductData>): Promise<Product> {
    const response = await apiClient.put(`/admin/products/${id}`, data);
    return response.data.product;
  }

  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`);
  }

  async toggleAvailability(id: number): Promise<Product> {
    const response = await apiClient.patch(`/admin/products/${id}/toggle-availability`);
    return response.data.product;
  }
}

export const productService = new ProductService();
