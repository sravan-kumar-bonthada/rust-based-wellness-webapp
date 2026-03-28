import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Mindful AI | Premium Mental Health Tracker',
  description: 'Track your mood, habits, and sleep with beautifully designed, AI-powered insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} font-sans antialiased text-slate-800 selection:bg-indigo-100 selection:text-indigo-900`}
        suppressHydrationWarning
      >
        {/* We removed the hardcoded bg-gray-50 because global.css handles the premium gradient background now */}
        {children}
      </body>
    </html>
  );
}
