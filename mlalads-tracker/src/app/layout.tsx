import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jawabdari • Ludhiana MLAs, Contractors & Public Projects',
  description: 'Track MLALADS public infrastructure projects, budget allocations, and contractor performance across all 14 Assembly Constituencies of Ludhiana, Punjab.',
  keywords: [
    'Jawabdari',
    'Ludhiana',
    'MLALADS',
    'Punjab',
    'Contractors Database',
    'MLAs Ludhiana',
    'Public Works',
    'Empowered Indian'
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAF7F2] text-[#0B1B2F] antialiased">
        {children}
      </body>
    </html>
  );
}
