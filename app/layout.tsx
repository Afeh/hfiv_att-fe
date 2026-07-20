import type { Metadata } from "next";
import { Bitter, Work_Sans } from "next/font/google";
import "./globals.css";
import { PinGate } from "./pin-gate";

const bitter = Bitter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Attendance",
  description: "Weekend check-in",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bitter.variable} ${workSans.variable}`}>
      <body>
        <PinGate>{children}</PinGate>
      </body>
    </html>
  );
}
