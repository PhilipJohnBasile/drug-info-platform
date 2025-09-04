'use client'

import { useEffect } from 'react'
function sendToAnalytics({ name, delta, value, id }: any) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    window.gtag?.('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      non_interaction: true,
    })
  }
}

export default function WebVitals() {
  useEffect(() => {
    // Dynamically import web-vitals to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('web-vitals').then((webVitals) => {
        // In web-vitals v3+, use onCLS, onFID, etc.
        if (webVitals.onCLS) {
          webVitals.onCLS(sendToAnalytics)
          webVitals.onFID(sendToAnalytics)
          webVitals.onFCP(sendToAnalytics)
          webVitals.onLCP(sendToAnalytics)
          webVitals.onTTFB(sendToAnalytics)
        } else if (webVitals.getCLS) {
          // Fallback for older versions
          webVitals.getCLS(sendToAnalytics)
          webVitals.getFID(sendToAnalytics)
          webVitals.getFCP(sendToAnalytics)
          webVitals.getLCP(sendToAnalytics)
          webVitals.getTTFB(sendToAnalytics)
        }
      }).catch((error) => {
        console.warn('Web Vitals failed to load:', error)
      })
    }
  }, [])

  return null
}