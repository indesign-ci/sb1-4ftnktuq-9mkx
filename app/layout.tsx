import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { APP_NAME } from '@/lib/app-config';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://indesign-plus-pro.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: `${APP_NAME} - Gestion de Projets Décoration`,
  description: 'Application professionnelle de gestion de projets de décoration d\'intérieur',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['décoration', 'design intérieur', 'gestion de projet', 'architecture'],
  authors: [{ name: APP_NAME }],
  icons: [
    { rel: 'icon', url: '/favicon.svg' },
    { rel: 'apple-touch-icon', url: '/icon-192x192.png' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: `${APP_NAME} - Gestion de Projets Décoration`,
    description: 'Application professionnelle de gestion de projets de décoration d\'intérieur',
  },
  twitter: {
    card: 'summary',
    title: APP_NAME,
    description: 'Application professionnelle de gestion de projets de décoration d\'intérieur',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#C5A572" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content={APP_NAME} />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-body antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
