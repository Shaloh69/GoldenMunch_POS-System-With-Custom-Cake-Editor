"use client";

import type { AuthUser } from "@/types/api";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { AuthService } from "@/services/auth.service";

type UserMode = "admin" | "cashier";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  currentMode: UserMode;
  login: (
    username: string,
    password: string,
    isCashier?: boolean,
  ) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isCashier: () => boolean;
  switchMode: (mode: UserMode) => void;
  canSwitchMode: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState<UserMode>("admin");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = AuthService.getUser();

    if (storedUser) {
      setUser(storedUser);

      // Load saved mode preference
      const savedMode = localStorage.getItem("user_mode") as UserMode;
      if (savedMode && storedUser.type === "admin") {
        setCurrentMode(savedMode);
      } else {
        setCurrentMode(storedUser.type === "admin" ? "admin" : "cashier");
      }
    }
    setIsLoading(false);
  }, []);

  // Memoized login function to prevent unnecessary re-renders
  const login = useCallback(async (
    username: string,
    password: string,
    isCashier: boolean = false,
  ) => {
    try {
      let authResponse;

      if (isCashier) {
        authResponse = await AuthService.loginCashier(username, password);
      } else {
        authResponse = await AuthService.loginAdmin(username, password);
      }

      setUser(authResponse.user);
      setCurrentMode(authResponse.user.type === "admin" ? "admin" : "cashier");
      router.push("/dashboard");
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  }, [router]);

  // Memoized logout function
  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    setCurrentMode("admin");
    localStorage.removeItem("user_mode");
    router.push("/login");
  }, [router]);

  // Memoized role check functions
  const isAdmin = useCallback(() => {
    return user?.type === "admin";
  }, [user]);

  const isCashier = useCallback(() => {
    return user?.type === "cashier";
  }, [user]);

  // Check if user can switch modes (only admins can)
  const canSwitchMode = useCallback(() => {
    return user?.type === "admin";
  }, [user]);

  // Switch between admin and cashier mode
  const switchMode = useCallback((mode: UserMode) => {
    if (!canSwitchMode()) {
      console.warn("Only admins can switch modes");
      return;
    }

    setCurrentMode(mode);
    localStorage.setItem("user_mode", mode);

    // Navigate to appropriate dashboard based on mode
    if (mode === "cashier") {
      // Redirect to cashier pages if currently on admin pages
      if (pathname?.startsWith("/admin")) {
        router.push("/cashier/new-order");
      }
    } else {
      // Redirect to admin pages if currently on cashier pages
      if (pathname?.startsWith("/cashier")) {
        router.push("/admin/analytics");
      }
    }
  }, [canSwitchMode, pathname, router]);

  // Memoize context value to prevent unnecessary re-renders in consumers
  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      currentMode,
      login,
      logout,
      isAdmin,
      isCashier,
      switchMode,
      canSwitchMode
    }),
    [user, isLoading, currentMode, login, logout, isAdmin, isCashier, switchMode, canSwitchMode]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
