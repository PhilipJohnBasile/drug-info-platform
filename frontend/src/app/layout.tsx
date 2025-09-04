import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import WebVitals from '@/components/WebVitals'
import PerformanceOptimizer from '@/components/PerformanceOptimizer'
import JsonLd, { organizationSchema, websiteSchema } from '@/components/JsonLd'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: {
    default: 'Drug Information Platform',
    template: '%s | Drug Information Platform',
  },
  description: 'Comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations.',
  keywords: 'drug information, medication guide, FDA labels, prescription drugs, pharmaceutical information',
  authors: [{ name: 'Drug Information Platform' }],
  creator: 'Drug Information Platform',
  publisher: 'Drug Information Platform',
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
    url: 'https://druginfo.example.com',
    title: 'Drug Information Platform',
    description: 'Comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations.',
    siteName: 'Drug Information Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drug Information Platform',
    description: 'Comprehensive drug information with AI-enhanced content, FDA label data, and patient-friendly explanations.',
    creator: '@druginfoplatform',
  },
  alternates: {
    canonical: 'https://druginfo.example.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${inter.className} ${inter.variable} antialiased bg-secondary-50`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b border-secondary-200">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <a 
                    href="/" 
                    className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Drug Info Platform
                  </a>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                  <a 
                    href="/drugs" 
                    className="text-secondary-600 hover:text-secondary-900 transition-colors"
                  >
                    Browse Drugs
                  </a>
                  <a 
                    href="/search" 
                    className="text-secondary-600 hover:text-secondary-900 transition-colors"
                  >
                    Search
                  </a>
                  <a 
                    href="/provider-explanations" 
                    className="text-secondary-600 hover:text-secondary-900 transition-colors flex items-center gap-1"
                  >
                    🩺 Providers
                  </a>
                </div>
              </div>
            </nav>
          </header>
          
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          
          <WebVitals />
          <PerformanceOptimizer />
          <JsonLd data={organizationSchema} id="organization-schema" />
          <JsonLd data={websiteSchema} id="website-schema" />
          
          <footer className="bg-secondary-900 text-secondary-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-white font-semibold mb-4">Drug Information Platform</h3>
                  <p className="text-sm">
                    Providing comprehensive, AI-enhanced drug information for healthcare professionals and patients.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-4">Important Notice</h4>
                  <p className="text-sm">
                    This information is for educational purposes only and should not replace professional medical advice. 
                    Always consult with a healthcare provider before making decisions about medications.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-4">Resources</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="/about" className="hover:text-white transition-colors">About</a>
                    </li>
                    <li>
                      <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                    </li>
                    <li>
                      <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-sm">
                <p>&copy; 2024 Drug Information Platform. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}