"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";

import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginType, setLoginType] = useState<"admin" | "cashier">("admin");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password, loginType === "cashier");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-white via-soft-sand to-warm-beige p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-light-caramel/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-muted-clay/20 rounded-full blur-3xl" />

      <Card className="w-full max-w-md shadow-caramel border-2 border-light-caramel/30 backdrop-blur-xl animate-scale-in z-10">
        <CardHeader className="flex flex-col gap-4 items-center pt-10 pb-6 bg-gradient-to-b from-soft-sand/30 to-transparent border-b border-light-caramel/20">
          <div className="text-6xl drop-shadow-lg">🥐</div>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-light-caramel via-muted-clay to-light-caramel bg-clip-text text-transparent">
              GoldenMunch
            </h1>
            <p className="text-sm text-warm-beige font-medium mt-2">
              Admin & Cashier Portal
            </p>
          </div>
        </CardHeader>
        <CardBody className="px-8 pb-10 pt-6">
          <Tabs
            fullWidth
            className="mb-8"
            classNames={{
              tabList: "bg-soft-sand/50 p-1 border border-light-caramel/20",
              cursor:
                "bg-gradient-to-r from-light-caramel to-muted-clay shadow-caramel",
              tab: "text-warm-beige data-[selected=true]:text-white font-semibold",
            }}
            color="primary"
            selectedKey={loginType}
            onSelectionChange={(key) =>
              setLoginType(key as "admin" | "cashier")
            }
          >
            <Tab key="admin" title="Admin Login" />
            <Tab key="cashier" title="Cashier Login" />
          </Tabs>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <Input
              required
              classNames={{
                input: "text-muted-clay font-medium",
                label: "text-warm-beige font-semibold",
                inputWrapper:
                  "border-light-caramel/40 hover:border-muted-clay focus-within:border-muted-clay bg-cream-white/50",
              }}
              color="primary"
              label={loginType === "admin" ? "Username" : "Cashier Code"}
              placeholder={
                loginType === "admin"
                  ? "Enter your username"
                  : "Enter cashier code"
              }
              value={username}
              variant="bordered"
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              required
              classNames={{
                input: "text-muted-clay font-medium",
                label: "text-warm-beige font-semibold",
                inputWrapper:
                  "border-light-caramel/40 hover:border-muted-clay focus-within:border-muted-clay bg-cream-white/50",
              }}
              color="primary"
              label={loginType === "admin" ? "Password" : "PIN"}
              maxLength={loginType === "cashier" ? 4 : undefined}
              placeholder={
                loginType === "admin"
                  ? "Enter your password"
                  : "Enter 4-digit PIN"
              }
              type="password"
              value={password}
              variant="bordered"
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div className="text-red-600 text-sm p-3 bg-red-50 rounded-xl border border-red-200 animate-slide-up">
                {error}
              </div>
            )}

            <Button
              className="mt-3 bg-gradient-to-r from-light-caramel via-muted-clay to-light-caramel text-white font-bold shadow-caramel hover:shadow-xl hover:scale-105 transition-all duration-300 border border-light-caramel/30"
              isLoading={isLoading}
              size="lg"
              type="submit"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-warm-beige">
              Powered by GoldenMunch • Soft & Airy Theme
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
