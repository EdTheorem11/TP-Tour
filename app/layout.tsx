import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tptour.ae"),
  title: {
    default: "TP Tour | UAE Finance & Crypto Golf Society",
    template: "%s | TP Tour",
  },
  description:
    "TP Tour is the UAE's leading golf society for professionals across Finance, Crypto, Digital Assets and FinTech. Play competitive golf at some of Dubai and Abu Dhabi's best courses.",
  openGraph: {
    title: "TP Tour | UAE Finance & Crypto Golf Society",
    description:
      "Golf. Network. Compete. The UAE's leading golf society for professionals across Finance, Crypto, Digital Assets and FinTech.",
    siteName: "TP Tour",
    locale: "en_AE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TP Tour | UAE Finance & Crypto Golf Society",
    description: "Golf. Network. Compete.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-tp-black text-tp-offwhite">{children}</body>
    </html>
  );
}
