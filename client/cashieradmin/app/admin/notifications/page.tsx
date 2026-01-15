"use client";

import { useState, useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsService, Notification } from "@/services/notifications.service";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CheckIcon,
  CakeIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread" | "custom_cakes" | "orders" | "inventory">("all");
  const [limit] = useState(50);

  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, mutate } = useNotifications({ limit });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.is_read);
    } else if (filter === "custom_cakes") {
      filtered = filtered.filter((n) => n.type === "custom_cake_message" || n.type === "custom_cake_status");
    } else if (filter === "orders") {
      filtered = filtered.filter((n) => n.type === "new_order");
    } else if (filter === "inventory") {
      filtered = filtered.filter((n) => n.type === "low_stock" || n.type === "stock_update");
    }

    return filtered;
  }, [notifications, filter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: unreadCount,
      customCakes: notifications.filter((n) => n.type === "custom_cake_message" || n.type === "custom_cake_status").length,
      orders: notifications.filter((n) => n.type === "new_order").length,
      inventory: notifications.filter((n) => n.type === "low_stock" || n.type === "stock_update").length,
    };
  }, [notifications, unreadCount]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await markAsRead(notification.notification_id);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Navigate to action URL
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'custom_cake_message':
      case 'custom_cake_status':
        return <CakeIcon className="w-5 h-5" />;
      case 'new_order':
        return <ShoppingCartIcon className="w-5 h-5" />;
      case 'low_stock':
      case 'stock_update':
        return <ArchiveBoxIcon className="w-5 h-5" />;
      default:
        return <BellIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <BellIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              color="primary"
              startContent={<CheckIcon className="w-4 h-4" />}
              variant="flat"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <BellIcon className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread</p>
                <p className="text-2xl font-bold text-red-700">{stats.unread}</p>
              </div>
              <div className="p-3 bg-red-200 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Custom Cakes</p>
                <p className="text-2xl font-bold text-amber-700">{stats.customCakes}</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <CakeIcon className="w-6 h-6 text-amber-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Orders</p>
                <p className="text-2xl font-bold text-green-700">{stats.orders}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <ShoppingCartIcon className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inventory</p>
                <p className="text-2xl font-bold text-purple-700">{stats.inventory}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <ArchiveBoxIcon className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        animate={{ opacity: 1 }}
        className="mb-6"
        initial={{ opacity: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardBody className="p-4">
            <Tabs
              selectedKey={filter}
              onSelectionChange={(key) => setFilter(key as typeof filter)}
            >
              <Tab key="all" title="All Notifications" />
              <Tab
                key="unread"
                title={
                  <div className="flex items-center gap-2">
                    <span>Unread</span>
                    {unreadCount > 0 && (
                      <Chip color="danger" size="sm" variant="solid">
                        {unreadCount}
                      </Chip>
                    )}
                  </div>
                }
              />
              <Tab key="custom_cakes" title="Custom Cakes" />
              <Tab key="orders" title="Orders" />
              <Tab key="inventory" title="Inventory" />
            </Tabs>
          </CardBody>
        </Card>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardBody className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <BellIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No notifications</p>
                <p className="text-gray-400 text-sm">
                  {filter === "unread" ? "All caught up!" : "Check back later for updates"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.notification_id}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? "bg-blue-50/50" : ""
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`p-3 rounded-full ${
                          notification.priority === "high"
                            ? "bg-red-100 text-red-600"
                            : notification.priority === "medium"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${!notification.is_read ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            <ClockIcon className="w-3 h-3 inline mr-1" />
                            {NotificationsService.formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Chip
                            color={NotificationsService.getNotificationColor(notification.priority) as any}
                            size="sm"
                            variant="flat"
                          >
                            {notification.priority}
                          </Chip>
                          <Chip size="sm" variant="flat">
                            {notification.type.replace(/_/g, " ")}
                          </Chip>
                          {!notification.is_read && (
                            <Chip color="primary" size="sm" variant="dot">
                              New
                            </Chip>
                          )}
                        </div>
                      </div>

                      {/* Action Icon */}
                      {notification.action_url && (
                        <div className="flex-shrink-0">
                          <EyeIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
