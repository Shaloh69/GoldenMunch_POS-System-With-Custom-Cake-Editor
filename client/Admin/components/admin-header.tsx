"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Badge } from "@heroui/badge";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";

import { SearchIcon, BellIcon } from "@/components/icons";

export const AdminHeader = () => {
  const [notifications] = useState(3);

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-white dark:bg-background border-b-2 border-golden-orange/20 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <Input
            isClearable
            radius="lg"
            classNames={{
              input: "text-small",
              inputWrapper: "h-12 bg-white dark:bg-default-100 shadow-sm",
            }}
            placeholder="Search products, orders, users..."
            startContent={
              <SearchIcon size={20} className="text-default-400" />
            }
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="lg">
                <Badge content={notifications} color="danger" size="sm">
                  <BellIcon size={24} className="text-golden-orange" />
                </Badge>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Notifications">
              <DropdownItem key="order1">
                New order #1234 received
              </DropdownItem>
              <DropdownItem key="inventory">
                Low stock alert: Chocolate Cake
              </DropdownItem>
              <DropdownItem key="feedback">
                New customer feedback
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Quick Actions */}
          <Button
            color="primary"
            size="lg"
            className="bg-golden-gradient text-cream-white font-bold shadow-golden"
          >
            + New Order
          </Button>
        </div>
      </div>
    </header>
  );
};
