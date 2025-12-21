"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import {
  UserIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "@/contexts/AuthContext";
import { AuthService } from "@/services/auth.service";

export default function SettingsPage() {
  const { user } = useAuth();

  // Username change state
  const [newUsername, setNewUsername] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUsernameChange = async () => {
    setUsernameError(null);
    setUsernameSuccess(null);

    if (!newUsername.trim()) {
      setUsernameError("Please enter a new username");

      return;
    }

    if (!usernamePassword) {
      setUsernameError("Please enter your current password to confirm");

      return;
    }

    try {
      setUsernameLoading(true);
      await AuthService.updateUsername(newUsername, usernamePassword);

      setUsernameSuccess(
        "Username updated successfully! Please login again with your new username.",
      );
      setNewUsername("");
      setUsernamePassword("");

      // Logout after 3 seconds
      setTimeout(() => {
        AuthService.logout();
      }, 3000);
    } catch (error: any) {
      setUsernameError(error.message || "Failed to update username");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields");

      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");

      return;
    }

    try {
      setPasswordLoading(true);
      await AuthService.updatePassword(currentPassword, newPassword);

      setPasswordSuccess("Password updated successfully! Please login again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Logout after 3 seconds
      setTimeout(() => {
        AuthService.logout();
      }, 3000);
    } catch (error: any) {
      setPasswordError(error.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-default-500 mt-1">
          Manage your admin account credentials
        </p>
      </div>

      {/* Current User Info */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50">
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <Cog6ToothIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-default-500">Currently logged in as</p>
              <p className="text-xl font-bold">{user?.name}</p>
              <p className="text-sm text-default-600">
                Username:{" "}
                <span className="font-mono font-semibold">
                  {user?.username}
                </span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Username */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Change Username</h2>
                <p className="text-sm text-default-500">
                  Update your login username
                </p>
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            {usernameSuccess && (
              <Card className="bg-success-50 border-2 border-success-200">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                    <p className="text-sm text-success-700 font-semibold">
                      {usernameSuccess}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            {usernameError && (
              <Card className="bg-danger-50 border-2 border-danger-200">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <XCircleIcon className="h-5 w-5 text-danger-600" />
                    <p className="text-sm text-danger-700 font-semibold">
                      {usernameError}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            <Input
              isDisabled={usernameLoading || !!usernameSuccess}
              label="New Username"
              placeholder="Enter new username"
              startContent={<UserIcon className="h-4 w-4 text-default-400" />}
              value={newUsername}
              onValueChange={setNewUsername}
            />

            <Input
              description="Required to confirm changes"
              isDisabled={usernameLoading || !!usernameSuccess}
              label="Current Password"
              placeholder="Enter your current password"
              startContent={
                <LockClosedIcon className="h-4 w-4 text-default-400" />
              }
              type="password"
              value={usernamePassword}
              onValueChange={setUsernamePassword}
            />

            <Button
              fullWidth
              color="primary"
              isDisabled={!!usernameSuccess}
              isLoading={usernameLoading}
              startContent={
                !usernameLoading && <UserIcon className="h-5 w-5" />
              }
              onPress={handleUsernameChange}
            >
              {usernameLoading ? "Updating..." : "Update Username"}
            </Button>

            <p className="text-xs text-warning-600 bg-warning-50 p-3 rounded-lg">
              <strong>Note:</strong> Changing your username will log you out.
              You'll need to login again with your new username.
            </p>
          </CardBody>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <LockClosedIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Change Password</h2>
                <p className="text-sm text-default-500">
                  Update your login password
                </p>
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            {passwordSuccess && (
              <Card className="bg-success-50 border-2 border-success-200">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                    <p className="text-sm text-success-700 font-semibold">
                      {passwordSuccess}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            {passwordError && (
              <Card className="bg-danger-50 border-2 border-danger-200">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <XCircleIcon className="h-5 w-5 text-danger-600" />
                    <p className="text-sm text-danger-700 font-semibold">
                      {passwordError}
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            <Input
              isDisabled={passwordLoading || !!passwordSuccess}
              label="Current Password"
              placeholder="Enter current password"
              startContent={
                <LockClosedIcon className="h-4 w-4 text-default-400" />
              }
              type="password"
              value={currentPassword}
              onValueChange={setCurrentPassword}
            />

            <Input
              description="Must be at least 6 characters"
              isDisabled={passwordLoading || !!passwordSuccess}
              label="New Password"
              placeholder="Enter new password"
              startContent={
                <LockClosedIcon className="h-4 w-4 text-default-400" />
              }
              type="password"
              value={newPassword}
              onValueChange={setNewPassword}
            />

            <Input
              isDisabled={passwordLoading || !!passwordSuccess}
              label="Confirm New Password"
              placeholder="Confirm new password"
              startContent={
                <LockClosedIcon className="h-4 w-4 text-default-400" />
              }
              type="password"
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />

            <Button
              fullWidth
              color="primary"
              isDisabled={!!passwordSuccess}
              isLoading={passwordLoading}
              startContent={
                !passwordLoading && <LockClosedIcon className="h-5 w-5" />
              }
              onPress={handlePasswordChange}
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>

            <p className="text-xs text-warning-600 bg-warning-50 p-3 rounded-lg">
              <strong>Note:</strong> Changing your password will log you out.
              You'll need to login again with your new password.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Security Tips */}
      <Card className="bg-default-50">
        <CardHeader>
          <h3 className="font-bold">Security Tips</h3>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-sm text-default-600">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Use a strong password with a mix of letters, numbers, and
                special characters
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Never share your admin credentials with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Change your password regularly (recommended every 90 days)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                Use a unique password that you don't use for other accounts
              </span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
