import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Asset Trading View",
  description: "Market data projected onto an interactive 3D terrain for visual analysis.",
  openGraph: {
    title: "3D Asset Trading View",
    description: "Market data projected onto an interactive 3D terrain for visual analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
