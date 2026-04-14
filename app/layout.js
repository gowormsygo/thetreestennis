import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'The Trees',
  description: 'The Trees — Tennis Court Booking & Team Reminders',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'The Trees',
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
        <meta name="apple-mobile-web-app-title" content="The Trees" />
        <meta name="theme-color" content="#2D6A2D" />
      </head>
      <body>
        <div className="min-h-screen pb-10">
          <header className="bg-green-700 text-white px-4 py-4 shadow-lg">
            <div className="max-w-lg mx-auto flex items-center gap-3">
              <span className="text-4xl">🌳</span>
              <div>
                <h1 className="text-2xl font-bold leading-tight">The Trees</h1>
                <p className="text-green-200 text-sm">Property Management</p>
              </div>
            </div>
          </header>
          {/* Navigation tabs */}
          <nav className="bg-green-800 text-white px-4 shadow-md">
            <div className="max-w-lg mx-auto flex">
              <Link
                href="/book"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-green-200 hover:text-white hover:bg-green-700 transition-colors"
              >
                🎾 Tennis Court
              </Link>
              <Link
                href="/reminders"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-green-200 hover:text-white hover:bg-green-700 transition-colors"
              >
                🔔 Reminders
              </Link>
              <Link
                href="/timetable"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-green-200 hover:text-white hover:bg-green-700 transition-colors"
              >
                📅 Timetable
              </Link>
            </div>
          </nav>
          <main className="max-w-lg mx-auto px-4 pt-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
