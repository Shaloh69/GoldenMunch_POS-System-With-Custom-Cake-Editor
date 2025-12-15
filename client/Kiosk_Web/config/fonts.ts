// NOTE: Google Fonts disabled for offline/kiosk mode
// Using system fonts with CSS font-family fallbacks instead
// This prevents 45+ second delays when internet is unavailable

// Define font variables that use system fonts
export const fontSans = {
  variable: "--font-sans",
  style: { fontFamily: "var(--font-sans)" },
};

export const fontDisplay = {
  variable: "--font-display",
  style: { fontFamily: "var(--font-display)" },
};

export const fontMono = {
  variable: "--font-mono",
  style: { fontFamily: "var(--font-mono)" },
};

export const fontSerif = {
  variable: "--font-serif",
  style: { fontFamily: "var(--font-serif)" },
};

// Combine all font variables for easy use in layout
export const fontVariables = [
  fontSans.variable,
  fontDisplay.variable,
  fontMono.variable,
  fontSerif.variable,
].join(" ");
