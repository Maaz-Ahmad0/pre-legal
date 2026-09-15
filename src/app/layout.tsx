import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pre-Legal — Document Automation SaaS",
  description:
    "Create pre-legal documents from guided templates with workspace authentication, live preview, saved drafts, and exports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased font-sans text-ink">{children}</body>
    </html>
  );
}
