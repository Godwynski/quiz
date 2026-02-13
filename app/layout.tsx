import type { Metadata } from "next";
import { Patrick_Hand } from "next/font/google";
import "./globals.css";

const patrickHand = Patrick_Hand({
  variable: "--font-patrick",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'QuizMaster | Royal Edition',
  description: 'A majestic quiz experience',
  icons: {
    icon: '/logo.svg',
  },
};

import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./components/auth-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${patrickHand.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster 
              richColors 
              position="top-center" 
              closeButton 
              toastOptions={{
                className: "doodle-border",
                style: {
                  borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", // inline style fallback if class doesn't hit
                  border: "2px solid currentColor",
                },
                classNames: {
                  toast: "doodle-border font-sans", // font-sans should map to Patrick Hand via layout
                }
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
