import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AccountProvider } from "@/components/AccountProvider";
import {BRAND_NAME,BRAND_TITLE,BRAND_DESCRIPTION,BRAND_URL} from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  applicationName: BRAND_NAME,
  title: BRAND_TITLE,
  description: BRAND_DESCRIPTION,
  icons: {icon:[{url:"/favicon.svg",type:"image/svg+xml"},{url:"/brand/favicon-32-v1.png",type:"image/png",sizes:"32x32"}]},
  openGraph: {
    type:"website",siteName:BRAND_NAME,url:BRAND_URL,title:BRAND_TITLE,description:BRAND_DESCRIPTION,
    locale:"en_US",images:[{url:"/brand/zynth-og-v1.png",width:1200,height:630,alt:"Zynth. Synthesize your zenith. Build who you want to become."}],
  },
  twitter:{card:"summary_large_image",title:BRAND_TITLE,description:BRAND_DESCRIPTION,images:["/brand/zynth-og-v1.png"]},
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
