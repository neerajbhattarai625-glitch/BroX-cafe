import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Dancing_Script, Oswald } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { OrderTracker } from "@/components/order-tracker";
import { SmoothScroller } from "@/components/smooth-scroller";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dancing = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: "Cafe Delight - Modern Dining",
  description: "Experience the best food and ambiance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        jakarta.variable,
        playfair.variable,
        dancing.variable,
        oswald.variable,
        "antialiased font-sans bg-background text-foreground"
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScroller>
            <OrderTracker />
            {children}
            <Toaster position="top-right" richColors />
          </SmoothScroller>
        </ThemeProvider>
      </body>
    </html>
  );
}
