import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        heading: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-luxe': 'linear-gradient(135deg, #1A1A1A 0%, #2D2A26 50%, #1A1A1A 100%)',
        'gradient-or': 'linear-gradient(135deg, #C8A97E 0%, #E8D5B5 50%, #C8A97E 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #FFFDF9 0%, #F8F5F0 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        luxe: {
          50: '#FFFDF9',
          100: '#F8F5F0',
          200: '#F0EBE3',
          300: '#E8E0D5',
          400: '#D4C5B0',
          500: '#C8A97E',
          600: '#B8956A',
          700: '#A68B5B',
          800: '#8C7E6F',
          900: '#6B6159',
          950: '#1A1A1A',
        },
        or: {
          DEFAULT: '#C8A97E',
          light: '#E8D5B5',
          dark: '#A68B5B',
          muted: '#D4C5B0',
        },
        gold: {
          '50': '#FBF8F1',
          '100': '#F5EFE4',
          '200': '#E8D9BE',
          '300': '#D4BC91',
          '400': '#C5A572',
          '500': '#C5A572',
          '600': '#B08D5B',
          '700': '#967545',
          '800': '#7A5E38',
          '900': '#5E472B',
        },
        anthracite: {
          '50': '#F5F5F5',
          '100': '#E5E5E5',
          '200': '#D4D4D4',
          '300': '#A3A3A3',
          '400': '#737373',
          '500': '#525252',
          '600': '#404040',
          '700': '#2D2D2D',
          '800': '#1A1A1A',
          '900': '#0A0A0A',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      boxShadow: {
        gold: '0 4px 14px rgba(197,165,114,0.15)',
        'gold-hover': '0 8px 25px rgba(197,165,114,0.25)',
        soft: '0 2px 15px rgba(0,0,0,0.04)',
        luxe: '0 4px 30px rgba(200, 169, 126, 0.08)',
        'luxe-lg': '0 10px 60px rgba(200, 169, 126, 0.12)',
        'luxe-xl': '0 20px 80px rgba(200, 169, 126, 0.15)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scale-in': {
          from: {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        float: 'float 6s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
