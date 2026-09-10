import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const productDescription =
  "A marketplace for small, focused software tools that solve specific problems.";

export const metadata: Metadata = {
  title: {
    default: "MiniKit Market",
    template: "%s | MiniKit Market",
  },
  description: productDescription,
  openGraph: {
    title: "MiniKit Market",
    description: productDescription,
    siteName: "MiniKit Market",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
