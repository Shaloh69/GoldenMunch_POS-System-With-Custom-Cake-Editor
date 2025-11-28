'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AnalyticsService } from '@/services/analytics.service';
import { OrderService } from '@/services/order.service';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch sales analytics for today
      const analyticsResponse = await AnalyticsService.getSalesAnalytics({
        start_date: today,
        end_date: today,
      });

      // Fetch recent orders
      const ordersResponse = await OrderService.getOrders();

      if (analyticsResponse.success && analyticsResponse.data) {
        const data = analyticsResponse.data;
        setStats({
          todayOrders: data.totalOrders || 0,
          todayRevenue: data.totalRevenue || 0,
          totalCustomers: 0, // unique_customers not available in SalesAnalytics
          avgOrderValue: data.averageOrderValue || 0,
        });
      }

      if (ordersResponse.success && ordersResponse.data) {
        // Server returns { orders: [...], pagination: {...} }
        setRecentOrders((ordersResponse.data.orders || []).slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-light-caramel via-muted-clay to-light-caramel p-10 rounded-2xl shadow-caramel border-2 border-light-caramel/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream-white/10 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-white/90 mt-3 text-lg font-medium">
            {isAdmin() ? '🔧 Admin Dashboard' : '💰 Cashier Dashboard'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Orders"
          value={loading ? '...' : stats.todayOrders.toString()}
          icon={ShoppingCartIcon}
          color="from-light-caramel to-warm-beige"
        />
        <StatCard
          title="Revenue"
          value={loading ? '...' : `₱${stats.todayRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          icon={CurrencyDollarIcon}
          color="from-muted-clay to-light-caramel"
        />
        <StatCard
          title="Customers"
          value={loading ? '...' : stats.totalCustomers.toString()}
          icon={UserGroupIcon}
          color="from-warm-beige to-soft-sand"
        />
        <StatCard
          title="Avg Order Value"
          value={loading ? '...' : `₱${stats.avgOrderValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
          icon={ChartBarIcon}
          color="from-soft-sand to-light-caramel"
        />
      </div>

      {/* Recent Activity */}
      <Card className="shadow-caramel border-2 border-light-caramel/20">
        <CardHeader className="bg-gradient-to-r from-soft-sand/30 to-transparent border-b border-light-caramel/20 p-6">
          <h3 className="text-2xl font-bold text-muted-clay">Recent Orders</h3>
        </CardHeader>
        <CardBody className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-light-caramel border-t-transparent"></div>
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.order_id}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-cream-white to-soft-sand/50 rounded-xl border border-light-caramel/20 hover:shadow-caramel transition-all duration-300"
                >
                  <div>
                    <p className="font-bold text-muted-clay text-lg">Order #{order.order_id}</p>
                    <p className="text-sm text-warm-beige font-medium">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-muted-clay">₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    <p className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${
                      order.order_status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.order_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-warm-beige py-8 font-medium">No recent orders</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="shadow-caramel border border-light-caramel/20 hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-light-caramel/40">
      <CardBody className="flex flex-row items-center gap-5 p-6">
        <div className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-md`}>
          <Icon className="h-10 w-10 text-white drop-shadow-lg" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-warm-beige font-semibold uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-muted-clay mt-1">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
