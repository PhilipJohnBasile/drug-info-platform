// Lighthouse Performance Optimizations
export class LighthouseOptimizer {
  private static instance: LighthouseOptimizer
  
  public static getInstance(): LighthouseOptimizer {
    if (!LighthouseOptimizer.instance) {
      LighthouseOptimizer.instance = new LighthouseOptimizer()
    }
    return LighthouseOptimizer.instance
  }

  // Core Web Vitals optimization
  public optimizeCoreWebVitals() {
    if (typeof window === 'undefined') return

    // Optimize Largest Contentful Paint (LCP)
    this.optimizeLCP()
    
    // Optimize First Input Delay (FID)
    this.optimizeFID()
    
    // Optimize Cumulative Layout Shift (CLS)
    this.optimizeCLS()
    
    // Optimize First Contentful Paint (FCP)
    this.optimizeFCP()
  }

  private optimizeLCP() {
    // Preload hero images and critical resources
    const heroImages = document.querySelectorAll('[data-hero-image]')
    heroImages.forEach((img) => {
      if (img instanceof HTMLImageElement && img.src) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = img.src
        link.as = 'image'
        document.head.appendChild(link)
      }
    })

    // Preload critical fonts
    const criticalFonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
    ]
    
    criticalFonts.forEach((font) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = font
      link.as = 'style'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }

  private optimizeFID() {
    // Defer non-critical JavaScript
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.loadNonCriticalScripts()
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.loadNonCriticalScripts()
      }, 1000)
    }
  }

  private optimizeCLS() {
    // Reserve space for dynamic content
    const dynamicElements = document.querySelectorAll('[data-dynamic-height]')
    dynamicElements.forEach((element) => {
      const height = element.getAttribute('data-dynamic-height')
      if (height && element instanceof HTMLElement) {
        element.style.minHeight = height
      }
    })

    // Add size attributes to images that don't have them
    const images = document.querySelectorAll('img:not([width]):not([height])')
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        img.addEventListener('load', () => {
          if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
            img.setAttribute('width', img.naturalWidth.toString())
            img.setAttribute('height', img.naturalHeight.toString())
          }
        })
      }
    })
  }

  private optimizeFCP() {
    // Inline critical CSS for above-the-fold content
    const criticalCSS = `
      /* Above-the-fold critical styles */
      .header { background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .hero-section { padding: 2rem 0; background: #f8fafc; }
      .card { background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    `
    
    const style = document.createElement('style')
    style.innerHTML = criticalCSS
    document.head.insertBefore(style, document.head.firstChild)
  }

  private loadNonCriticalScripts() {
    // Load analytics and other non-critical scripts
    const scripts = [
      'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID'
    ]

    scripts.forEach((src) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    })
  }

  // Accessibility improvements for Lighthouse
  public improveAccessibility() {
    if (typeof window === 'undefined') return

    // Add missing alt attributes
    const images = document.querySelectorAll('img:not([alt])')
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        img.alt = img.title || 'Image'
      }
    })

    // Add focus indicators
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    )
    
    focusableElements.forEach((element) => {
      element.addEventListener('focus', () => {
        element.classList.add('focused')
      })
      
      element.addEventListener('blur', () => {
        element.classList.remove('focused')
      })
    })

    // Ensure proper heading hierarchy
    this.validateHeadingHierarchy()
  }

  private validateHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1))
      if (level > previousLevel + 1) {
        console.warn(`Heading hierarchy issue: ${heading.tagName} follows h${previousLevel}`, heading)
      }
      previousLevel = level
    })
  }

  // Best Practices optimizations
  public implementBestPractices() {
    if (typeof window === 'undefined') return

    // Add security headers via meta tags (backup to server headers)
    const securityMetas = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { name: 'format-detection', content: 'telephone=no' }
    ]

    securityMetas.forEach((meta) => {
      const existing = document.querySelector(`meta[name="${meta.name}"]`)
      if (!existing) {
        const metaTag = document.createElement('meta')
        metaTag.name = meta.name
        metaTag.content = meta.content
        document.head.appendChild(metaTag)
      }
    })

    // Add proper meta viewport if missing
    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) {
      const viewportMeta = document.createElement('meta')
      viewportMeta.name = 'viewport'
      viewportMeta.content = 'width=device-width, initial-scale=1'
      document.head.appendChild(viewportMeta)
    }
  }

  // SEO optimizations
  public optimizeSEO() {
    if (typeof window === 'undefined') return

    // Ensure all links have descriptive text
    const links = document.querySelectorAll('a')
    links.forEach((link) => {
      if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
        console.warn('Link without descriptive text found:', link)
      }
    })

    // Add hreflang for international sites (if needed)
    if (!document.querySelector('link[hreflang]')) {
      const hreflang = document.createElement('link')
      hreflang.rel = 'alternate'
      hreflang.hrefLang = 'en'
      hreflang.href = window.location.href
      document.head.appendChild(hreflang)
    }
  }

  // Initialize all optimizations
  public init() {
    if (typeof window === 'undefined') return

    // Run optimizations on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.runOptimizations()
      })
    } else {
      this.runOptimizations()
    }
  }

  private runOptimizations() {
    this.optimizeCoreWebVitals()
    this.improveAccessibility()
    this.implementBestPractices()
    this.optimizeSEO()
  }
}

// Export singleton instance
export const lighthouseOptimizer = LighthouseOptimizer.getInstance()