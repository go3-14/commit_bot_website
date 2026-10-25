import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'commit-bot',
  description: 'interactive github contribution graph canvas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} font-mono antialiased min-h-screen bg-[#111810] text-[#dbead9] selection:bg-[#99d19c] selection:text-[#111810]`}
      >
        <TooltipProvider delay={150}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
