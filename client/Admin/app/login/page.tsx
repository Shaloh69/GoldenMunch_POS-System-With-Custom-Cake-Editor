"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState<string | number>("admin");

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, accept any credentials
      const tokenKey = selectedTab === "admin" ? "admin_token" : "cashier_token";
      localStorage.setItem(tokenKey, "demo_token_" + Date.now());

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-gradient p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-golden-gradient flex items-center justify-center shadow-xl-golden animate-float">
              <span className="text-5xl">🍰</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-chocolate-brown mb-2">
            Golden Munch
          </h1>
          <p className="text-default-600">
            Admin & Cashier Dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="card-hover shadow-xl-golden">
          <CardHeader className="flex flex-col gap-3 pb-6">
            <Tabs
              fullWidth
              size="lg"
              aria-label="Login type"
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              classNames={{
                tabList: "bg-default-100",
                cursor: "bg-golden-gradient",
                tab: "font-semibold",
              }}
            >
              <Tab key="admin" title="Admin" />
              <Tab key="cashier" title="Cashier" />
            </Tabs>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardBody className="gap-4">
              <Input
                type="email"
                label="Email"
                placeholder="Enter your email"
                variant="bordered"
                size="lg"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                isRequired
                classNames={{
                  inputWrapper: "border-2 hover:border-golden-orange focus-within:border-golden-orange",
                }}
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                variant="bordered"
                size="lg"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                isRequired
                classNames={{
                  inputWrapper: "border-2 hover:border-golden-orange focus-within:border-golden-orange",
                }}
              />

              {error && (
                <div className="text-danger text-sm text-center bg-danger-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-golden-orange" />
                  <span className="text-default-600">Remember me</span>
                </label>
                <a href="#" className="text-golden-orange hover:text-deep-amber font-medium">
                  Forgot password?
                </a>
              </div>
            </CardBody>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-golden-gradient text-cream-white font-bold text-lg shadow-golden"
                isLoading={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-sm text-center text-default-600">
                Demo: Use any email and password to login
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-default-600">
          <p>© 2024 Golden Munch. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
