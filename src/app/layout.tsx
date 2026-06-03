import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Proty — Hawaii Real Estate",
    template: "%s | Proty Real Estate",
  },
  description:
    "Luxury real estate listings in Hawaii. Buy, rent, and explore premium homes with Proty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lexend.variable}>
      <head>
        <link rel="stylesheet" href="/css/bootstrap.css" />
        <link rel="stylesheet" href="/css/animate.min.css" />
        <link rel="stylesheet" href="/css/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="stylesheet" href="/icons/icomoon/style.css" />
        <link rel="shortcut icon" href="/images/logo/favicon.svg" />
      </head>
      <body className="theme-color-4 popup-loader">{children}</body>
    </html>
  );
}
