"use client";

import { FC } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@heroui/switch";

import { SunIcon, MoonIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const onChange = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  return (
    <Switch
      isSelected={theme === "dark"}
      size="lg"
      color="primary"
      startContent={<SunIcon />}
      endContent={<MoonIcon />}
      className={className}
      onChange={onChange}
    />
  );
};
