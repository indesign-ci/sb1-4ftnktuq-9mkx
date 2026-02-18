export const theme = {
  colors: {
    primary: '#C5A572',
    primaryDark: '#B08D5B',
    primaryLight: '#D4BC91',
    primaryUltraLight: '#F5EFE4',

    background: '#FFFFFF',
    backgroundAlt: '#FAFAF8',
    surface: '#F5F5F3',
    surfaceHover: '#EEEEEC',

    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textOnPrimary: '#FFFFFF',

    sidebarBg: '#1A1A1A',
    sidebarBgAlt: '#2D2D2D',
    sidebarText: '#E5E5E5',
    sidebarTextMuted: '#9CA3AF',
    sidebarActive: '#C5A572',

    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',

    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    borderFocus: '#C5A572',
  },

  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.06)',
    lg: '0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.05)',
    xl: '0 20px 25px rgba(0,0,0,0.05), 0 10px 10px rgba(0,0,0,0.04)',
    gold: '0 4px 14px rgba(197,165,114,0.15)',
    goldHover: '0 8px 25px rgba(197,165,114,0.25)',
    soft: '0 2px 15px rgba(0,0,0,0.04)',
    card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  },

  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
} as const

export type Theme = typeof theme
