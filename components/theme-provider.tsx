'use client'

import * as React from 'react'

// next-themes removed — it injects a <script> tag for FOUC prevention
// which triggers React's "script tag" warning in the Next.js lite runtime.
// Theme is handled via CSS classes on the html element in globals.css instead.

interface ThemeProviderProps {
  children: React.ReactNode
  [key: string]: unknown
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>
}
