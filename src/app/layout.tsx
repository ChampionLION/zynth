import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AccountProvider } from "@/components/AccountProvider";

export const metadata: Metadata = {
  title: "Zynth — Synthesize yourself. Reach your zenith.",
  description:
    "Choose who you want to become. Build your skills through meaningful daily quests, and follow your progress across a world of checkpoints.",
};

export const viewport: Viewport = {
  themeColor: "#0D0D14",
  width: "device-width",
  initialScale: 1,

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AccountProvider>{children}</AccountProvider></body>
    </html>
  );
}
