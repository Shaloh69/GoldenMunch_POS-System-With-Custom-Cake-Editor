"use client";

import type { WasteTracking } from "@/types/api";

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
import { Select, SelectItem } from "@heroui/select";
import {
  MagnifyingGlassIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

import { WasteService } from "@/services/waste.service";
import { WasteReason } from "@/types/api";

// Types
interface WasteStats {
  totalEntries: number;
  totalCost: number;
  totalQuantity: number;
  mostCommonReason: string;
}

export default function WastePage() {
  // State Management
  const [wasteEntries, setWasteEntries] = useState<WasteTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [stats, setStats] = useState<WasteStats>({
    totalEntries: 0,
    totalCost: 0,
    totalQuantity: 0,
    mostCommonReason: "N/A",
  });

  // Initial Data Fetch
  useEffect(() => {
    fetchWasteEntries();
  }, [dateFilter, reasonFilter]);

  // Calculate Stats
  useEffect(() => {
    const totalCost = wasteEntries.reduce(
      (sum, entry) => sum + entry.waste_cost,
      0,
    );
    const totalQuantity = wasteEntries.reduce(
      (sum, entry) => sum + entry.quantity_wasted,
      0,
    );

    // Find most common reason
    const reasonCounts: Record<string, number> = {};

    wasteEntries.forEach((entry) => {
      reasonCounts[entry.waste_reason] =
        (reasonCounts[entry.waste_reason] || 0) + 1;
    });
    const mostCommon = Object.entries(reasonCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    setStats({
      totalEntries: wasteEntries.length,
      totalCost,
      totalQuantity,
      mostCommonReason: mostCommon ? mostCommon[0] : "N/A",
    });
  }, [wasteEntries]);

  // API Calls
  const fetchWasteEntries = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (dateFilter) params.date = dateFilter;
      if (reasonFilter) params.reason = reasonFilter;

      const response = await WasteService.getWaste(params);

      if (response.success) {
        setWasteEntries(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error("Failed to fetch waste entries:", response.message);
      }
    } catch (error) {
      console.error("Failed to fetch waste entries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filteredWasteEntries = wasteEntries.filter(
    (entry) =>
      entry.menu_item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.detailed_reason?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper Functions
  const formatCurrency = (value: number) => {
    return `₱${parseFloat(value.toString()).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PH");
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-PH");
  };

  const getReasonColor = (reason: WasteReason) => {
    const colors: Record<WasteReason, string> = {
      [WasteReason.EXPIRED]: "bg-danger/10 text-danger",
      [WasteReason.DAMAGED]: "bg-warning/10 text-warning",
      [WasteReason.OVERPRODUCTION]: "bg-primary/10 text-primary",
      [WasteReason.QUALITY_ISSUE]: "bg-danger/10 text-danger",
      [WasteReason.CUSTOMER_RETURN]: "bg-warning/10 text-warning",
    };

    return colors[reason] || "bg-default-100";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Waste Tracking</h1>
          <p className="text-default-500 mt-1">
            Monitor and analyze waste entries
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrashIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Entries</p>
                <p className="text-2xl font-bold">{stats.totalEntries}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-danger/10 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalCost)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total Quantity</p>
                <p className="text-2xl font-bold">{stats.totalQuantity}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-default-500">Most Common</p>
                <p className="text-sm font-bold capitalize">
                  {stats.mostCommonReason.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          className="max-w-md"
          placeholder="Search by item or reason..."
          startContent={
            <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />
          }
          onValueChange={setSearchTerm}
        />

        <Input
          className="max-w-xs"
          label="Filter by Date"
          type="date"
          onValueChange={setDateFilter}
        />

        <Select
          className="max-w-xs"
          label="Filter by Reason"
          placeholder="All reasons"
          selectedKeys={reasonFilter ? [reasonFilter] : []}
          onSelectionChange={(keys) => {
            setReasonFilter((Array.from(keys)[0] as string) || "");
          }}
        >
          <SelectItem key="">All Reasons</SelectItem>
          <SelectItem key={WasteReason.EXPIRED}>Expired</SelectItem>
          <SelectItem key={WasteReason.DAMAGED}>Damaged</SelectItem>
          <SelectItem key={WasteReason.OVERPRODUCTION}>
            Overproduction
          </SelectItem>
          <SelectItem key={WasteReason.QUALITY_ISSUE}>Quality Issue</SelectItem>
          <SelectItem key={WasteReason.CUSTOMER_RETURN}>
            Customer Return
          </SelectItem>
        </Select>

        {(dateFilter || reasonFilter) && (
          <Button
            variant="flat"
            onPress={() => {
              setDateFilter("");
              setReasonFilter("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Waste Entries Table */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold">Waste Entries</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p>Loading waste entries...</p>
          ) : (
            <Table aria-label="Waste entries list">
              <TableHeader>
                <TableColumn>ITEM</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>COST</TableColumn>
                <TableColumn>REASON</TableColumn>
                <TableColumn>DETAILED REASON</TableColumn>
                <TableColumn>REPORTED BY</TableColumn>
                <TableColumn>WASTE DATE</TableColumn>
                <TableColumn>CREATED AT</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No waste entries found">
                {filteredWasteEntries.map((entry) => (
                  <TableRow key={entry.waste_id}>
                    <TableCell>
                      <span className="font-semibold">
                        {entry.menu_item?.name || `Item #${entry.menu_item_id}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{entry.quantity_wasted}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-danger">
                        {formatCurrency(entry.waste_cost)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getReasonColor(entry.waste_reason)}`}
                      >
                        {entry.waste_reason.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.detailed_reason ? (
                        <span className="text-sm">{entry.detailed_reason}</span>
                      ) : (
                        <span className="text-default-400 text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.cashier ? (
                        <div className="flex flex-col">
                          <span className="text-sm">{entry.cashier.name}</span>
                          <span className="text-xs text-default-400">
                            {entry.cashier.cashier_code}
                          </span>
                        </div>
                      ) : (
                        <span className="text-default-400 text-sm">
                          Unknown
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(entry.waste_date)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-default-400">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Summary Card */}
      {wasteEntries.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold">Summary</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(WasteReason).map((reason) => {
                const reasonEntries = wasteEntries.filter(
                  (e) => e.waste_reason === reason,
                );
                const reasonCost = reasonEntries.reduce(
                  (sum, e) => sum + e.waste_cost,
                  0,
                );
                const reasonQuantity = reasonEntries.reduce(
                  (sum, e) => sum + e.quantity_wasted,
                  0,
                );

                return (
                  <div key={reason} className="p-4 bg-default-50 rounded-lg">
                    <h4 className="text-sm font-semibold capitalize mb-2">
                      {reason.replace(/_/g, " ")}
                    </h4>
                    <div className="space-y-1">
                      <p className="text-xs text-default-500">
                        Entries:{" "}
                        <span className="font-semibold">
                          {reasonEntries.length}
                        </span>
                      </p>
                      <p className="text-xs text-default-500">
                        Quantity:{" "}
                        <span className="font-semibold">{reasonQuantity}</span>
                      </p>
                      <p className="text-xs text-default-500">
                        Cost:{" "}
                        <span className="font-semibold text-danger">
                          {formatCurrency(reasonCost)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
