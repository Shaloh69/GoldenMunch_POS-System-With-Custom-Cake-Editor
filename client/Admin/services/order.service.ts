import { apiClient } from '@/config/api';

export interface Order {
  order_id: number;
  user_id?: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: 'cash' | 'card' | 'e_wallet';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

class OrderService {
  async getAllOrders(): Promise<Order[]> {
    const response = await apiClient.get('/admin/orders');
    return response.data.orders;
  }

  async getOrderById(id: number): Promise<{ order: Order; items: OrderItem[] }> {
    const response = await apiClient.get(`/admin/orders/${id}`);
    return response.data;
  }

  async updateOrderStatus(id: number, status: Order['status']): Promise<Order> {
    const response = await apiClient.patch(`/admin/orders/${id}/status`, { status });
    return response.data.order;
  }

  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    const response = await apiClient.get(`/admin/orders?status=${status}`);
    return response.data.orders;
  }

  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    const response = await apiClient.get(`/admin/orders?start_date=${startDate}&end_date=${endDate}`);
    return response.data.orders;
  }
}

export const orderService = new OrderService();
