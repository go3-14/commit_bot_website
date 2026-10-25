import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'commit-bot-web | Paint your GitHub contribution graph',
  description:
    'Visual canvas to paint, write, and scatter custom patterns on your GitHub contribution graph using the GitHub Git Data API.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0d1117] text-[#c9d1d9] selection:bg-[#238636] selection:text-white`}
      >
        <TooltipProvider delay={150}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
