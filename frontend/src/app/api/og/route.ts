import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const drugName = searchParams.get('drug') || 'Drug Information';
    
    // For now, return a simple SVG OG image
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad1)" />
        <rect x="100" y="150" width="1000" height="330" rx="20" fill="white" fill-opacity="0.95" />
        <text x="600" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="#1e293b">
          ${drugName}
        </text>
        <text x="600" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#64748b">
          Drug Information Platform
        </text>
        <text x="600" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#64748b">
          💊 Comprehensive Medical Reference
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Fallback SVG
    const fallbackSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#3b82f6" />
        <text x="600" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="white">
          Drug Information Platform
        </text>
      </svg>
    `;

    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}