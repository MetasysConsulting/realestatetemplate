import type { Metadata } from "next";
import {
  Lexend,
  Manrope,
  Mulish,
  Poppins,
} from "next/font/google";
import { TemplateScripts } from "@/components/template/TemplateScripts";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Proty — Real Estate",
    template: "%s",
  },
  description:
    "Proty real estate template — buy, rent, and explore luxury properties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} ${manrope.variable} ${poppins.variable} ${mulish.variable}`}
    >
      <head>
        <link rel="stylesheet" href="/css/bootstrap.css" />
        <link rel="stylesheet" href="/css/animate.min.css" />
        <link rel="stylesheet" href="/css/sib-styles.css" />
        <link rel="stylesheet" href="/css/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="stylesheet" href="/icons/icomoon/style.css" />
        <link rel="shortcut icon" href="/images/logo/favicon.svg" />
      </head>
      <body className="theme-color-4 popup-loader">
        {children}
        <TemplateScripts />
      </body>
    </html>
  );
}
