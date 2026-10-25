import "./globals.css";
import type { Metadata, Viewport } from "next";


export const metadata: Metadata = {
  title: "Famba Zvakanaka | Zimbabwe Road Safety",
  description:
    "Report road accidents, congestion and hazards across Zimbabwe.",
  applicationName: "Famba Zvakanaka",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Famba Zvakanaka"
  }
};

export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
