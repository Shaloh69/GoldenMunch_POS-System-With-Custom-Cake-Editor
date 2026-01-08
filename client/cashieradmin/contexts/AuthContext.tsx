"use client";

import type { AuthUser } from "@/types/api";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

import { AuthService } from "@/services/auth.service";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    isCashier?: boolean,
  ) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isCashier: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = AuthService.getUser();

    if (storedUser) {
      setUser(storedUser);
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
      router.push("/dashboard");
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  }, [router]);

  // Memoized logout function
  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  // Memoized role check functions
  const isAdmin = useCallback(() => {
    return user?.type === "admin";
  }, [user]);

  const isCashier = useCallback(() => {
    return user?.type === "cashier";
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders in consumers
  const contextValue = useMemo(
    () => ({ user, isLoading, login, logout, isAdmin, isCashier }),
    [user, isLoading, login, logout, isAdmin, isCashier]
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
