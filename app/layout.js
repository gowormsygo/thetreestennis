import './globals.css';

export const metadata = {
  title: 'The Trees Tennis Court',
  description: 'Book the communal tennis court at The Trees',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tennis Court',
  },
};

export const viewport = {
  themeColor: '#2D6A2D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tennis Court" />
        <meta name="theme-color" content="#2D6A2D" />
      </head>
      <body>
        <div className="min-h-screen pb-10">
          <header className="bg-green-700 text-white px-4 py-5 shadow-lg">
            <div className="max-w-lg mx-auto flex items-center gap-3">
              <span className="text-4xl">🎾</span>
              <div>
                <h1 className="text-2xl font-bold leading-tight">The Trees</h1>
                <p className="text-green-200 text-sm">Tennis Court Booking</p>
              </div>
            </div>
          </header>
          <main className="max-w-lg mx-auto px-4 pt-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
