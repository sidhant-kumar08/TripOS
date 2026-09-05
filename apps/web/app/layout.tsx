import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-provider';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800', '900'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://tripos.app'),
  title: {
    default: 'TripOS — The All-in-One Group Travel Operating System',
    template: '%s | TripOS',
  },
  description:
    'Effortlessly coordinate group trips with friends. Collaborative day-by-day itineraries, smart multi-currency expense splitting with zero math disputes, and encrypted travel document vault.',
  keywords: [
    'group travel planner',
    'trip itinerary planner',
    'split trip expenses',
    'splitwise alternative for travel',
    'group expense tracker',
    'travel document vault',
    'collaborative trip planning app',
    'vacation planner with friends',
    'multi-currency expense split',
    'debt simplification algorithm',
  ],
  authors: [{ name: 'TripOS Team', url: 'https://tripos.app' }],
  creator: 'TripOS',
  publisher: 'TripOS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tripos.app',
    siteName: 'TripOS',
    title: 'TripOS — The Group Travel Operating System',
    description:
      'Plan itineraries, split costs fairly, and sync tickets & vouchers in one shared workspace for your travel crew.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'TripOS — Group Travel Operating System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripOS — The All-in-One Group Travel Operating System',
    description:
      'No more scattered WhatsApp chats or messy spreadsheets. Seamless itineraries, fair expense splitting, and document vault for group trips.',
    images: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80',
    ],
    creator: '@triposapp',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
  alternates: {
    canonical: 'https://tripos.app',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TripOS',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'An all-in-one group travel operating system featuring collaborative day-by-day itineraries, smart multi-currency expense splitting, and an encrypted travel vault for tickets and vouchers.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '1250',
  },
  featureList: [
    'Collaborative Day-by-Day Itinerary Planning',
    'Smart Multi-Currency Expense Split & Debt Simplification',
    'Encrypted Document & Boarding Pass Vault',
    'Task Assignment & Group Commitments Board',
    'Real-Time Sync with Role-Based Permissions',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-sans bg-background text-foreground antialiased selection:bg-indigo-500/20 selection:text-indigo-900 dark:selection:text-indigo-200">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
