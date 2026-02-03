import '@rainbow-me/rainbowkit/styles.css';
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "GhostRoute | Anonymous DeFi",
  description: "Your gateway to private, untraceable transactions on the decentralized web.",
  icons: {
    icon: '/ghost-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="ghost-theme">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
