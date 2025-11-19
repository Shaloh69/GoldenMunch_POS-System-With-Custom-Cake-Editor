"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";

import { StatsCard } from "@/components/stats-card";

export default function DashboardPage() {
  // Mock data
  const stats = [
    {
      title: "Total Revenue",
      value: "$24,580",
      icon: "💰",
      trend: { value: "12.5%", isPositive: true },
      color: "golden" as const,
    },
    {
      title: "Orders Today",
      value: "142",
      icon: "🛒",
      trend: { value: "8.2%", isPositive: true },
      color: "amber" as const,
    },
    {
      title: "Active Products",
      value: "89",
      icon: "🍰",
      trend: { value: "3.1%", isPositive: false },
      color: "green" as const,
    },
    {
      title: "Customer Satisfaction",
      value: "4.8/5",
      icon: "⭐",
      trend: { value: "0.3", isPositive: true },
      color: "blue" as const,
    },
  ];

  const recentOrders = [
    { id: "#1234", customer: "John Doe", items: 3, total: "$45.90", status: "completed" },
    { id: "#1235", customer: "Jane Smith", items: 2, total: "$32.50", status: "pending" },
    { id: "#1236", customer: "Bob Johnson", items: 5, total: "$87.20", status: "processing" },
    { id: "#1237", customer: "Alice Brown", items: 1, total: "$15.00", status: "completed" },
    { id: "#1238", customer: "Charlie Wilson", items: 4, total: "$62.80", status: "processing" },
  ];

  const topProducts = [
    { name: "Chocolate Cake", sold: 45, revenue: "$675.00", trend: 85 },
    { name: "Croissant", sold: 38, revenue: "$152.00", trend: 70 },
    { name: "Red Velvet Cake", sold: 32, revenue: "$576.00", trend: 65 },
    { name: "Blueberry Muffin", sold: 28, revenue: "$112.00", trend: 55 },
    { name: "Chocolate Chip Cookie", sold: 24, revenue: "$72.00", trend: 45 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "pending":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dashboard Overview
        </h1>
        <p className="text-default-600">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="card-hover">
          <CardHeader className="flex justify-between items-center pb-3 border-b border-divider">
            <div>
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <p className="text-sm text-default-600">Latest customer orders</p>
            </div>
            <Button size="sm" color="primary" variant="flat">
              View All
            </Button>
          </CardHeader>
          <CardBody>
            <Table
              aria-label="Recent orders table"
              removeWrapper
              className="min-h-[400px]"
            >
              <TableHeader>
                <TableColumn>ORDER</TableColumn>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>TOTAL</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="font-semibold">{order.total}</TableCell>
                    <TableCell>
                      <Chip
                        color={getStatusColor(order.status)}
                        size="sm"
                        variant="flat"
                        className="capitalize"
                      >
                        {order.status}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Top Products */}
        <Card className="card-hover">
          <CardHeader className="flex justify-between items-center pb-3 border-b border-divider">
            <div>
              <h2 className="text-xl font-bold">Top Products</h2>
              <p className="text-sm text-default-600">Best sellers this month</p>
            </div>
            <Button size="sm" color="primary" variant="flat">
              View All
            </Button>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {topProducts.map((product, index) => (
                <div key={product.name} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-sm text-default-600">
                        {product.sold} sold • {product.revenue}
                      </p>
                    </div>
                    <Chip size="sm" color="primary" variant="flat">
                      #{index + 1}
                    </Chip>
                  </div>
                  <Progress
                    value={product.trend}
                    color="primary"
                    className="max-w-full"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-hover bg-golden-gradient">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-cream-white">
              <h3 className="text-2xl font-bold mb-2">Quick Actions</h3>
              <p className="text-chocolate-brown/80">
                Manage your store with these common tasks
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-cream-white text-golden-orange font-bold shadow-lg"
              >
                📦 Add Product
              </Button>
              <Button
                size="lg"
                className="bg-deep-amber text-cream-white font-bold shadow-lg"
              >
                📊 View Reports
              </Button>
              <Button
                size="lg"
                className="bg-chocolate-brown text-cream-white font-bold shadow-lg"
              >
                👥 Manage Users
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
