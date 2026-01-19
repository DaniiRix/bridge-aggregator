import { Container } from "@chakra-ui/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/lib/providers";

import "@rainbow-me/rainbowkit/styles.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LlamaBridge",
  description: "The Aggregtor of aggregators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body className="antialiased">
        <Providers>
          <Container
            p={{ base: 4, md: 6 }}
            px={{ base: 0, lg: 10 }}
            maxW="100%"
            minH="100vh"
            bgColor="bg.1"
            position="relative"
          >
            <Navbar />
            {children}
          </Container>
        </Providers>
      </body>
    </html>
  );
}
