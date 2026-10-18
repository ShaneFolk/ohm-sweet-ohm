import type { Metadata } from "next";
import { Righteous, Nunito, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Retro display font for headings
const righteous = Righteous({
  variable: "--font-righteous",
  weight: "400",
  subsets: ["latin"],
});

// Clean, friendly body font
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// Monospace for the amber activity-log "terminal"
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ohm Sweet Ohm IT Support",
  description: "The help desk of tomorrow, for Tomorrow Industries.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${righteous.variable} ${nunito.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
