"use client";

import { FC } from "react";
import { Switch } from "@/components/primitives";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
}) => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();

  const onChange = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isLight = theme === "light" || isSSR;

  return (
    <button
      onClick={onChange}
      className={clsx(
        "px-2 transition-opacity hover:opacity-80 cursor-pointer",
        "flex items-center justify-center",
        "rounded-lg p-2",
        "hover:bg-default-100",
        className
      )}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      {isLight ? (
        <SunFilledIcon size={22} />
      ) : (
        <MoonFilledIcon size={22} />
      )}
    </button>
  );
};
