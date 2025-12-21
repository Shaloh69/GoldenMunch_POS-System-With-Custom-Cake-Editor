"use client";

import type { AuthUser } from "@/types/api";

import React, { createContext, useContext, useState, useEffect } from "react";
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

  const login = async (
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
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    router.push("/login");
  };

  const isAdmin = () => {
    return user?.type === "admin";
  };

  const isCashier = () => {
    return user?.type === "cashier";
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, isAdmin, isCashier }}
    >
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
