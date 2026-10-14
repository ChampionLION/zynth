import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zynth — Synthesize yourself. Reach your zenith.",
  description:
    "Zynth is a behavioral synthesis engine. You don't consume Zynth. You perform in it.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
