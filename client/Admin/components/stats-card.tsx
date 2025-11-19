"use client";

import { Card, CardBody } from "@heroui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "golden" | "amber" | "green" | "blue";
}

export const StatsCard = ({ title, value, icon, trend, color = "golden" }: StatsCardProps) => {
  const colorClasses = {
    golden: "from-golden-orange to-deep-amber",
    amber: "from-deep-amber to-chocolate-brown",
    green: "from-mint-green to-green-600",
    blue: "from-blue-400 to-blue-600",
  };

  return (
    <Card className="stats-card card-hover">
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-default-600 mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-foreground mb-2">{value}</h3>
            {trend && (
              <div className="flex items-center gap-1">
                <span className={trend.isPositive ? "text-success" : "text-danger"}>
                  {trend.isPositive ? "↑" : "↓"} {trend.value}
                </span>
                <span className="text-xs text-default-500">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <div className="text-3xl text-white">{icon}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
