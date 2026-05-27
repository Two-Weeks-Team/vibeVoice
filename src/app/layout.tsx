import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Inter, Noto_Sans_KR } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeVoice — Text to Audio",
  description: "Text-to-Audio powered by MiniMax",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${inter.variable} ${notoSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            className: "font-sans",
          }}
        />
      </body>
    </html>
  );
}
