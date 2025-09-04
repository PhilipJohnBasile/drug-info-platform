// Critical CSS for above-the-fold content
export const criticalCSS = `
  /* Reset and base styles */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }

  body {
    font-family: inherit;
    line-height: inherit;
    color: #1e293b;
    background-color: #f8fafc;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Header styles */
  .header {
    background-color: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .header-nav {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 4rem;
  }

  .logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: #3b82f6;
    text-decoration: none;
    transition: color 150ms;
  }

  .logo:hover {
    color: #1d4ed8;
  }

  .nav-links {
    display: none;
    align-items: center;
    gap: 2rem;
  }

  @media (min-width: 768px) {
    .nav-links {
      display: flex;
    }
  }

  .nav-link {
    color: #64748b;
    text-decoration: none;
    transition: color 150ms;
  }

  .nav-link:hover {
    color: #1e293b;
  }

  /* Main content area */
  .main-content {
    flex: 1;
    min-height: calc(100vh - 4rem);
  }

  /* Card styles for above-the-fold content */
  .card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }

  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .card-body {
    padding: 1.5rem;
  }

  /* Typography */
  .text-3xl {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .text-4xl {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }

  .font-bold {
    font-weight: 700;
  }

  .font-semibold {
    font-weight: 600;
  }

  .text-secondary-900 {
    color: #1e293b;
  }

  .text-secondary-700 {
    color: #374151;
  }

  .text-secondary-600 {
    color: #4b5563;
  }

  /* Layout utilities */
  .container {
    max-width: 64rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-4 {
    gap: 1rem;
  }

  .mb-2 {
    margin-bottom: 0.5rem;
  }

  .mb-4 {
    margin-bottom: 1rem;
  }

  .mb-6 {
    margin-bottom: 1.5rem;
  }

  .py-8 {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  /* Responsive utilities */
  @media (min-width: 640px) {
    .sm\\:px-6 {
      padding-left: 1.5rem;
      padding-right: 1.5rem;
    }
    
    .sm\\:text-4xl {
      font-size: 2.25rem;
      line-height: 2.5rem;
    }
  }

  @media (min-width: 1024px) {
    .lg\\:px-8 {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  }

  /* Loading skeleton animation */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Focus styles for accessibility */
  :focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Reduce motion for users who prefer it */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

// Function to inject critical CSS
export function injectCriticalCSS() {
  if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('critical-css')
    if (!existingStyle) {
      const style = document.createElement('style')
      style.id = 'critical-css'
      style.innerHTML = criticalCSS
      document.head.insertBefore(style, document.head.firstChild)
    }
  }
}