"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import NextLink from "next/link";

export const KioskNavbar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Memoize formatted time to prevent unnecessary recalculations
  const formattedTime = useMemo(
    () => ({
      time: currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      date: currentTime.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    }),
    [currentTime],
  );

  // Update time only every minute instead of every second
  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date());

    // Update every minute (60 seconds)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Optimized idle detection with useCallback
  const handleUserActivity = useCallback(() => {
    // Reset idle timer - this gets called frequently but doesn't update state
    if (window.kioskIdleTimer) {
      clearTimeout(window.kioskIdleTimer);
    }

    window.kioskIdleTimer = setTimeout(() => {
      // Only navigate if we're not already on the idle page
      if (window.location.pathname !== "/idle") {
        window.location.href = "/idle";
      }
    }, 30000); // 30 seconds
  }, []);

  // Set up idle detection with optimized event handling
  useEffect(() => {
    // Initialize timer
    handleUserActivity();

    // Events that reset the idle timer - use passive listeners for better performance
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Use passive event listeners where possible for better performance
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, {
        passive: true,
        capture: false,
      });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (window.kioskIdleTimer) {
        clearTimeout(window.kioskIdleTimer);
      }
    };
  }, [handleUserActivity]);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(
    () => [
      { href: "/", label: "🏠 Home", variant: "light" as const },
      {
        href: "/categories",
        label: "📋 Categories",
        variant: "light" as const,
      },
      { href: "/specials", label: "⭐ Specials", variant: "light" as const },
    ],
    [],
  );

  return (
    <HeroUINavbar
      maxWidth="full"
      position="sticky"
      className="bg-golden-orange border-b-4 border-deep-amber shadow-lg"
    >
      {/* Left side - Logo and Title */}
      <NavbarContent className="basis-1/3" justify="start">
        <NavbarBrand as="div" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <span className="text-4xl">🍰</span>
            <div>
              <p className="font-bold text-2xl text-chocolate-brown">
                Golden Munch
              </p>
              <p className="text-sm text-chocolate-brown/70">
                Touch Screen Ordering
              </p>
            </div>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Center - Navigation Buttons */}
      <NavbarContent className="basis-1/3" justify="center">
        <div className="flex gap-4">
          {navigationItems.map((item) => (
            <NavbarItem key={item.href}>
              <Button
                as={NextLink}
                href={item.href}
                size="lg"
                variant={item.variant}
                className="text-chocolate-brown hover:bg-deep-amber/20 font-semibold text-lg px-6"
              >
                {item.label}
              </Button>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      {/* Right side - Time and Help */}
      <NavbarContent className="basis-1/3" justify="end">
        <NavbarItem className="hidden sm:flex">
          <div className="text-right text-chocolate-brown">
            <div className="font-bold text-xl">{formattedTime.time}</div>
            <div className="text-sm opacity-70">{formattedTime.date}</div>
          </div>
        </NavbarItem>
        <NavbarItem>
          <Button
            size="lg"
            className="bg-deep-amber hover:bg-chocolate-brown text-cream-white font-bold px-6"
            onClick={() => {
              // Handle help action - could open modal, navigate to help page, etc.
              console.log("Help requested");
            }}
          >
            🆘 Help
          </Button>
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};

// Extend window type for TypeScript
declare global {
  interface Window {
    kioskIdleTimer?: NodeJS.Timeout;
  }
}
