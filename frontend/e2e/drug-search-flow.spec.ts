import { test, expect } from '@playwright/test'

test.describe('Drug Search and Browse Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
  })

  test('should navigate to homepage and display navigation', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Drug Information Platform/i)
    
    // Check navigation elements
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('a[href="/"]')).toBeVisible()
    await expect(page.locator('a[href="/search"]')).toBeVisible()
    await expect(page.locator('a[href="/drugs"]')).toBeVisible()
  })

  test('should search for drugs from homepage', async ({ page }) => {
    // Navigate to search page
    await page.click('a[href="/search"]')
    await expect(page).toHaveURL('/search')
    
    // Check search page elements
    await expect(page.locator('h1')).toContainText('Search Drug Information')
    await expect(page.locator('input[type="search"]')).toBeVisible()
    
    // Perform search
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('lisinopril')
    await searchInput.press('Enter')
    
    // Wait for search results
    await page.waitForTimeout(2000) // Allow for API call
    
    // Check if results are displayed or no results message
    const resultsContainer = page.locator('[data-testid="search-results"]').or(page.locator('.space-y-4'))
    await expect(resultsContainer).toBeVisible()
  })

  test('should handle empty search results gracefully', async ({ page }) => {
    await page.goto('/search')
    
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('nonexistentdrugxyz123')
    await searchInput.press('Enter')
    
    await page.waitForTimeout(2000)
    
    // Should show no results message
    await expect(page.locator('text=No results found')).toBeVisible()
  })

  test('should navigate to drug detail page', async ({ page }) => {
    await page.goto('/search')
    
    // Search for a drug
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('lisinopril')
    await searchInput.press('Enter')
    
    await page.waitForTimeout(2000)
    
    // Click on first search result if available
    const firstResult = page.locator('article').first().locator('a').first()
    
    if (await firstResult.isVisible()) {
      await firstResult.click()
      
      // Should navigate to drug detail page
      await expect(page).toHaveURL(/\/drugs\/[^\/]+$/)
      
      // Check drug detail page structure
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('should display drug information with proper structure', async ({ page }) => {
    // Try to visit a known drug page (this assumes seeded data)
    const response = await page.goto('/drugs/lisinopril', { waitUntil: 'networkidle' })
    
    // If the page loads successfully (seeded data exists)
    if (response?.status() === 200) {
      // Check page structure
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('header')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
      
      // Check drug information sections
      const sections = [
        'Overview',
        'Indications and Usage',
        'Warnings and Precautions',
        'Drug Information'
      ]
      
      for (const section of sections) {
        const sectionElement = page.locator(`h2:has-text("${section}")`).or(
          page.locator(`h3:has-text("${section}")`)
        )
        if (await sectionElement.count() > 0) {
          await expect(sectionElement.first()).toBeVisible()
        }
      }
    } else {
      // If no seeded data, check 404 handling
      await expect(page.locator('text=not found')).toBeVisible()
    }
  })

  test('should display FAQ section when available', async ({ page }) => {
    const response = await page.goto('/drugs/lisinopril', { waitUntil: 'networkidle' })
    
    if (response?.status() === 200) {
      // Look for FAQ section
      const faqHeading = page.locator('h2:has-text("Frequently Asked Questions")')
      
      if (await faqHeading.count() > 0) {
        await expect(faqHeading).toBeVisible()
        
        // Check for FAQ items
        const faqItems = page.locator('.faq-item').or(page.locator('[data-testid="faq-item"]'))
        if (await faqItems.count() > 0) {
          await expect(faqItems.first()).toBeVisible()
        }
      }
    }
  })

  test('should handle 404 errors gracefully', async ({ page }) => {
    const response = await page.goto('/drugs/nonexistent-drug-12345', { waitUntil: 'networkidle' })
    
    // Should show 404 page or not found message
    expect(response?.status()).toBe(404)
    await expect(page.locator('text=not found')).toBeVisible()
  })
})