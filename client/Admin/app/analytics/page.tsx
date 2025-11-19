"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";

import { StatsCard } from "@/components/stats-card";

export default function AnalyticsPage() {
  const stats = [
    {
      title: "Total Sales",
      value: "$124,580",
      icon: "💰",
      trend: { value: "23.5%", isPositive: true },
      color: "golden" as const,
    },
    {
      title: "Total Orders",
      value: "3,456",
      icon: "🛒",
      trend: { value: "12.3%", isPositive: true },
      color: "amber" as const,
    },
    {
      title: "Avg Order Value",
      value: "$36.04",
      icon: "📊",
      trend: { value: "5.2%", isPositive: true },
      color: "green" as const,
    },
    {
      title: "Customer Retention",
      value: "68%",
      icon: "🎯",
      trend: { value: "2.1%", isPositive: false },
      color: "blue" as const,
    },
  ];

  const topCategories = [
    { name: "Cakes", sales: "$45,230", percentage: 36, orders: 1245 },
    { name: "Pastries", sales: "$32,120", percentage: 26, orders: 2341 },
    { name: "Beverages", sales: "$28,450", percentage: 23, orders: 3456 },
    { name: "Cookies", sales: "$18,780", percentage: 15, orders: 1890 },
  ];

  const salesByDay = [
    { day: "Monday", sales: "$18,240" },
    { day: "Tuesday", sales: "$15,680" },
    { day: "Wednesday", sales: "$21,340" },
    { day: "Thursday", sales: "$19,870" },
    { day: "Friday", sales: "$25,120" },
    { day: "Saturday", sales: "$32,450" },
    { day: "Sunday", sales: "$28,900" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-default-600">Track your business performance</p>
        </div>
        <Select
          label="Time Period"
          placeholder="Select period"
          className="max-w-xs"
          defaultSelectedKeys={["30days"]}
        >
          <SelectItem key="7days" value="7days">Last 7 Days</SelectItem>
          <SelectItem key="30days" value="30days">Last 30 Days</SelectItem>
          <SelectItem key="90days" value="90days">Last 90 Days</SelectItem>
          <SelectItem key="year" value="year">This Year</SelectItem>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card className="card-hover">
          <CardHeader className="border-b border-divider pb-3">
            <div>
              <h2 className="text-xl font-bold">Sales by Category</h2>
              <p className="text-sm text-default-600">Revenue distribution</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {topCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-default-600">{category.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{category.sales}</p>
                      <Chip size="sm" color="primary" variant="flat">
                        {category.percentage}%
                      </Chip>
                    </div>
                  </div>
                  <div className="w-full bg-default-200 rounded-full h-3">
                    <div
                      className="bg-golden-gradient h-3 rounded-full transition-all duration-500"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Sales by Day */}
        <Card className="card-hover">
          <CardHeader className="border-b border-divider pb-3">
            <div>
              <h2 className="text-xl font-bold">Sales by Day</h2>
              <p className="text-sm text-default-600">Weekly breakdown</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {salesByDay.map((day, index) => {
                const maxSales = 32450;
                const sales = parseFloat(day.sales.replace('$', '').replace(',', ''));
                const percentage = (sales / maxSales) * 100;

                return (
                  <div key={day.day} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-default-600">
                      {day.day}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-default-200 rounded-full h-8">
                        <div
                          className="bg-golden-gradient h-8 rounded-full flex items-center justify-end px-3 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-sm font-bold text-white">
                            {day.sales}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover bg-gradient-to-br from-golden-orange to-deep-amber text-white">
          <CardBody className="p-6">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold mb-1">Best Selling Product</h3>
            <p className="text-2xl font-bold mb-2">Chocolate Cake</p>
            <p className="text-sm opacity-90">234 units sold this month</p>
          </CardBody>
        </Card>

        <Card className="card-hover bg-gradient-to-br from-mint-green to-green-600 text-white">
          <CardBody className="p-6">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="text-lg font-semibold mb-1">Peak Hour</h3>
            <p className="text-2xl font-bold mb-2">2:00 PM - 4:00 PM</p>
            <p className="text-sm opacity-90">Average 45 orders per hour</p>
          </CardBody>
        </Card>

        <Card className="card-hover bg-gradient-to-br from-blue-400 to-blue-600 text-white">
          <CardBody className="p-6">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-lg font-semibold mb-1">New Customers</h3>
            <p className="text-2xl font-bold mb-2">128</p>
            <p className="text-sm opacity-90">+15% from last month</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
