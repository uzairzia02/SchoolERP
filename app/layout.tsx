import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { auth } from "@/lib/auth";
import { SessionProvider } from "@/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_CONFIG } from "@/config/app.config";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: ["school management", "erp", "education", "students"],
  authors: [{ name: "ScholarSync" }],
  metadataBase: new URL(APP_CONFIG.url),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔥 Session fetch karo lekin login page par null bhejo
  const session = await auth();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <body className="font-sans antialiased">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <SessionProvider session={session}>
            {children}
            <Toaster richColors position="top-right" />
          </SessionProvider>
      </body>
    </html>
  );
}