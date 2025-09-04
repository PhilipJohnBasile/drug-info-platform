'use client'

import { useState, useEffect } from 'react'

// Tailwind CSS breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export type Breakpoint = keyof typeof breakpoints

interface UseResponsiveReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLarge: boolean
  width: number
  height: number
  breakpoint: Breakpoint
  isBreakpoint: (bp: Breakpoint) => boolean
  isAbove: (bp: Breakpoint) => boolean
  isBelow: (bp: Breakpoint) => boolean
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial dimensions
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getCurrentBreakpoint = (width: number): Breakpoint => {
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'sm' // Default to sm for anything smaller
  }

  const breakpoint = getCurrentBreakpoint(dimensions.width)
  
  const isMobile = dimensions.width < breakpoints.md
  const isTablet = dimensions.width >= breakpoints.md && dimensions.width < breakpoints.lg
  const isDesktop = dimensions.width >= breakpoints.lg
  const isLarge = dimensions.width >= breakpoints.xl

  const isBreakpoint = (bp: Breakpoint): boolean => {
    return breakpoint === bp
  }

  const isAbove = (bp: Breakpoint): boolean => {
    return dimensions.width >= breakpoints[bp]
  }

  const isBelow = (bp: Breakpoint): boolean => {
    return dimensions.width < breakpoints[bp]
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    width: dimensions.width,
    height: dimensions.height,
    breakpoint,
    isBreakpoint,
    isAbove,
    isBelow,
  }
}

// Hook for mobile-first responsive classes
export function useResponsiveClasses() {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  return {
    // Container classes
    container: isMobile 
      ? 'px-4 sm:px-6' 
      : 'px-4 sm:px-6 lg:px-8',
    
    // Grid classes
    gridCols: isMobile 
      ? 'grid-cols-1' 
      : isTablet 
      ? 'grid-cols-1 md:grid-cols-2' 
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    
    // Text sizes
    heading: isMobile 
      ? 'text-2xl sm:text-3xl' 
      : 'text-3xl sm:text-4xl',
    
    subheading: isMobile 
      ? 'text-lg sm:text-xl' 
      : 'text-xl sm:text-2xl',
    
    // Spacing
    section: isMobile 
      ? 'py-8 sm:py-12' 
      : 'py-12 sm:py-16',
    
    // Flex direction
    flexDir: isMobile 
      ? 'flex-col' 
      : 'flex-col sm:flex-row',
    
    // Gap sizes
    gap: isMobile 
      ? 'gap-4' 
      : 'gap-4 sm:gap-6',
    
    // Card padding
    cardPadding: isMobile 
      ? 'p-4' 
      : 'p-4 sm:p-6',
    
    // Button sizes
    button: isMobile 
      ? 'px-4 py-2 text-sm' 
      : 'px-6 py-3 text-base',
  }
}

// Hook for touch device detection
export function useTouch() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    
    checkTouch()
  }, [])

  return isTouch
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Hook for orientation detection
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    handleOrientationChange()
    window.addEventListener('resize', handleOrientationChange)
    
    return () => window.removeEventListener('resize', handleOrientationChange)
  }, [])

  return orientation
}