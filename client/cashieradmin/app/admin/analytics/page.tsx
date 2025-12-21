"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

import { AnalyticsService } from "@/services/analytics.service";

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<any>(null);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [wasteData, setWasteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [salesRes, trendingRes, wasteRes] = await Promise.all([
        AnalyticsService.getSalesAnalytics(dateRange),
        AnalyticsService.getTrendingItems({ ...dateRange, limit: 10 }),
        AnalyticsService.getWasteReport(dateRange),
      ]);

      if (salesRes.success) {
        // Server returns array of daily stats, aggregate them
        const dailyStats = Array.isArray(salesRes.data)
          ? salesRes.data
          : [salesRes.data];

        const aggregated = dailyStats.reduce(
          (acc, day: any) => ({
            total_orders: acc.total_orders + (Number(day.total_orders) || 0),
            unique_customers:
              acc.unique_customers + (Number(day.unique_customers) || 0),
            total_revenue: acc.total_revenue + (Number(day.total_revenue) || 0),
          }),
          { total_orders: 0, unique_customers: 0, total_revenue: 0 },
        );

        // Calculate average order value
        const avg_order_value =
          aggregated.total_orders > 0
            ? aggregated.total_revenue / aggregated.total_orders
            : 0;

        setSalesData({
          ...aggregated,
          avg_order_value,
        });
      }

      if (trendingRes.success) {
        setTrendingItems(
          Array.isArray(trendingRes.data) ? trendingRes.data : [],
        );
      }

      if (wasteRes.success) {
        setWasteData(wasteRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculatePopularity = async () => {
    try {
      await AnalyticsService.recalculatePopularity();
      fetchAnalytics();
    } catch (error) {
      console.error("Failed to recalculate popularity:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-default-500 mt-1">
            View sales performance and trends
          </p>
        </div>
        <Button color="primary" onPress={handleRecalculatePopularity}>
          Recalculate Popularity
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardBody>
          <div className="flex gap-4 items-center">
            <Input
              label="Start Date"
              type="date"
              value={dateRange.start_date}
              onValueChange={(v) =>
                setDateRange({ ...dateRange, start_date: v })
              }
            />
            <Input
              label="End Date"
              type="date"
              value={dateRange.end_date}
              onValueChange={(v) => setDateRange({ ...dateRange, end_date: v })}
            />
            <Button color="primary" onPress={fetchAnalytics}>
              Apply
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      {salesData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ₱
                    {parseFloat(salesData.total_revenue || 0).toLocaleString(
                      "en-PH",
                      { minimumFractionDigits: 2 },
                    )}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 rounded-lg">
                  <ShoppingCartIcon className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Total Orders</p>
                  <p className="text-2xl font-bold">
                    {salesData.total_orders || 0}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Avg Order Value</p>
                  <p className="text-2xl font-bold">
                    ₱
                    {parseFloat(salesData.avg_order_value || 0).toLocaleString(
                      "en-PH",
                      { minimumFractionDigits: 2 },
                    )}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Unique Customers</p>
                  <p className="text-2xl font-bold">
                    {salesData.unique_customers || 0}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Trending Items */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Trending Items</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table aria-label="Trending items">
              <TableHeader>
                <TableColumn>RANK</TableColumn>
                <TableColumn>ITEM NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>ORDERS</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>REVENUE</TableColumn>
                <TableColumn>POPULARITY</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No trending items">
                {trendingItems.map((item, index) => (
                  <TableRow key={item.menu_item_id}>
                    <TableCell>
                      <span className="font-bold text-lg">#{index + 1}</span>
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-default-100 rounded text-xs">
                        {item.item_type}
                      </span>
                    </TableCell>
                    <TableCell>{item.recent_orders || 0}</TableCell>
                    <TableCell>{item.recent_quantity || 0}</TableCell>
                    <TableCell>
                      ₱
                      {parseFloat(item.recent_revenue || 0).toLocaleString(
                        "en-PH",
                        { minimumFractionDigits: 2 },
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {parseFloat(item.popularity_score || 0).toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Waste Summary */}
      {wasteData && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold">Waste Summary</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-danger/5 rounded-lg">
                <p className="text-sm text-default-500">Total Waste Cost</p>
                <p className="text-2xl font-bold text-danger">
                  ₱
                  {parseFloat(wasteData.total_waste_cost || 0).toLocaleString(
                    "en-PH",
                    { minimumFractionDigits: 2 },
                  )}
                </p>
              </div>
              <div className="p-4 bg-warning/5 rounded-lg">
                <p className="text-sm text-default-500">Total Items Wasted</p>
                <p className="text-2xl font-bold text-warning">
                  {wasteData.total_items_wasted || 0}
                </p>
              </div>
              <div className="p-4 bg-default-100 rounded-lg">
                <p className="text-sm text-default-500">Waste Incidents</p>
                <p className="text-2xl font-bold">
                  {wasteData.waste_incidents || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
