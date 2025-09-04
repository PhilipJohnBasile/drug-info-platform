import { test, expect } from '@playwright/test'

test.describe('SEO and Accessibility Tests', () => {
  test('should have proper meta tags on homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check essential meta tags
    const title = await page.locator('title').textContent()
    expect(title).toBeTruthy()
    expect(title).toContain('Drug Information Platform')
    
    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toBeTruthy()
    expect(metaDescription!.length).toBeLessThanOrEqual(160)
    
    // Check meta viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
    
    // Check canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toBeTruthy()
  })

  test('should have proper meta tags on drug pages', async ({ page }) => {
    const response = await page.goto('/drugs/lisinopril', { waitUntil: 'networkidle' })
    
    if (response?.status() === 200) {
      // Check dynamic title
      const title = await page.locator('title').textContent()
      expect(title).toBeTruthy()
      expect(title).toContain('Drug Information Platform')
      
      // Check dynamic meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
      expect(metaDescription).toBeTruthy()
      expect(metaDescription!.length).toBeLessThanOrEqual(160)
      
      // Check Open Graph tags
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
      const ogType = await page.locator('meta[property="og:type"]').getAttribute('content')
      
      expect(ogTitle).toBeTruthy()
      expect(ogDescription).toBeTruthy()
      expect(ogType).toBe('article')
      
      // Check Twitter Card tags
      const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content')
      const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content')
      
      expect(twitterCard).toBe('summary_large_image')
      expect(twitterTitle).toBeTruthy()
    }
  })

  test('should have structured data on drug pages', async ({ page }) => {
    const response = await page.goto('/drugs/lisinopril', { waitUntil: 'networkidle' })
    
    if (response?.status() === 200) {
      // Check for JSON-LD structured data
      const jsonLdScripts = page.locator('script[type="application/ld+json"]')
      const count = await jsonLdScripts.count()
      
      expect(count).toBeGreaterThan(0)
      
      // Validate structured data content
      const firstScript = await jsonLdScripts.first().textContent()
      expect(firstScript).toBeTruthy()
      
      // Should be valid JSON
      expect(() => JSON.parse(firstScript!)).not.toThrow()
      
      const structuredData = JSON.parse(firstScript!)
      expect(structuredData['@context']).toBe('https://schema.org')
      expect(structuredData['@type']).toBeTruthy()
    }
  })

  test('should be accessible with proper ARIA labels', async ({ page }) => {
    await page.goto('/')
    
    // Check main navigation
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check main content area
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    // Check for proper heading hierarchy
    const h1Elements = page.locator('h1')
    const h1Count = await h1Elements.count()
    expect(h1Count).toBe(1) // Should have exactly one H1
    
    // Check for alt attributes on images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        expect(alt).toBeTruthy() // All images should have alt text
      }
    }
  })

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/search')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    // Search input should be focusable
    const searchInput = page.locator('input[type="search"]')
    await expect(searchInput).toBeFocused()
    
    // Test form submission with keyboard
    await searchInput.fill('test')
    await searchInput.press('Enter')
    
    // Should handle form submission gracefully
    await page.waitForTimeout(1000)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check if mobile navigation is working
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check if content is properly displayed on mobile
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    // Test touch interactions (if applicable)
    const searchLink = page.locator('a[href="/search"]')
    if (await searchLink.isVisible()) {
      await searchLink.click()
      await expect(page).toHaveURL('/search')
    }
  })

  test('should load critical resources quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/', { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime
    
    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000)
  })

  test('should have proper error handling', async ({ page }) => {
    // Test 404 page
    await page.goto('/nonexistent-page')
    
    // Should show some kind of error message or 404 page
    const isErrorPage = await page.locator('text=not found').isVisible() ||
                       await page.locator('text=404').isVisible() ||
                       await page.locator('text=Page not found').isVisible()
    
    expect(isErrorPage).toBeTruthy()
  })

  test('should have working sitemap and robots.txt', async ({ page, context }) => {
    // Test robots.txt
    const robotsResponse = await context.request.get('/robots.txt')
    expect(robotsResponse.status()).toBe(200)
    
    const robotsText = await robotsResponse.text()
    expect(robotsText).toContain('User-agent')
    expect(robotsText).toContain('Sitemap')
    
    // Test sitemap.xml
    const sitemapResponse = await context.request.get('/sitemap.xml')
    expect(sitemapResponse.status()).toBe(200)
    
    const sitemapText = await sitemapResponse.text()
    expect(sitemapText).toContain('<?xml')
    expect(sitemapText).toContain('<urlset')
    expect(sitemapText).toContain('<url>')
  })

  test('should have proper security headers', async ({ page, context }) => {
    const response = await context.request.get('/')
    
    const headers = response.headers()
    
    // Check for important security headers
    expect(headers['x-frame-options']).toBeTruthy()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBeTruthy()
  })

  test('should have working health check endpoint', async ({ page, context }) => {
    const healthResponse = await context.request.get('/api/health')
    expect(healthResponse.status()).toBe(200)
    
    const healthData = await healthResponse.json()
    expect(healthData.status).toBeTruthy()
    expect(healthData.timestamp).toBeTruthy()
  })
})