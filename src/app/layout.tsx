import type { Metadata } from "next";
import {
  Inter,
  Lexend,
  Manrope,
  Mulish,
  Poppins,
} from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    default: "REOVANA — Foreclosed Homes",
    template: "%s",
  },
  description:
    "Distressed and foreclosed properties. Find great deals. Create real value.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lexend.variable} ${manrope.variable} ${poppins.variable} ${mulish.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
