import { 
  Inter as FontSans, 
  Poppins as FontDisplay,
  JetBrains_Mono as FontMono,
  Playfair_Display as FontSerif, 
  Playfair_Display,
  JetBrains_Mono
} from "next/font/google";

// Main sans-serif font for body text
export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Display font for headings and titles
export const fontDisplay = FontDisplay({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Monospace font for code and technical text
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Serif font for elegant text (optional)
export const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Combine all font variables for easy use in layout
export const fontVariables = [
  fontSans.variable,
  fontDisplay.variable,
  fontMono.variable,
  fontSerif.variable,
].join(" ");