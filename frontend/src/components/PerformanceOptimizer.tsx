'use client'

import { useEffect } from 'react'
import { injectCriticalCSS } from '@/lib/critical-css'
import { lighthouseOptimizer } from '@/lib/lighthouse-optimizer'

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Inject critical CSS for faster rendering
    injectCriticalCSS()
    
    // Initialize Lighthouse optimizations
    lighthouseOptimizer.init()

    // Preload important resources
    const preloadResources = [
      '/favicon.ico',
      '/logo.png'
    ]

    preloadResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      link.as = resource.includes('.png') || resource.includes('.ico') ? 'image' : 'fetch'
      document.head.appendChild(link)
    })

    // Optimize images that are not yet loaded
    const images = document.querySelectorAll('img[data-src]')
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.getAttribute('data-src')
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    })

    images.forEach(img => imageObserver.observe(img))

    // Cleanup on unmount
    return () => {
      imageObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    // Resource hints for external domains
    const resourceHints = [
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' }
    ]

    resourceHints.forEach(hint => {
      const link = document.createElement('link')
      link.rel = hint.rel
      link.href = hint.href
      if (hint.crossOrigin) {
        link.crossOrigin = hint.crossOrigin
      }
      document.head.appendChild(link)
    })
  }, [])

  return null
}